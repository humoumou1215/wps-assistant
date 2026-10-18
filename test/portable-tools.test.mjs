import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Exercise the actual packaged smoke assertions without building or running a tray.
const source = await readFile(new URL('../desktop/smoke-portable.mjs', import.meta.url), 'utf8');
const assertions = source.slice(source.indexOf("  const agent = await get('/api/agent');"), source.indexOf('  const cfg ='));
const run = new Function('get', 'assert', `return (async () => { ${assertions} })();`);
const wpsTools = ['wps_list_documents', 'wps_get_document', 'wps_run_readonly_code', 'wps_create_variable', 'wps_update_variable', 'wps_create_render', 'wps_update_render', 'wps_delete_variable', 'wps_delete_render', 'wps_list_variables', 'wps_get_variable', 'wps_run_transform', 'wps_run_render'];
const resource = names => ({ tools: names.map(name => ({ name })), skills: [{ name: 'wps-api' }] });

test('portable smoke accepts exactly thirteen WPS tools and the skill-only read', async () => {
  assert.ok(assertions.includes('const agent'), 'locate the real smoke assertions');
  await run(async () => resource([...wpsTools, 'read']), assert);
});

test('portable smoke rejects missing, substituted, duplicate and unexpected tools', async () => {
  for (const names of [wpsTools, [...wpsTools.filter(name => name !== 'wps_list_variables'), 'read'], [...wpsTools, 'bash'], [...wpsTools.slice(1), 'wps_list_variables', 'read'], [...wpsTools, 'read', 'extra']]) {
    await assert.rejects(run(async () => resource(names), assert));
  }
});
