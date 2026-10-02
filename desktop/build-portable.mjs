import { spawn } from 'node:child_process';
import { openSync, closeSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, readdir, rm, writeFile, chmod, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const platform = process.platform, arch = process.arch;
if (!['darwin', 'win32'].includes(platform) || !['x64', 'arm64'].includes(arch)) throw new Error('Build on the target macOS/Windows architecture');
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
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
await run('cargo', ['build', '--release', '--locked', '--manifest-path', 'desktop/native/Cargo.toml'], { env: { ...process.env, ...(platform === 'darwin' ? { MACOSX_DEPLOYMENT_TARGET: '13.5' } : {}) } });
await rm(bundle, { recursive: true, force: true });
await mkdir(app, { recursive: true }); await mkdir(nodeDir, { recursive: true }); await mkdir(dirname(binary), { recursive: true });
for (const path of ['dist', 'addon', 'skills', 'LICENSE', 'package.json', 'package-lock.json']) await cp(join(root, path), join(app, path), { recursive: true });
await cp(join(root, 'desktop/native/target/release', platform === 'win32' ? 'wps-assistant-tray.exe' : 'wps-assistant-tray'), binary);
await npmRun(['ci', '--omit=dev', '--no-audit', '--no-fund'], { cwd: app });
await rm(join(app, 'package-lock.json'));
// The SDK's published shrinkwrap includes every esbuild platform. Keep this target only.
const moduleRoot = join(app, 'node_modules');
async function pruneEsbuild(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const path = join(directory, entry.name);
    if (entry.name === '@esbuild') {
      for (const target of await readdir(path)) if (target !== `${platform}-${arch}`) await rm(join(path, target), { recursive: true, force: true });
    } else await pruneEsbuild(path);
  }
}
await pruneEsbuild(moduleRoot);
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
if (platform === 'darwin') {
  await writeFile(join(bundle, 'Contents/Info.plist'), `<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"><plist version="1.0"><dict><key>CFBundleName</key><string>WPS Assistant</string><key>CFBundleDisplayName</key><string>WPS 助手</string><key>CFBundleIdentifier</key><string>com.local.wps-assistant</string><key>CFBundleExecutable</key><string>wps-assistant</string><key>CFBundlePackageType</key><string>APPL</string><key>CFBundleShortVersionString</key><string>${pkg.version}</string><key>CFBundleVersion</key><string>${pkg.version}</string><key>LSUIElement</key><true/><key>LSMinimumSystemVersion</key><string>13.5</string></dict></plist>\n`);
  const identity = process.env.WPS_MCP_CODESIGN_IDENTITY ?? '-';
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
console.log(`Portable bundle: ${bundle}\nArchive: ${output} (${((await stat(output)).size / 1024 / 1024).toFixed(1)} MiB)`);
