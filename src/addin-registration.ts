import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync, constants } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { randomBytes } from "node:crypto";
export function registerAddins(directory: string, port: string, enable: string, platform: string) {
  if (!/^\d+$/.test(port) || Number(port) < 1025 || Number(port) > 65535 || !/^[\w-]+$/.test(enable)) throw new Error('Invalid port or Add-in enable setting');
  const hosts: [string, string][] = [['et', 'WpsMcpET'], ['wpp', 'WpsMcpWPP'], ['wps', 'WpsMcpWPS']];
  const publishPath = join(directory, 'publish.xml');
  const original = existsSync(publishPath) ? readFileSync(publishPath, 'utf8') : null;
  let publish = original ?? '<?xml version="1.0" encoding="UTF-8"?>\n<jsplugins>\n</jsplugins>\n';
  if ((publish.match(/<\/jsplugins>/gi) ?? []).length !== 1) throw new Error('Invalid publish.xml; left unchanged');
  const eol = publish.includes('\r\n') ? '\r\n' : '\n';
  const entry = ([host, name]: [string, string]) => `<jspluginonline name="${name}" url="http://127.0.0.1:${port}/addins/${host}/" type="${host}" enable="${enable}" debug="" install="null"/>`;
  const seen = new Set<string>();
  publish = publish.replace(/<jsplugin(?:online)?\b[^>]*\bname\s*=\s*["'](WpsMcpET|WpsMcpWPP|WpsMcpWPS)["'][^>]*\/?>/gi, (tag, name) => {
    if (seen.has(name)) return '';
    seen.add(name);
    return entry(hosts.find(host => host[1] === name)!);
  });
  const missing = hosts.filter(host => !seen.has(host[1]));
  if (missing.length) publish = publish.replace(/<\/jsplugins>/i, missing.map(host => '  ' + entry(host)).join(eol) + eol + '</jsplugins>');
  const changes: [string, string | null, string, string][] = [[publishPath, original, publish, '.backup-before-wps-mcp']];
  if (platform === 'darwin') {
    const authPath = join(directory, 'authaddin.json');
    const oldAuth = existsSync(authPath) ? readFileSync(authPath, 'utf8') : null;
    const auth = oldAuth === null ? {} : JSON.parse(oldAuth);
    const isObject = (value: unknown) => value !== null && typeof value === 'object' && !Array.isArray(value);
    if (!isObject(auth) || (auth.wps !== undefined && !isObject(auth.wps))) throw new Error('Invalid authaddin.json; registries left unchanged');
    const writer = auth.wps ??= {};
    const id = Object.keys(writer).find(key => key !== 'namelist' && writer[key]?.name === 'WpsMcpWPS') ?? randomBytes(16).toString('hex');
    writer[id] = { ...writer[id], enable: true, isload: true, md5: '', mode: 2, name: 'WpsMcpWPS', path: `http://127.0.0.1:${port}/addins/wps` };
    writer.namelist = [...new Set([...String(writer.namelist ?? '').split(';').filter(Boolean), id])].join(';');
    changes.push([authPath, oldAuth, JSON.stringify(auth, null, 2) + '\n', '.backup-before-wps-mcp-writer']);
  }
  // Validate both files before writing either; keep the first backups and all unrelated Add-ins.
  mkdirSync(directory, { recursive: true });
  for (const [path, before, after, suffix] of changes) {
    if (before === after) continue;
    if (before !== null && !existsSync(path + suffix)) copyFileSync(path, path + suffix, constants.COPYFILE_EXCL);
    writeFileSync(path, after, 'utf8');
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [directory, port, enable, platform] = process.argv.slice(2);
  if (!directory || !port || !enable || !platform) throw new Error("Missing registration arguments");
  registerAddins(directory, port, enable, platform);
  console.log("Registered ET/WPP/Writer Add-ins:", directory);
}
