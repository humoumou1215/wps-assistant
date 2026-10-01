import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSpreadsheetRef, renderLocation } from '../dist/src/location.js';

test('locations support quoted names, absolute addresses and bounded ranges', () => {
  assert.deepEqual(parseSpreadsheetRef("'Team''s Sales'!$a$1:$D$4"), { sheet: "Team's Sales", address: 'A1:D4', ref: "'Team''s Sales'!A1:D4" });
  assert.equal(parseSpreadsheetRef('销售 数据!XFD1048576').sheet, '销售 数据');
  for (const invalid of ['Sheet!A0', 'Sheet!XFE1', 'Sheet!A1048577', 'Sheet!B4:A1', 'Sheet!A1:B0', 'Sheet!A1:B4oops', '[book]Sheet!A1', 'Sheet!A1,Other!B2', 'Sheet!A:A', 'Sheet!1:4', 'Sheet!A1; return true;']) {
    assert.equal(parseSpreadsheetRef(invalid), undefined, invalid);
  }
});

test('legacy descriptions yield only an unambiguous destination and explicit metadata wins', () => {
  const text = '将变量 Region/Profit 两列写入 wra-contract-excel.xlsx 的 Summary!A1:B4。';
  const location = renderLocation({ description: text });
  assert.equal(location.sheet, 'Summary');
  assert.equal(text.slice(location.start, location.end), 'Summary!A1:B4');
  assert.equal(renderLocation({ description: "写入 'Sales Data'!$A$1:$B$4（表头及三行）" }).sheet, 'Sales Data');
  assert.equal(renderLocation({ targetRef: 'Target!B2', description: '读取 Source!A1 写入 Target!B2' }).ref, 'Target!B2');
  for (const description of ['未标注位置', '读取 Sales!A1:D4 写入 Summary!A1:B4', 'Summary!A1:B4oops', 'Summary!A1:B0', '[external.xlsx]Summary!A1:B4', 'Sales Data!A1:B4', 'Summary!A1:B4,Other!A0']) assert.equal(renderLocation({ description }), undefined);
  assert.equal(renderLocation({ targetRef: 'invalid', description: text }), undefined);
});
