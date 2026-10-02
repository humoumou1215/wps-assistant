import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

const dir = await mkdtemp(join(tmpdir(), 'wps-skills-test-'));
process.env.WPS_MCP_DATA_DIR = dir;
const { BUNDLED_SKILLS_DIR, INSTALLED_SKILLS_DIR, installBundledSkills, readSkillContent, readSkillFile, createSkillReadTool } = await import('../dist/src/agent-skills.js');
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
  assert.match(main, /automatically apply the guard/);
  assert.match(main, /wpsDocument/);
  const links = [...main.matchAll(/\]\(([^)]+\.md)(?:#[^)]*)?\)/g)].map(m => m[1]);
  assert.ok(links.length > 0);
  for (const link of links) {
    const reference = await readSkillContent(skills, resolve(dirname(skill.filePath), link));
    assert.ok(reference.content.length > 0, link);
  }
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
