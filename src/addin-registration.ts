import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync, constants } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { randomBytes } from "node:crypto";
import { SaxesParser } from "saxes";
/// 本项目的加载项条目：宿主目录名 + publish.xml 里的 name。
const HOSTS: [string, string][] = [['et', 'WpsMcpET'], ['wpp', 'WpsMcpWPP'], ['wps', 'WpsMcpWPS']];
const PUBLISH_BACKUP = '.backup-before-wps-mcp';
const WRITER_BACKUP = '.backup-before-wps-mcp-writer';
type Span = { name: string; start: number; end: number; host?: [string, string]; selfClosing?: boolean };
const isObject = (value: unknown) => value !== null && typeof value === 'object' && !Array.isArray(value);
/// 校验真实的 XML 并记录完整元素跨度。这是注册表更新，不是 HTML 清洗器：
/// 必须保留无关元素、注释与原始格式。校验失败时抛错，调用方据此放弃写入。
function scanPublish(publish: string) {
  const parser = new SaxesParser({ xmlns: false });
  const stack: Span[] = [], spans: Span[] = [];
  let root: Span | undefined, rootClose = -1;
  parser.on("error", () => { throw new Error('Invalid publish.xml; left unchanged'); });
  parser.on("opentag", tag => {
    const span: Span = { name: tag.name, start: publish.lastIndexOf('<', parser.position - 1), end: parser.position, selfClosing: tag.isSelfClosing };
    if (stack.length === 0) {
      if (tag.name.toLowerCase() !== 'jsplugins') throw new Error('Invalid publish.xml; left unchanged');
      root = span;
    } else if (stack.length === 1 && ['jsplugin', 'jspluginonline'].includes(tag.name.toLowerCase())) {
      span.host = HOSTS.find(([, name]) => name.toLowerCase() === tag.attributes.name?.toLowerCase());
    }
    stack.push(span);
  });
  parser.on("closetag", () => {
    const span = stack.pop()!; span.end = parser.position;
    if (span.host) spans.push(span);
    if (stack.length === 0) rootClose = publish.lastIndexOf('<', parser.position - 1);
  });
  parser.write(publish).close();
  if (!root || rootClose < 0) throw new Error('Invalid publish.xml; left unchanged');
  return { root, rootClose, spans };
}
/// 读取并校验 macOS 的 authaddin.json；返回 undefined 表示文件不存在，内容非法时抛错。
function readAuthAddin(path: string) {
  if (!existsSync(path)) return undefined;
  const original = readFileSync(path, 'utf8');
  const auth = JSON.parse(original);
  if (!isObject(auth) || (auth.wps !== undefined && !isObject(auth.wps))) throw new Error('Invalid authaddin.json; registries left unchanged');
  return { original, auth: auth as { wps?: Record<string, any> } };
}
export function registerAddins(directory: string, port: string, enable: string, platform: string) {
  if (!/^\d+$/.test(port) || Number(port) < 1025 || Number(port) > 65535 || !/^[\w-]+$/.test(enable)) throw new Error('Invalid port or Add-in enable setting');
  const publishPath = join(directory, 'publish.xml');
  const original = existsSync(publishPath) ? readFileSync(publishPath, 'utf8') : null;
  let publish = original ?? '<?xml version="1.0" encoding="UTF-8"?>\n<jsplugins>\n</jsplugins>\n';
  const eol = publish.includes('\r\n') ? '\r\n' : '\n';
  const entry = ([host, name]: [string, string]) => `<jspluginonline name="${name}" url="http://127.0.0.1:${port}/addins/${host}/" type="${host}" enable="${enable}" debug="" install="null"/>`;
  const { root, rootClose, spans } = scanPublish(publish);
  const seen = new Set<string>();
  const parts: string[] = []; let cursor = 0;
  for (const span of spans) {
    parts.push(publish.slice(cursor, span.start));
    const host = span.host!;
    if (!seen.has(host[1])) { parts.push(entry(host)); seen.add(host[1]); }
    cursor = span.end;
  }
  const missing = HOSTS.filter(host => !seen.has(host[1]));
  const additions = missing.map(host => '  ' + entry(host)).join(eol);
  if (root.selfClosing) {
    parts.push(publish.slice(cursor, root.start), publish.slice(root.start, root.end - 2), '>', eol, additions, eol, `</${root.name}>`, publish.slice(root.end));
  } else {
    parts.push(publish.slice(cursor, rootClose), ...(missing.length ? [additions, eol] : []), publish.slice(rootClose));
  }
  publish = parts.join('');
  new SaxesParser().write(publish).close();
  const changes: [string, string | null, string, string][] = [[publishPath, original, publish, PUBLISH_BACKUP]];
  if (platform === 'darwin') {
    const authPath = join(directory, 'authaddin.json');
    const loaded = readAuthAddin(authPath);
    const auth = loaded?.auth ?? {};
    const writer = auth.wps ??= {};
    const id = Object.keys(writer).find(key => key !== 'namelist' && writer[key]?.name === 'WpsMcpWPS') ?? randomBytes(16).toString('hex');
    writer[id] = { ...writer[id], enable: true, isload: true, md5: '', mode: 2, name: 'WpsMcpWPS', path: `http://127.0.0.1:${port}/addins/wps` };
    writer.namelist = [...new Set([...String(writer.namelist ?? '').split(';').filter(Boolean), id])].join(';');
    changes.push([authPath, loaded?.original ?? null, JSON.stringify(auth, null, 2) + '\n', WRITER_BACKUP]);
  }
  // Validate both files before writing either; keep the first backups and all unrelated Add-ins.
  mkdirSync(directory, { recursive: true });
  for (const [path, before, after, suffix] of changes) {
    if (before === after) continue;
    if (before !== null && !existsSync(path + suffix)) copyFileSync(path, path + suffix, constants.COPYFILE_EXCL);
    writeFileSync(path, after, 'utf8');
  }
}
/// 移除本项目写入的三个宿主条目（macOS 同时移除 Writer 授权）。与注册对称：保留其他加载项、
/// 注释与原始格式；第一次注册留下的用户原始备份不动，也不为「移除」新建备份。
export function removeAddins(directory: string, platform: string) {
  const writes: [string, string][] = [];
  let removed = 0;
  const publishPath = join(directory, 'publish.xml');
  if (existsSync(publishPath)) {
    const original = readFileSync(publishPath, 'utf8');
    const { spans } = scanPublish(original);
    const eol = original.includes('\r\n') ? '\r\n' : '\n';
    let publish = original;
    // 从后往前删，前面条目的跨度才不会被后面的改动打乱；条目连同它的缩进和行尾换行一起去掉。
    for (const span of [...spans].reverse()) {
      let start = span.start;
      while (start > 0 && (publish[start - 1] === ' ' || publish[start - 1] === '\t')) start--;
      const end = publish.startsWith(eol, span.end) ? span.end + eol.length : span.end;
      publish = publish.slice(0, start) + publish.slice(end);
    }
    new SaxesParser().write(publish).close();
    removed += spans.length;
    if (publish !== original) writes.push([publishPath, publish]);
  }
  if (platform === 'darwin') {
    const authPath = join(directory, 'authaddin.json');
    const loaded = readAuthAddin(authPath);
    const writer = loaded?.auth.wps;
    const ids = writer ? Object.keys(writer).filter(key => key !== 'namelist' && writer[key]?.name === 'WpsMcpWPS') : [];
    if (loaded && writer && ids.length) {
      for (const id of ids) delete writer[id];
      writer.namelist = String(writer.namelist ?? '').split(';').filter(entry => entry && !ids.includes(entry)).join(';');
      const after = JSON.stringify(loaded.auth, null, 2) + '\n';
      if (after !== loaded.original) writes.push([authPath, after]);
      removed += ids.length;
    }
  }
  for (const [path, content] of writes) writeFileSync(path, content, 'utf8');
  return removed ? 'WPS 加载项注册已移除，重新打开 WPS 后不再加载。' : '未找到 WPS 助手的加载项注册，无需移除。';
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [first, ...rest] = process.argv.slice(2);
  if (first === 'remove') {
    const [directory, platform] = rest;
    if (!directory || !platform) throw new Error("Missing removal arguments");
    console.log(removeAddins(directory, platform));
  } else {
    const [directory, port, enable, platform] = [first, ...rest];
    if (!directory || !port || !enable || !platform) throw new Error("Missing registration arguments");
    registerAddins(directory, port, enable, platform);
    console.log("Registered ET/WPP/Writer Add-ins:", directory);
  }
}
