import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const mac = await readFile(new URL('../scripts/install-macos.sh', import.meta.url), 'utf8');
const windows = await readFile(new URL('../scripts/install-windows.ps1', import.meta.url), 'utf8');
const registrars = {
  darwin: mac.match(/<<'REGISTRY'\n([\s\S]*?)\nREGISTRY/)[1],
  win32: windows.match(/\$registryScript = @'\n([\s\S]*?)\n'@/)[1],
};
function register(directory, platform, port = '18766') {
  return spawnSync(process.execPath, ['-', directory, port, 'enable_dev', platform], {
    input: registrars[platform], encoding: 'utf8',
  });
}

for (const platform of ['darwin', 'win32']) {
  test(`${platform} deployment updates URLs without duplicate entries and preserves other Add-ins and initial backups`, async () => {
    const dir = await mkdtemp(join(tmpdir(), 'wps-deploy-'));
    const publishPath = join(dir, 'publish.xml');
    const authPath = join(dir, 'authaddin.json');
    const foreign = '<jspluginonline name="Other" url="https://example.test/" type="et"/>';
    const original = `<?xml version="1.0"?>\r\n<jsplugins>\r\n${foreign}\r\n<jspluginonline name='WpsMcpET' url='http://old/' type='et'/>\r\n</jsplugins>\r\n`;
    const oldAuth = JSON.stringify({ et: { untouched: true }, wps: { namelist: 'other;ours', other: { name: 'Other' }, ours: { name: 'WpsMcpWPS', custom: 'preserve' } } });
    try {
      await writeFile(publishPath, original);
      await writeFile(authPath, oldAuth);
      const first = register(dir, platform);
      assert.equal(first.status, 0, first.stderr);
      const published = await readFile(publishPath, 'utf8');
      assert.ok(published.includes(foreign));
      assert.equal((published.match(/name="WpsMcp/g) ?? []).length, 3);
      assert.ok(published.includes('\r\n'));
      assert.equal(await readFile(publishPath + '.backup-before-wps-mcp', 'utf8'), original);
      const auth = await readFile(authPath, 'utf8');
      if (platform === 'darwin') {
        const parsed = JSON.parse(auth);
        assert.deepEqual(parsed.et, { untouched: true });
        assert.deepEqual(parsed.wps.other, { name: 'Other' });
        assert.equal(parsed.wps.ours.path, 'http://127.0.0.1:18766/addins/wps');
        assert.equal(parsed.wps.ours.custom, 'preserve');
        assert.equal(parsed.wps.namelist, 'other;ours');
        assert.equal(await readFile(authPath + '.backup-before-wps-mcp-writer', 'utf8'), oldAuth);
      } else {
        assert.equal(auth, oldAuth, 'Windows registration must not invent macOS authorization settings');
      }
      assert.equal(register(dir, platform).status, 0);
      assert.equal(await readFile(publishPath, 'utf8'), published);
      assert.equal(await readFile(authPath, 'utf8'), auth);
      assert.equal(register(dir, platform, '19999').status, 0);
      const updated = await readFile(publishPath, 'utf8');
      for (const host of ['et', 'wpp', 'wps']) assert.ok(updated.includes(`http://127.0.0.1:19999/addins/${host}/`));
      assert.equal((updated.match(/name="WpsMcp/g) ?? []).length, 3);
      assert.equal(await readFile(publishPath + '.backup-before-wps-mcp', 'utf8'), original);
      if (platform === 'darwin') assert.equal(JSON.parse(await readFile(authPath, 'utf8')).wps.ours.path, 'http://127.0.0.1:19999/addins/wps');
    } finally { await rm(dir, { recursive: true, force: true }); }
  });
}

test('deployment rejects invalid registries and ports before changing either registry or creating backups', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'wps-deploy-invalid-'));
  const valid = '<jsplugins></jsplugins>\n';
  try {
    for (const platform of ['darwin', 'win32']) {
      await writeFile(join(dir, 'publish.xml'), '<jsplugins>broken');
      assert.notEqual(register(dir, platform).status, 0);
      assert.equal(await readFile(join(dir, 'publish.xml'), 'utf8'), '<jsplugins>broken');
      await writeFile(join(dir, 'publish.xml'), valid);
      assert.notEqual(register(dir, platform, '65536').status, 0);
      assert.equal(await readFile(join(dir, 'publish.xml'), 'utf8'), valid);
    }
    for (const invalidAuth of ['broken', '[]', '{"wps":[]}']) {
      await writeFile(join(dir, 'authaddin.json'), invalidAuth);
      assert.notEqual(register(dir, 'darwin').status, 0);
      assert.equal(await readFile(join(dir, 'publish.xml'), 'utf8'), valid);
      assert.equal(await readFile(join(dir, 'authaddin.json'), 'utf8'), invalidAuth);
    }
    assert.deepEqual((await readdir(dir)).sort(), ['authaddin.json', 'publish.xml']);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('macOS deployment creates an escaped LaunchAgent with the requested server, port, data and log paths', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'wps-deploy-plist-'));
  const plist = join(dir, 'LaunchAgents', 'service.plist');
  const root = join(dir, 'project & "quoted"');
  const data = join(dir, 'data & <private>');
  const node = '/path with spaces/node';
  try {
    const result = spawnSync(process.execPath, ['-', plist, root, node, data, '19999'], {
      input: mac.match(/<<'SERVICE_CONFIG'\n([\s\S]*?)\nSERVICE_CONFIG/)[1], encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr);
    const xml = await readFile(plist, 'utf8');
    assert.ok(xml.includes('&amp; &quot;quoted&quot;'));
    assert.ok(xml.includes('data &amp; &lt;private&gt;'));
    // Read the generated XML with a parser, rather than duplicating its formatting.
    const { DOMParser } = await import('linkedom');
    const document = new DOMParser().parseFromString(xml, 'text/xml');
    const dict = document.querySelector('plist > dict');
    const value = key => [...dict.children].find(child => child.tagName === 'key' && child.textContent === key)?.nextElementSibling;
    assert.equal(value('Label').textContent, 'com.local.wps-mcp');
    assert.deepEqual([...value('ProgramArguments').children].map(child => child.textContent), [node, join(root, 'dist/src/server.js')]);
    assert.equal(value('WorkingDirectory').textContent, root);
    assert.equal(value('StandardErrorPath').textContent, join(data, 'logs/server.stderr.log'));
    const env = value('EnvironmentVariables');
    const envValue = key => [...env.children].find(child => child.textContent === key)?.nextElementSibling.textContent;
    assert.equal(envValue('WPS_MCP_DATA_DIR'), data);
    assert.equal(envValue('WPS_MCP_PORT'), '19999');
    assert.equal(envValue('WPS_MCP_TRANSPORT'), 'http');
  } finally { await rm(dir, { recursive: true, force: true }); }
});
