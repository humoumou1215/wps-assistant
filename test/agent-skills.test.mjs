import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

const dir = await mkdtemp(join(tmpdir(), 'wps-skills-test-'));
process.env.WPS_MCP_DATA_DIR = dir;
const { BUNDLED_SKILLS_DIR, INSTALLED_SKILLS_DIR, installBundledSkills, listSkillReferences, readSkillContent, readSkillFile, createSkillReadTool } = await import('../dist/src/agent-skills.js');
test.after(() => rm(dir, { recursive: true, force: true }));

test('bundled skills and references install, refresh, and preserve additional installed skills', async () => {
  const result = await installBundledSkills();
  const skill = result.skills.find(s => s.name === 'wps-api');
  assert.ok(skill);
  assert.equal(await readFile(skill.filePath, 'utf8'), await readFile(join(BUNDLED_SKILLS_DIR, 'wps-api/SKILL.md'), 'utf8'));
  assert.equal(await readFile(join(skill.baseDir, 'references/writer.md'), 'utf8'), await readFile(join(BUNDLED_SKILLS_DIR, 'wps-api/references/writer.md'), 'utf8'));
  await mkdir(join(INSTALLED_SKILLS_DIR, 'local-skill'));
  await writeFile(join(INSTALLED_SKILLS_DIR, 'local-skill/SKILL.md'), '---\nname: local-skill\ndescription: Local test skill\n---\nCustom skill');
  await writeFile(skill.filePath, 'stale shipped skill');
  const refreshed = await installBundledSkills();
  assert.equal(refreshed.skills.length, 2);
  assert.match(await readFile(skill.filePath, 'utf8'), /WPS API skill/);
  assert.match(await readFile(join(INSTALLED_SKILLS_DIR, 'local-skill/SKILL.md'), 'utf8'), /Custom skill/);
});

test('skill read supports references and pagination but rejects traversal and links outside skills', async () => {
  const { skills } = await installBundledSkills();
  const page = await readSkillFile(skills, 'wps-api/SKILL.md', 1, 5);
  assert.equal(page.content.split('\n').length, 5);
  assert.equal(page.nextOffset, 6);
  assert.ok(page.totalLines > 5);
  assert.match((await readSkillFile(skills, 'wps-api/references/spreadsheet.md')).content, /Range/);
  await writeFile(join(dir, 'config.json'), 'private config');
  for (const path of ['../../config.json', join(dir, 'config.json'), 'wps-api/../../../../config.json']) {
    await assert.rejects(readSkillFile(skills, path), /只能读取已安装技能/);
  }
  await assert.rejects(readSkillFile(skills, 'wps-api/SKILL.md', 0), /offset/);
  await assert.rejects(readSkillFile(skills, 'wps-api/SKILL.md', 1, 1001), /limit/);
  await mkdir(join(dir, 'outside'));
  await writeFile(join(dir, 'outside/secret.md'), 'outside skill root');
  await symlink(join(dir, 'outside'), join(INSTALLED_SKILLS_DIR, 'wps-api/outside'), process.platform === 'win32' ? 'junction' : 'dir');
  await assert.rejects(readSkillFile(skills, 'wps-api/outside/secret.md'), /只能读取已安装技能/);
  const read = createSkillReadTool(skills);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(read.execute('cancelled', { path: skills[0].filePath }, controller.signal), /已停止/);
});

test('bundled WPS workflow is self-contained and its reference links are readable by the embedded Agent', async () => {
  const { skills } = await installBundledSkills();
  const skill = skills.find(s => s.name === 'wps-api');
  const main = (await readSkillContent(skills, skill.filePath)).content;
  assert.doesNotMatch(main, /wps-mcp-binding|check-readonly\.mjs/);
  assert.match(main, /自动校验只读代码/);
  assert.match(main, /wpsDocument/);
  const links = [...main.matchAll(/\]\(([^)]+\.md)(?:#[^)]*)?\)/g)].map(m => m[1]);
  assert.ok(links.length > 0);
  for (const link of links) {
    const reference = await readSkillContent(skills, resolve(dirname(skill.filePath), link));
    assert.ok(reference.content.length > 0, link);
  }
});

test('task routes read complete sections without loading unrelated report branches', async () => {
  const { skills } = await installBundledSkills();
  const main = (await readSkillContent(skills, 'wps-api/SKILL.md')).content;
  const routes = [...main.matchAll(/^\| ([^|]+) \| .*?\]\((references\/[^)#]+)(?:#[^)]*)?\).*? \| (\d+) \| (\d+) \|$/gm)];
  assert.ok(routes.length > 0);
  const report = (await readSkillContent(skills, 'wps-api/references/report-sync.md')).content.split('\n');
  const reportRoutes = [];
  for (const [, trigger, path, start, count] of routes) {
    const offset = Number(start), limit = Number(count);
    const page = await readSkillFile(skills, 'wps-api/' + path, offset, limit);
    assert.equal(page.content.split('\n').length, limit, trigger);
    assert.equal((page.content.match(/^```/gm) || []).length % 2, 0, 'route must not cut off a code example: ' + trigger);
    if (path === 'references/report-sync.md') {
      const nextHeading = report.findIndex((line, index) => index >= offset + limit - 1 && /^## /.test(line));
      const trailing = report.slice(offset + limit - 1, nextHeading === -1 ? undefined : nextHeading).filter(line => line && !line.startsWith('<a '));
      assert.deepEqual(trailing, [], 'route must include its entire section: ' + trigger);
      reportRoutes.push(page.content);
    } else if (/spreadsheet|presentation|writer/.test(path)) {
      assert.doesNotMatch(page.content, /^\| (?:common|et|wpp|wps) \|/m, 'initial host route excludes historical probe tables');
    }
  }
  assert.equal(reportRoutes.length, 4);
  assert.doesNotMatch(reportRoutes[0], /^## (?:图表|动态目标|PPT 表格)/m, 'general reports do not load specialized branches');
  assert.deepEqual(reportRoutes.slice(1).map(content => content.match(/^## .+/m)?.[0]), ['## 图表', '## 动态目标的返回约定', '## PPT 表格：每次重写都维护续表']);
});

test('API object index preserves host inventories and points to complete member tables', async () => {
  const { skills } = await installBundledSkills();
  const catalog = (await readSkillContent(skills, 'wps-api/references/api-catalog.md')).content;
  const header = catalog.slice(0, catalog.indexOf('\n## '));
  const indexed = [...header.matchAll(/^\| ([^|]+) \| ([^|]+) \| (\d+) \| (\d+) \|$/gm)];
  const inventories = new Map();
  for (const [host, file] of [['Presentation / WPP', 'presentation'], ['Spreadsheet / ET', 'spreadsheet'], ['Writer / WPS', 'writer']]) {
    const guide = (await readSkillContent(skills, `wps-api/references/${file}.md`)).content;
    for (const match of guide.matchAll(/^### `([^`]+)` \((\d+) members\)\n/gm)) {
      const body = guide.slice(match.index + match[0].length).split(/\n#{1,3} /)[0];
      const members = [...body.matchAll(/^\| ([^|]+) \| ([^|]+) \|/gm)].slice(2).map(row => [row[1].trim(), row[2].trim()]);
      assert.equal(members.length, Number(match[2]));
      inventories.set(host + ' · ' + match[1], members);
    }
  }
  assert.equal(indexed.length, inventories.size);
  assert.ok(header.split('\n').length <= 50, 'the initial catalog read exposes every object index');
  let total = 0;
  for (const [, host, object, start, count] of indexed) {
    const key = host.trim() + ' · ' + object.trim();
    const page = await readSkillFile(skills, 'wps-api/references/api-catalog.md', Number(start), Number(count));
    assert.equal(page.content.split('\n')[0], '## ' + key);
    const rows = [...page.content.matchAll(/^\| ([^|]+) \| ([^|]+) \| ([^|]+) \|$/gm)].slice(2);
    const members = rows.map(row => [row[1].trim(), row[2].trim()]);
    assert.deepEqual(members.sort(), inventories.get(key)?.toSorted(), key);
    assert.ok(rows.every(row => ['枚举', '同名探测'].includes(row[3].trim())));
    total += rows.length;
  }
  assert.equal(total, 2598);
});

test('skill references list every shipped file except the entry point and skip escaping links', async () => {
  const { skills } = await installBundledSkills();
  const skill = skills.find(s => s.name === 'wps-api');
  const references = await listSkillReferences(skill);
  assert.deepEqual(references.map(r => r.path).sort(), [
    'references/api-catalog.md', 'references/common.md', 'references/macos-validation.md', 'references/presentation.md',
    'references/report-sync.md', 'references/spreadsheet.md', 'references/validation.md', 'references/writer.md',
  ]);
  const root = await realpath(skill.baseDir);
  assert.ok(references.every(r => r.size > 0 && r.name === r.path.split('/').pop() && r.filePath === join(root, r.path)), 'every reference keeps a readable size and its canonical absolute path');
  const linked = join(INSTALLED_SKILLS_DIR, 'link-skill');
  await mkdir(join(linked, 'docs'), { recursive: true });
  await writeFile(join(linked, 'SKILL.md'), '---\nname: link-skill\ndescription: Linked\ntest\n---\nBody');
  await writeFile(join(linked, 'docs/guide.md'), 'inner guide');
  await mkdir(join(dir, 'outside'), { recursive: true });
  await writeFile(join(dir, 'outside/secret.md'), 'outside skill root');
  await symlink(join(dir, 'outside'), join(linked, 'escape'), process.platform === 'win32' ? 'junction' : 'dir');
  const listed = await listSkillReferences({ baseDir: linked });
  assert.deepEqual(listed.map(r => r.path), ['docs/guide.md'], 'the entry point, links leaving the directory and nested files outside the skill stay hidden');
  assert.ok(!listed.some(r => /escape|SKILL/.test(r.path)));
});

test('canonical references remain readable through an aliased skill root', async () => {
  await installBundledSkills();
  const alias = join(dir, 'skills-alias');
  await symlink(INSTALLED_SKILLS_DIR, alias, process.platform === 'win32' ? 'junction' : 'dir');
  const skill = { baseDir: join(alias, 'wps-api') };
  const refs = await listSkillReferences(skill);
  const ref = refs.find(item => item.name === 'writer.md');
  assert.match((await readSkillContent([skill], ref.filePath)).content, /Writer|Paragraph/);
});

test('reference enumeration skips cyclic links but still reports a missing skill root', async () => {
  const baseDir = join(INSTALLED_SKILLS_DIR, 'cycle-skill');
  await mkdir(baseDir);
  await writeFile(join(baseDir, 'guide.md'), 'readable guide');
  await symlink(join(baseDir, 'loop'), join(baseDir, 'loop'), process.platform === 'win32' ? 'junction' : 'dir');
  assert.deepEqual((await listSkillReferences({ baseDir })).map(ref => ref.path), ['guide.md']);
  await assert.rejects(listSkillReferences({ baseDir: join(dir, 'missing-skill') }), { code: 'ENOENT' });
});

test('upgrades remove retired bundled skills and references while preserving user files', async () => {
  const source = join(dir, 'upgrade-source'), target = join(dir, 'upgrade-target');
  for (const name of ['kept', 'retired']) {
    await mkdir(join(source, name), { recursive: true });
    await writeFile(join(source, name, 'SKILL.md'), `---\nname: ${name}\ndescription: Test skill\n---\nInstructions`);
  }
  await writeFile(join(source, 'kept/obsolete.md'), 'old reference');
  await installBundledSkills(source, target);
  await mkdir(join(target, 'custom'));
  await writeFile(join(target, 'custom/SKILL.md'), '---\nname: custom\ndescription: User skill\n---\nUser instructions');
  await writeFile(join(target, 'kept/user-notes.md'), 'personal notes');
  await rm(join(source, 'retired'), { recursive: true });
  await rm(join(source, 'kept/obsolete.md'));
  await writeFile(join(source, 'kept/new.md'), 'new reference');
  const upgraded = await installBundledSkills(source, target);
  assert.deepEqual(upgraded.skills.map(skill => skill.name).sort(), ['custom', 'kept']);
  await assert.rejects(readFile(join(target, 'retired/SKILL.md')), { code: 'ENOENT' });
  await assert.rejects(readFile(join(target, 'kept/obsolete.md')), { code: 'ENOENT' });
  assert.equal(await readFile(join(target, 'kept/user-notes.md'), 'utf8'), 'personal notes');
  assert.equal(await readFile(join(target, 'kept/new.md'), 'utf8'), 'new reference');
  await installBundledSkills(source, target);
  assert.equal(await readFile(join(target, 'kept/user-notes.md'), 'utf8'), 'personal notes');
  await writeFile(join(target, '.wps-bundled-files.json'), '["../config.json"]');
  await assert.rejects(installBundledSkills(source, target), /安装清单无效/);
  assert.equal(await readFile(join(dir, 'config.json'), 'utf8'), 'private config');
});
