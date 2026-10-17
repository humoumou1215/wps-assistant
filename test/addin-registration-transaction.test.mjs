import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { registerAddins, removeAddins } from '../dist/src/addin-registration.js';

test.afterEach(t => { t.mock.restoreAll(); syncBuiltinESMExports(); });
const fault = code => Object.assign(new Error(`simulated ${code}`), { code });
function fixture(t) {
  const dir = fs.mkdtempSync(join(tmpdir(), 'wps-registry-transaction-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const publish = join(dir, 'publish.xml'), auth = join(dir, 'authaddin.json');
  fs.writeFileSync(publish, '<jsplugins>\n  <jspluginonline name="Other"/>\n</jsplugins>\n');
  fs.writeFileSync(auth, '{"wps":{"namelist":"other","other":{"name":"Other"}}}\n');
  registerAddins(dir, '18766', 'enable_dev', 'darwin');
  // The current files differ from the historical first-install backups.
  const beforePublish = fs.readFileSync(publish, 'utf8').replace('name="Other"', 'name="OtherEdited"');
  fs.writeFileSync(publish, beforePublish);
  const beforeAuth = fs.readFileSync(auth, 'utf8');
  const files = fs.readdirSync(dir).sort();
  const backups = files.filter(name => name.includes('.backup-')).map(name => [name, fs.readFileSync(join(dir, name), 'utf8')]);
  return { dir, publish, auth, beforePublish, beforeAuth, files, backups };
}
function assertUnchanged(f) {
  assert.equal(fs.readFileSync(f.publish, 'utf8'), f.beforePublish);
  assert.equal(fs.readFileSync(f.auth, 'utf8'), f.beforeAuth);
  assert.deepEqual(fs.readdirSync(f.dir).sort(), f.files, 'temporary replacements and rollback copies are cleaned');
  for (const [name, before] of f.backups) assert.equal(fs.readFileSync(join(f.dir, name), 'utf8'), before);
}
const operations = {
  register: dir => registerAddins(dir, '19999', 'enable_dev', 'darwin'),
  remove: dir => removeAddins(dir, 'darwin'),
};
for (const [name, operation] of Object.entries(operations)) {
  test(`${name} refuses a read-only second registry before modifying the first`, t => {
    const f = fixture(t), access = fs.accessSync;
    t.mock.method(fs, 'accessSync', (path, ...args) => {
      if (path === f.auth) throw fault('EACCES');
      return access(path, ...args);
    });
    syncBuiltinESMExports();
    assert.throws(() => operation(f.dir), { code: 'EACCES' });
    assertUnchanged(f);
  });
  test(`${name} preserves live registries when a staged write fails after truncation`, t => {
    const f = fixture(t), write = fs.writeFileSync;
    t.mock.method(fs, 'writeFileSync', (path, content, ...args) => {
      if (String(path).startsWith(f.auth + '.wps-mcp-') && String(path).endsWith('.tmp')) {
        write(path, String(content).slice(0, 4), ...args);
        throw fault('ENOSPC');
      }
      return write(path, content, ...args);
    });
    syncBuiltinESMExports();
    assert.throws(() => operation(f.dir), { code: 'ENOSPC' });
    assertUnchanged(f);
  });
  test(`${name} rolls back a committed first file when the second replacement fails`, t => {
    const f = fixture(t), rename = fs.renameSync;
    t.mock.method(fs, 'renameSync', (from, to) => {
      if (to === f.auth) throw fault('EBUSY');
      return rename(from, to);
    });
    syncBuiltinESMExports();
    assert.throws(() => operation(f.dir), { code: 'EBUSY' });
    assertUnchanged(f);
  });
}
test('a failed rollback retains the current-operation recovery copy and reports its path', t => {
  const f = fixture(t), rename = fs.renameSync;
  t.mock.method(fs, 'renameSync', (from, to) => {
    if (to === f.auth || (to === f.publish && String(from).endsWith('.restore'))) throw fault('EBUSY');
    return rename(from, to);
  });
  syncBuiltinESMExports();
  let error;
  assert.throws(() => removeAddins(f.dir, 'darwin'), value => { error = value; return /rollback incomplete/.test(value.message); });
  const recovery = fs.readdirSync(f.dir).find(name => name.endsWith('.restore'));
  assert.ok(recovery);
  assert.ok(error.message.includes(join(f.dir, recovery)));
  assert.equal(fs.readFileSync(join(f.dir, recovery), 'utf8'), f.beforePublish);
  assert.equal(fs.readFileSync(f.auth, 'utf8'), f.beforeAuth);
  assert.ok(!fs.readdirSync(f.dir).some(name => name.endsWith('.tmp')));
});
test('a failed first registration removes a newly committed registry instead of inventing old contents', t => {
  const dir = fs.mkdtempSync(join(tmpdir(), 'wps-first-registry-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const rename = fs.renameSync;
  t.mock.method(fs, 'renameSync', (from, to) => {
    if (to === join(dir, 'authaddin.json')) throw fault('EBUSY');
    return rename(from, to);
  });
  syncBuiltinESMExports();
  assert.throws(() => registerAddins(dir, '18766', 'enable_dev', 'darwin'), { code: 'EBUSY' });
  assert.deepEqual(fs.readdirSync(dir), []);
});
