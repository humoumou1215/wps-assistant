import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startHarness } from './helpers/ui-harness.mjs';

const linkType = process.platform === 'win32' ? 'junction' : 'dir';
async function fixture(t) {
  const container = await mkdtemp(join(tmpdir(), 'wps-reference-boundary-'));
  // Emulate macOS /var and Windows short-name expansion even when TMPDIR is
  // already canonical: both the parent and the configured data directory alias.
  const root = join(container, 'entry');
  await symlink(container, root, linkType);
  const actual = join(root, 'actual'), alias = join(root, 'alias');
  await mkdir(actual);
  await symlink(actual, alias, linkType);
  const h = await startHarness({ dataDir: alias });
  t.after(async () => { await h.close(); await rm(container, { recursive: true, force: true }); });
  const get = path => fetch(h.base + path);
  const file = path => get('/api/skill-file?path=' + encodeURIComponent(path));
  return { root, alias, actual, h, get, file };
}

test('reference API accepts canonical and aliased paths while preserving file and skill boundaries', async t => {
  const f = await fixture(t);
  const response = await f.get('/api/agent'); assert.equal(response.status, 200);
  const resources = await response.json(), skill = resources.skills.find(s => s.name === 'wps-api');
  const ref = skill.references.find(r => r.name === 'writer.md');
  const canonical = await f.file(ref.filePath);
  assert.equal(canonical.status, 200, await canonical.clone().text());
  const content = await canonical.json(); assert.match(content.content, /Writer|Paragraph/);
  for (const path of [skill.baseDir + '/' + ref.path, join(f.alias, 'pi/skills/wps-api/references/writer.md')]) {
    const result = await f.file(path); assert.equal(result.status, 200);
    assert.equal((await result.json()).content, content.content);
  }
  const installed = await realpath(join(f.actual, 'pi/skills')), own = join(installed, 'wps-api');
  const sibling = join(installed, 'local-skill'); await mkdir(sibling);
  await writeFile(join(sibling, 'SKILL.md'), '---\nname: local-skill\ndescription: Test sibling\n---\nSibling');
  await writeFile(join(sibling, 'secret.md'), 'sibling content');
  // Load the sibling before adding links: these tests exercise our file API,
  // independently of the SDK's skill-discovery traversal.
  const command = await fetch(f.h.base + '/api/commands', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'reload' }) });
  assert.equal(command.status, 200, await command.clone().text());
  await symlink(sibling, join(own, 'cross-skill'), linkType);
  await writeFile(join(f.root, 'outside.md'), 'outside content');
  await symlink(f.root, join(own, 'escape'), linkType);
  await writeFile(join(own, 'binary.dat'), Buffer.from([1, 0, 2]));
  await writeFile(join(own, 'large.md'), 'x'.repeat(2_000_001));
  await symlink(join(own, 'references'), join(own, 'internal'), linkType);
  for (const path of [join(own, 'cross-skill/secret.md'), join(own, 'escape/outside.md'), join(f.root, 'outside.md'), join(own, 'references'), join(own, 'binary.dat'), join(own, 'large.md'), '../../config.json']) {
    assert.equal((await f.file(path)).status, 400, path);
  }
  assert.equal((await f.file(join(sibling, 'secret.md'))).status, 200, 'direct access to a loaded sibling is valid');
  assert.equal((await f.file(join(own, 'internal/writer.md'))).status, 200, 'links within the same skill remain readable');
  assert.equal((await f.file(await realpath(ref.filePath))).status, 200);
});

test('cyclic and dangling links do not disable the resource API or legal references', async t => {
  const f = await fixture(t);
  const initial = await (await f.get('/api/agent')).json();
  const skill = initial.skills.find(s => s.name === 'wps-api');
  const root = await realpath(skill.baseDir);
  await symlink(join(root, 'loop'), join(root, 'loop'), linkType);
  await symlink(join(root, 'missing-target'), join(root, 'dangling'), linkType);
  const result = await f.get('/api/agent'); assert.equal(result.status, 200, await result.clone().text());
  const resources = await result.json();
  const refs = resources.skills.find(s => s.name === 'wps-api').references;
  assert.equal(refs.length, skill.references.length);
  assert.ok(!refs.some(ref => /loop|dangling/.test(ref.path)));
  assert.ok(resources.tools.some(tool => tool.name === 'wps_list_variables'));
  assert.equal((await f.file(refs.find(ref => ref.name === 'writer.md').filePath)).status, 200);
  assert.equal((await f.file(join(root, 'loop/secret.md'))).status, 400);
});
