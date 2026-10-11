// 裁剪「仍被声明、但在进程内永远不会被加载」的 provider SDK。
//
// 依据（见 SPEC 第 25.6 节）：
// - src/config.ts 把模型 api 限定为 openai-completions | openai-responses，
//   其余厂商实现只在 pi-ai/dist/api/*.lazy.js 的 () => import(...) 之后可达。
// - esbuild 只被 @earendil-works/chord 的 bundle 静态引用（用于编译 TS 扩展），
//   而 pi 各包的 dist 都不引用 chord，本项目也只发布 markdown skills。
//   若将来要支持 TS 扩展，必须把 esbuild 从阻断列表移回。
//
// 做法：先声明被阻断的 provider，再按 package.json 依赖求可达闭包，闭包外的包整体删除。
// 这样 SDK 升版新增的传递依赖会被自动带走，不需要手工维护删除清单。
import { readdir, readFile, rm, stat } from 'node:fs/promises';
import { basename, dirname, join, sep } from 'node:path';

const blockedProviders = ['@anthropic-ai', '@google', '@aws-sdk', '@smithy', '@aws-crypto', '@mistralai', '@esbuild', 'esbuild'];
// 裁剪决策的依据：这些 provider 必须仍在生产依赖里。不在了说明 SDK 架构变了，需要重新评估。
const requiredProviders = ['@anthropic-ai', '@google', '@aws-sdk', '@smithy', '@esbuild', 'esbuild'];

const matchesScope = (name, scope) => name === scope || name.startsWith(`${scope}/`);
const isBlocked = name => blockedProviders.some(scope => matchesScope(name, scope));

async function directorySize(directory) {
  let total = 0;
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) total += await directorySize(path);
    else if (entry.isFile()) total += (await stat(path)).size;
  }
  return total;
}

export async function pruneUnusedProviders(appRoot) {
  const packages = new Map();
  const binDirectories = new Set();
  const scopeDirectories = new Set();
  async function scan(directory) {
    let entries;
    try { entries = await readdir(directory, { withFileTypes: true }); } catch { return; }
    binDirectories.add(join(directory, '.bin'));
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name === '.bin') continue;
      const path = join(directory, entry.name);
      if (entry.name.startsWith('@')) { scopeDirectories.add(path); await scan(path); continue; }
      let manifest;
      try { manifest = JSON.parse(await readFile(join(path, 'package.json'), 'utf8')); } catch { continue; }
      if (!manifest.name) continue;
      packages.set(path, { path, name: manifest.name, bin: manifest.bin, dependencies: { ...manifest.dependencies, ...manifest.optionalDependencies } });
      await scan(join(path, 'node_modules'));
    }
  }
  await scan(join(appRoot, 'node_modules'));
  for (const scope of requiredProviders) {
    if (![...packages.values()].some(pkg => matchesScope(pkg.name, scope))) throw new Error(`Provider ${scope} is missing from the production install; revisit the provider prune`);
  }

  function resolveDependency(from, name) {
    for (let directory = from; ;) {
      const candidate = join(directory, 'node_modules', name);
      if (packages.has(candidate)) return candidate;
      if (directory === appRoot) return null;
      const parent = dirname(directory);
      if (parent === directory) return null;
      directory = parent;
    }
  }

  const roots = JSON.parse(await readFile(join(appRoot, 'package.json'), 'utf8')).dependencies ?? {};
  const reachable = new Set();
  const pending = [];
  for (const name of Object.keys(roots)) {
    const target = resolveDependency(appRoot, name);
    if (!target) throw new Error(`Direct dependency ${name} is missing from the production install`);
    if (!reachable.has(target)) { reachable.add(target); pending.push(target); }
  }
  while (pending.length > 0) {
    const current = packages.get(pending.pop());
    for (const name of Object.keys(current.dependencies)) {
      if (isBlocked(name)) continue;
      const target = resolveDependency(current.path, name);
      if (target && !reachable.has(target)) { reachable.add(target); pending.push(target); }
    }
  }

  const dropped = [...packages.values()].filter(entry => !reachable.has(entry.path)).sort((a, b) => a.path.length - b.path.length);
  const droppedRoots = [];
  const droppedBins = new Set();
  let bytes = 0;
  for (const entry of dropped) {
    // 已被删除的父目录带走时跳过，避免重复统计和无效删除。
    if (droppedRoots.some(root => entry.path.startsWith(root + sep))) continue;
    droppedRoots.push(entry.path);
    bytes += await directorySize(entry.path);
    droppedBins.add(entry.name.split('/').pop());
    if (entry.bin && typeof entry.bin === 'object') for (const name of Object.keys(entry.bin)) droppedBins.add(name);
    await rm(entry.path, { recursive: true, force: true });
  }
  // bin shim 由 npm 生成，不属于包目录，需要按名字单独清理。
  for (const directory of binDirectories) {
    let entries;
    try { entries = await readdir(directory); } catch { continue; }
    for (const name of entries) if (droppedBins.has(name.replace(/\.(?:cmd|ps1)$/i, ''))) await rm(join(directory, name), { force: true });
  }
  // 被阻断的作用域目录在包被删除后可能留空；npm 为跳过的可选平台包也会留下空占位目录，一并回收。
  for (const directory of scopeDirectories) {
    if (!blockedProviders.includes(basename(directory))) continue;
    try { if ((await readdir(directory)).length === 0) await rm(directory, { recursive: true, force: true }); } catch { /* 已随父级删除 */ }
  }
  return { packages: droppedRoots.length, bytes };
}
