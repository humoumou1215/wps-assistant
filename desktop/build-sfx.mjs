// 自解压单文件的打包侧：把整包压成一条 zlib 流，追加到托盘可执行文件尾部并写入页脚。
//
// 页脚与条目流的格式同 desktop/native/src/main.rs 的解压实现成对维护，改动必须同步两边：
//   文件 = [托盘可执行文件][zlib 载荷][页脚]
//   载荷 = zlib( 重复的 [u32 路径长度][路径][u64 内容长度][u8 标志][内容] )，路径为相对包根的 POSIX 路径
//   标志 = 位 0 表示可执行（解压侧据此恢复权限，否则 node 这类文件会丢掉可执行位）
//   页脚 = [8 字节魔数][24 字节版本，空字节补齐][u64 载荷长度，小端]
//
// 用 zlib 而不是裸 deflate：自带的 adler32 让解压时就能发现载荷损坏，不必另存校验和。
import { createReadStream, createWriteStream } from 'node:fs';
import { chmod, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { createDeflate } from 'node:zlib';
import { join, relative, sep } from 'node:path';

const MAGIC = 'WPSMCPX1';
const VERSION_LENGTH = 24;
const FOOTER_LENGTH = 8 + VERSION_LENGTH + 8;

export function sfxFooter(version, payloadLength) {
  const name = Buffer.from(version, 'utf8');
  if (name.length >= VERSION_LENGTH) throw new Error('版本号过长，放不进自解压页脚');
  const footer = Buffer.alloc(FOOTER_LENGTH);
  footer.write(MAGIC, 0, 'ascii');
  name.copy(footer, 8);
  footer.writeBigUInt64LE(BigInt(payloadLength), VERSION_LENGTH + 8);
  return footer;
}

async function collectFiles(directory, root = directory, found = []) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await collectFiles(path, root, found);
    else if (entry.isFile()) found.push({ path, name: relative(root, path).split(sep).join('/') });
  }
  return found;
}

export async function writePayload(bundle, destination) {
  // 固定顺序让同样的输入产出同样的载荷，便于比对和复现。
  const files = (await collectFiles(bundle)).sort((a, b) => (a.name < b.name ? -1 : 1));
  async function* entries() {
    for (const file of files) {
      const name = Buffer.from(file.name, 'utf8');
      const info = await stat(file.path);
      const header = Buffer.alloc(4 + name.length + 8 + 1);
      header.writeUInt32LE(name.length, 0);
      name.copy(header, 4);
      header.writeBigUInt64LE(BigInt(info.size), 4 + name.length);
      // Windows 上不需要可执行位，但同一套格式要给 macOS/Linux 用，照实记录。
      header.writeUInt8(info.mode & 0o111 ? 1 : 0, 4 + name.length + 8);
      yield header;
      yield* createReadStream(file.path);
    }
  }
  await mkdir(join(destination, '..'), { recursive: true });
  await pipeline(entries(), createDeflate({ level: 9 }), createWriteStream(destination));
  return { entries: files.length, payloadBytes: (await stat(destination)).size };
}

export async function buildSelfExtractingExe({ tray, bundle, version, output }) {
  const payload = `${output}.payload`;
  const built = await writePayload(bundle, payload);
  const [trayBytes, payloadBytes] = [await readFile(tray), await readFile(payload)];
  await writeFile(output, Buffer.concat([trayBytes, payloadBytes, sfxFooter(version, built.payloadBytes)]));
  await chmod(output, 0o755);
  await rm(payload, { force: true });
  return { ...built, totalBytes: (await stat(output)).size };
}
