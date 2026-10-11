import sharp from 'sharp';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

// Deterministic format/size exports. Artwork is generated separately and kept in source/.
const root = fileURLToPath(new URL('../', import.meta.url));
const icons = join(root, 'desktop/icons');
const addon = join(root, 'addon');
const source = name => join(icons, 'source', `${name}.png`);
await mkdir(icons, { recursive: true });
const png = (name, size) => sharp(source(name)).resize(size, size, { fit: 'contain', background: '#00000000' }).png().toBuffer();
const savePng = async (name, size, path) => writeFile(path, await png(name, size));

// ICO entries contain PNG data, supported by the project's Windows 10+ baseline.
async function ico(sizes, artwork) {
  const images = await Promise.all(sizes.map(size => png(artwork(size), size)));
  const header = Buffer.alloc(6 + sizes.length * 16);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(sizes.length, 4);
  let offset = header.length;
  sizes.forEach((size, index) => {
    const entry = 6 + index * 16;
    header[entry] = header[entry + 1] = size === 256 ? 0 : size;
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(images[index].length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += images[index].length;
  });
  return Buffer.concat([header, ...images]);
}

// PNG ICNS representations cover standard and Retina sizes without platform tools.
const representations = [['icp4', 16], ['icp5', 32], ['icp6', 64], ['ic07', 128], ['ic08', 256], ['ic09', 512], ['ic10', 1024], ['ic11', 32], ['ic12', 64], ['ic13', 256], ['ic14', 512]];
const chunks = await Promise.all(representations.map(async ([type, size]) => {
  const body = await png(size <= 64 ? 'small' : 'main', size);
  const header = Buffer.alloc(8);
  header.write(type, 0, 4, 'ascii');
  header.writeUInt32BE(body.length + 8, 4);
  return Buffer.concat([header, body]);
}));
const icnsHeader = Buffer.alloc(8);
icnsHeader.write('icns');
icnsHeader.writeUInt32BE(8 + chunks.reduce((sum, chunk) => sum + chunk.length, 0), 4);
await writeFile(join(icons, 'app.icns'), Buffer.concat([icnsHeader, ...chunks]));
await writeFile(join(icons, 'app.ico'), await ico([16, 20, 24, 32, 48, 64, 128, 256], size => size <= 64 ? 'small' : 'main'));
await writeFile(join(addon, 'favicon.ico'), await ico([16, 32, 48], () => 'small'));
await savePng('main', 1024, join(icons, 'app.png'));
await savePng('small', 64, join(addon, 'brand-mark.png'));
await savePng('small', 16, join(addon, 'favicon-16.png'));
await savePng('small', 32, join(addon, 'favicon-32.png'));
await savePng('main', 32, join(addon, 'ribbon-assistant.png'));
await savePng('variables', 32, join(addon, 'ribbon-variables.png'));
await savePng('status', 32, join(addon, 'ribbon-status.png'));
await savePng('template', 44, join(icons, 'tray-macos.png'));
await savePng('small', 32, join(icons, 'tray-windows.png'));
for (const platform of ['macos', 'windows']) {
  const rgba = await sharp(await readFile(join(icons, `tray-${platform}.png`))).ensureAlpha().raw().toBuffer();
  await writeFile(join(icons, `tray-${platform}.rgba`), rgba);
}
console.log('Exported application, tray, Ribbon and browser icons from desktop/icons/source.');
