import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir = await mkdtemp(join(tmpdir(), 'wps-skills-test-'));
process.env.WPS_MCP_DATA_DIR = dir;
const { BUNDLED_SKILLS_DIR, INSTALLED_SKILLS_DIR, installBundledSkills, readSkillFile, createSkillReadTool } = await import('../dist/src/agent-skills.js');
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
