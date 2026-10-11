import { spawn } from 'node:child_process';
import { openSync, closeSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, readdir, readlink, rm, writeFile, chmod, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { syncVersion } from '../scripts/sync-version.mjs';
import { pruneUnusedProviders } from './prune-runtime.mjs';
import { buildSelfExtractingExe } from './build-sfx.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
await syncVersion(root);
const platform = process.platform, arch = process.arch;
if (!['darwin', 'win32'].includes(platform) || !['x64', 'arm64'].includes(arch)) throw new Error('Build on the target macOS/Windows architecture');
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const lockedPackages = JSON.parse(await readFile(join(root, 'package-lock.json'), 'utf8')).packages;
const nativeVersion = (await readFile(join(root, 'desktop/native/Cargo.toml'), 'utf8')).match(/^version = "([^"]+)"/m)?.[1];
if (nativeVersion !== pkg.version) throw new Error('Native Cargo version must match package.json');
const nodeVersion = '24.21.0';
const build = join(root, '.dev', `portable-${platform}-${arch}`);
const release = join(root, 'release');
const name = `wps-assistant-${pkg.version}-${platform}-${arch}`;
const bundle = join(build, platform === 'darwin' ? 'WPS Assistant.app' : 'WPS Assistant');
const resources = platform === 'darwin' ? join(bundle, 'Contents/Resources') : join(bundle, 'resources');
const app = join(resources, 'app');
const binary = join(bundle, platform === 'darwin' ? 'Contents/MacOS/wps-assistant' : 'wps-assistant.exe');
const nodeDir = join(resources, 'runtime');
const node = join(nodeDir, platform === 'darwin' ? 'node' : 'node.exe');
export function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, stdio: 'inherit', ...options });
    child.once('error', reject);
    child.once('exit', code => code === 0 ? resolve() : reject(new Error(`${command} exited ${code}`)));
  });
}
const npm = platform === 'win32' ? 'npm.cmd' : 'npm';
// Windows .cmd requires cmd.exe; all arguments here are fixed build commands.
const npmRun = (args, options) => platform === 'win32'
  ? run(process.env.ComSpec ?? 'cmd.exe', ['/d', '/s', '/c', `npm ${args.join(' ')}`], options)
  : run(npm, args, options);
async function download(url, destination) {
  // Build-time curl uses the host's trusted certificates; no network client is bundled.
  await run(platform === 'win32' ? 'curl.exe' : 'curl', ['--fail', '--location', '--silent', '--show-error', '--max-time', '180', '--output', destination, url]);
}
async function files(directory, visit) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await files(path, visit);
    else if (entry.isFile()) await visit(path, entry.name);
  }
}
await npmRun(['run', 'build']);
const nativeTarget = platform === 'win32' ? `${arch === 'x64' ? 'x86_64' : 'aarch64'}-pc-windows-msvc` : undefined;
const rustEnvironment = { ...process.env, ...(platform === 'darwin' ? { MACOSX_DEPLOYMENT_TARGET: '13.5' } : {}) };
if (nativeTarget) rustEnvironment[`CARGO_TARGET_${nativeTarget.toUpperCase().replaceAll('-', '_')}_RUSTFLAGS`] = '-C target-feature=+crt-static';
await run('cargo', ['build', '--release', '--locked', '--manifest-path', 'desktop/native/Cargo.toml', ...(nativeTarget ? ['--target', nativeTarget] : [])], { env: rustEnvironment });
await rm(bundle, { recursive: true, force: true });
await mkdir(app, { recursive: true }); await mkdir(nodeDir, { recursive: true }); await mkdir(dirname(binary), { recursive: true });
for (const path of ['dist', 'addon', 'skills', 'LICENSE', 'package.json', 'package-lock.json']) await cp(join(root, path), join(app, path), { recursive: true });
await cp(join(root, 'desktop/native/target', nativeTarget ?? '', 'release', platform === 'win32' ? 'wps-assistant-tray.exe' : 'wps-assistant-tray'), binary);
await npmRun(['ci', '--omit=dev', '--no-audit', '--no-fund'], { cwd: app });
// Some npm versions reapply the SDK's shrinkwrap over the root lock's patched leaf.
// Restore the exact locked tarball, checking integrity before extraction.
const braceKey = 'node_modules/@earendil-works/pi-coding-agent/node_modules/brace-expansion';
const braceLock = lockedPackages[braceKey];
if (braceLock?.version !== '5.0.12' || !braceLock.resolved?.startsWith('https://registry.npmjs.org/brace-expansion/')) throw new Error('Keep the bundled brace-expansion security patch locked at 5.0.12');
const braceDirectory = join(app, braceKey);
if (JSON.parse(await readFile(join(braceDirectory, 'package.json'), 'utf8')).version !== braceLock.version) {
  const patch = join(build, 'brace-security-patch'); await rm(patch, { recursive: true, force: true }); await mkdir(patch, { recursive: true });
  const tarball = join(patch, 'locked.tgz'); await download(braceLock.resolved, tarball);
  if (`sha512-${createHash('sha512').update(await readFile(tarball)).digest('base64')}` !== braceLock.integrity) throw new Error('Bundled security patch integrity mismatch');
  await run('tar', ['-xzf', tarball, '-C', patch]);
  const replacement = join(patch, 'package');
  const patchPackage = JSON.parse(await readFile(join(replacement, 'package.json'), 'utf8'));
  if (patchPackage.name !== 'brace-expansion' || patchPackage.version !== braceLock.version) throw new Error('Bundled security patch package mismatch');
  await rm(braceDirectory, { recursive: true }); await cp(replacement, braceDirectory, { recursive: true });
}
await npmRun(['audit', '--omit=dev', '--audit-level=high', '--registry=https://registry.npmjs.org'], { cwd: app });
await rm(join(app, 'package-lock.json'));
const moduleRoot = join(app, 'node_modules');
// 移除进程内永远不会加载的 provider SDK 及其传递依赖，判定依据见 desktop/prune-runtime.mjs。
// 审计保持在上一步、按 package-lock 的生产依赖集合执行，裁剪后不再单独复算。
const pruned = await pruneUnusedProviders(app);
console.log(`Pruned ${pruned.packages} unused provider packages (${(pruned.bytes / 1048576).toFixed(1)} MiB).`);
// Maps and TypeScript declarations are unused at runtime; preserve JS, data, WASM and notices.
await files(moduleRoot, async (path, file) => {
  if (/\.map$|\.d\.(?:ts|mts|cts)$/.test(file)) await rm(path);
});
await rm(join(moduleRoot, '@earendil-works/pi-coding-agent/dist/bundle'), { recursive: true, force: true });
for (const directory of ['docs', 'examples']) await rm(join(moduleRoot, '@earendil-works/pi-coding-agent', directory), { recursive: true, force: true });
const distribution = `node-v${nodeVersion}-${platform === 'darwin' ? 'darwin' : 'win'}-${arch}`;
const archive = `${distribution}.${platform === 'darwin' ? 'tar.gz' : 'zip'}`;
const cache = join(root, '.dev', 'node-runtime'); await mkdir(cache, { recursive: true });
const archivePath = join(cache, archive);
const url = `https://nodejs.org/dist/v${nodeVersion}/`;
await download(`${url}SHASUMS256.txt`, join(cache, 'SHASUMS256.txt'));
const sums = await readFile(join(cache, 'SHASUMS256.txt'), 'utf8');
const expected = sums.split('\n').map(line => line.trim().split(/\s+/)).find(parts => parts[1] === archive)?.[0];
if (!expected || !/^[a-f0-9]{64}$/.test(expected)) throw new Error('Official Node checksum missing');
let bytes;
try { bytes = await readFile(archivePath); } catch { /* Download below. */ }
if (!bytes || createHash('sha256').update(bytes).digest('hex') !== expected) {
  await download(`${url}${archive}`, archivePath); bytes = await readFile(archivePath);
}
if (createHash('sha256').update(bytes).digest('hex') !== expected) throw new Error('Node archive checksum mismatch');
if (platform === 'darwin') await run('tar', ['-xzf', archivePath, '-C', cache, `${distribution}/bin/node`, `${distribution}/LICENSE`]);
else {
  // Read paths from environment, never interpolate them into a PowerShell program.
  await run('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', 'Expand-Archive -LiteralPath $env:WPS_BUILD_ARCHIVE -DestinationPath $env:WPS_BUILD_EXTRACT -Force'], { env: { ...process.env, WPS_BUILD_ARCHIVE: archivePath, WPS_BUILD_EXTRACT: cache } });
}
await cp(join(cache, distribution, platform === 'darwin' ? 'bin/node' : 'node.exe'), node);
await cp(join(cache, distribution, 'LICENSE'), join(nodeDir, 'LICENSE'));
await chmod(binary, 0o755); await chmod(node, 0o755);
// Include licenses for the Rust packages compiled into the executable.
const notices = join(resources, 'licenses/native'); await mkdir(notices, { recursive: true });
await cp(join(root, 'desktop/third-party'), join(resources, 'licenses/third-party'), { recursive: true });
const metadataPath = join(build, 'cargo-metadata.json');
const metadataFd = openSync(metadataPath, 'w');
try { await run('cargo', ['metadata', '--locked', '--format-version', '1', '--manifest-path', 'desktop/native/Cargo.toml'], { stdio: ['ignore', metadataFd, 'inherit'] }); }
finally { closeSync(metadataFd); }
const metadata = JSON.parse(await readFile(metadataPath, 'utf8'));
for (const crate of metadata.packages) {
  const directory = dirname(crate.manifest_path);
  for (const file of await readdir(directory)) {
    if (!/^(LICENSE|COPYING|NOTICE)/i.test(file) || !(await stat(join(directory, file))).isFile()) continue;
    await mkdir(join(notices, `${crate.name}-${crate.version}`), { recursive: true });
    await cp(join(directory, file), join(notices, `${crate.name}-${crate.version}`, file));
  }
}
await writeFile(join(resources, 'licenses/native-packages.json'), JSON.stringify(metadata.packages.map(({ name, version, license, repository }) => ({ name, version, license, repository })), null, 2));
const sysrootPath = join(build, 'rust-sysroot.txt');
const sysrootFd = openSync(sysrootPath, 'w');
try { await run('rustc', ['--print', 'sysroot'], { stdio: ['ignore', sysrootFd, 'inherit'] }); } finally { closeSync(sysrootFd); }
const rustDocs = join((await readFile(sysrootPath, 'utf8')).trim(), 'share/doc/rust');
await cp(join(rustDocs, 'COPYRIGHT-library.html'), join(resources, 'licenses/Rust-standard-library.html'));
await cp(join(rustDocs, 'licenses'), join(resources, 'licenses/rust'), { recursive: true });
await writeFile(join(resources, 'portable.json'), JSON.stringify({ version: pkg.version, node: nodeVersion, platform, arch, nodeArchiveSha256: expected }, null, 2));
const identity = process.env.WPS_MCP_CODESIGN_IDENTITY ?? '-';
if (platform === 'darwin') {
  await writeFile(join(bundle, 'Contents/Info.plist'), `<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"><plist version="1.0"><dict><key>CFBundleName</key><string>WPS Assistant</string><key>CFBundleDisplayName</key><string>WPS 助手</string><key>CFBundleIdentifier</key><string>com.local.wps-assistant</string><key>CFBundleExecutable</key><string>wps-assistant</string><key>CFBundlePackageType</key><string>APPL</string><key>CFBundleShortVersionString</key><string>${pkg.version}</string><key>CFBundleVersion</key><string>${pkg.version}</string><key>LSUIElement</key><true/><key>LSMinimumSystemVersion</key><string>13.5</string></dict></plist>\n`);
  if (identity !== '-') {
    // Notarization scans nested Mach-O files too. Preserve Node's JIT entitlements.
    await run('codesign', ['--force', '--sign', identity, '--options', 'runtime', '--timestamp', '--preserve-metadata=entitlements', node]);
    await files(moduleRoot, async path => {
      const handle = await (await import('node:fs/promises')).open(path, 'r');
      const header = Buffer.alloc(4);
      try { await handle.read(header, 0, 4, 0); } finally { await handle.close(); }
      if (['cffaedfe', 'cefaedfe', 'feedfacf', 'feedface', 'cafebabe', 'bebafeca'].includes(header.toString('hex'))) {
        await run('codesign', ['--force', '--sign', identity, '--options', 'runtime', '--timestamp', path]);
      }
    });
  }
  await run('codesign', ['--force', '--sign', identity, ...(identity === '-' ? [] : ['--options', 'runtime', '--timestamp']), bundle]);
} else if (process.env.WPS_MCP_SIGNTOOL_CERT_SHA1) {
  await run('signtool.exe', ['sign', '/sha1', process.env.WPS_MCP_SIGNTOOL_CERT_SHA1, '/fd', 'SHA256', '/tr', 'http://timestamp.digicert.com', '/td', 'SHA256', binary]);
}
await mkdir(release, { recursive: true });
const output = join(release, `${name}.zip`); await rm(output, { force: true });
if (platform === 'darwin') await run('ditto', ['-c', '-k', '--keepParent', bundle, output]);
else await run('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', 'Compress-Archive -LiteralPath $env:WPS_BUILD_BUNDLE -DestinationPath $env:WPS_BUILD_OUTPUT -CompressionLevel Optimal'], { env: { ...process.env, WPS_BUILD_BUNDLE: bundle, WPS_BUILD_OUTPUT: output } });
if (platform === 'darwin' && process.env.WPS_MCP_NOTARY_PROFILE) {
  await run('xcrun', ['notarytool', 'submit', output, '--keychain-profile', process.env.WPS_MCP_NOTARY_PROFILE, '--wait']);
  await run('xcrun', ['stapler', 'staple', bundle]);
  await rm(output); await run('ditto', ['-c', '-k', '--keepParent', bundle, output]);
}
// Validate what users receive, including archive layout and executable permissions.
const extracted = join(build, 'archive-check'); await rm(extracted, { recursive: true, force: true }); await mkdir(extracted);
if (platform === 'darwin') await run('ditto', ['-x', '-k', output, extracted]);
else await run('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', 'Expand-Archive -LiteralPath $env:WPS_BUILD_ARCHIVE -DestinationPath $env:WPS_BUILD_EXTRACT -Force'], { env: { ...process.env, WPS_BUILD_ARCHIVE: output, WPS_BUILD_EXTRACT: extracted } });
await run(process.execPath, ['desktop/smoke-portable.mjs', join(extracted, platform === 'darwin' ? 'WPS Assistant.app' : 'WPS Assistant')]);
const digest = createHash('sha256').update(await readFile(output)).digest('hex');
await writeFile(`${output}.sha256`, `${digest}  ${name}.zip\n`);
let diskImage;
if (platform === 'darwin') {
  // macOS 的常规分发形态：用户把 .app 拖进 Applications，不必先解压。
  // HFS+ 配 zlib-level=9 时与 ZIP 体积基本持平；hdiutil 默认的 APFS 容器会大出四成以上。
  diskImage = join(release, `${name}.dmg`); await rm(diskImage, { force: true });
  const staging = join(build, 'dmg-staging'); await rm(staging, { recursive: true, force: true }); await mkdir(staging, { recursive: true });
  // 用 ditto 而不是 cp：保留扩展属性，避免破坏 .app 的代码签名。
  await run('ditto', [bundle, join(staging, 'WPS Assistant.app')]);
  // 只放软链，不把目标机的 Applications 打进去。
  await run('ln', ['-s', '/Applications', join(staging, 'Applications')]);
  await run('hdiutil', ['create', '-volname', 'WPS Assistant', '-srcfolder', staging, '-ov', '-fs', 'HFS+', '-imagekey', 'zlib-level=9', '-format', 'UDZO', diskImage]);
  // 默认构建是 ad-hoc 签名，给镜像本身签名没有意义，只在有正式身份时执行。
  if (identity !== '-') await run('codesign', ['--force', '--sign', identity, '--options', 'runtime', '--timestamp', diskImage]);
  if (process.env.WPS_MCP_NOTARY_PROFILE) {
    await run('xcrun', ['notarytool', 'submit', diskImage, '--keychain-profile', process.env.WPS_MCP_NOTARY_PROFILE, '--wait']);
    await run('xcrun', ['stapler', 'staple', diskImage]);
  }
  // 按用户实际看到的结构复核，并在只读挂载卷上再跑一次隔离 smoke。
  const mounted = join(build, 'dmg-check'); await rm(mounted, { recursive: true, force: true }); await mkdir(mounted, { recursive: true });
  await run('hdiutil', ['attach', diskImage, '-nobrowse', '-readonly', '-mountpoint', mounted]);
  try {
    if (await readlink(join(mounted, 'Applications')) !== '/Applications') throw new Error('Disk image Applications shortcut must be a link to /Applications');
    await run(process.execPath, ['desktop/smoke-portable.mjs', join(mounted, 'WPS Assistant.app')]);
  } finally {
    try { await run('hdiutil', ['detach', mounted]); } catch { await run('hdiutil', ['detach', mounted, '-force']); }
  }
  const imageDigest = createHash('sha256').update(await readFile(diskImage)).digest('hex');
  await writeFile(`${diskImage}.sha256`, `${imageDigest}  ${name}.dmg\n`);
}
let singleFile;
let singleEntries = 0;
if (platform === 'win32') {
  // 自解压单文件：用户只拿到一个 exe，首次运行把载荷落盘到用户目录（WPS_MCP_EXTRACT_DIR 可覆盖）。
  // ZIP 形态继续保留，便于对照排查与回退。
  singleFile = join(release, `${name}.exe`); await rm(singleFile, { force: true });
  const built = await buildSelfExtractingExe({ tray: binary, bundle, version: pkg.version, output: singleFile });
  singleEntries = built.entries;
  // 用打包出来的 exe 自己解压一次，再对解压结果跑同一套 smoke，确认载荷完整且可运行。
  const expandRoot = join(build, 'sfx-check'); await rm(expandRoot, { recursive: true, force: true }); await mkdir(expandRoot, { recursive: true });
  await run(singleFile, ['--smoke'], { env: { ...process.env, WPS_MCP_EXTRACT_DIR: expandRoot } });
  await run(process.execPath, ['desktop/smoke-portable.mjs', join(expandRoot, pkg.version)]);
  const singleDigest = createHash('sha256').update(await readFile(singleFile)).digest('hex');
  await writeFile(`${singleFile}.sha256`, `${singleDigest}  ${name}.exe\n`);
}
const megabytes = async path => ((await stat(path)).size / 1024 / 1024).toFixed(1);
console.log([
  `Portable bundle: ${bundle}`,
  `Archive: ${output} (${await megabytes(output)} MiB)`,
  diskImage ? `Disk image: ${diskImage} (${await megabytes(diskImage)} MiB)` : null,
  singleFile ? `Single file: ${singleFile} (${await megabytes(singleFile)} MiB, ${singleEntries} entries)` : null,
].filter(Boolean).join('\n'));
