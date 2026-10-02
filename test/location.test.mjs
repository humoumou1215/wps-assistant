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

test('PPT and Word references preserve explicit IDs and split each destination', async () => {
  const { parseDocumentRefs, renderLocations } = await import('../dist/src/location.js');
  const ppt = parseDocumentRefs('presentation', 'SlideID:257!ShapeID:4+Slide:3!Shape:安排2');
  assert.equal(ppt.length, 2); assert.equal(ppt[0].slideId, 257); assert.equal(ppt[0].shapeId, 4); assert.equal(ppt[1].shapeName, '安排2');
  assert.equal(parseDocumentRefs('presentation', '第2页 项目跟进表')[0].table, true);
  assert.deepEqual(parseDocumentRefs('presentation', '第4页 下周工作与资源协调文本框').map(x => x.textTitle), ['下周工作', '资源协调']);
  assert.deepEqual(parseDocumentRefs('writer', '本周概况段落+团队进展表格').map(x => [x.heading, x.afterHeading]), [['本周概况', 'paragraph'], ['团队进展', 'table']]);
  for (const ref of ['Paragraph:4', 'Table:2', 'Heading:关注事项!Paragraph', 'Heading:团队进展!Table', 'Bookmark:目标', 'Range:0:20']) assert.equal(parseDocumentRefs('writer', ref).length, 1, ref);
  assert.equal(parseDocumentRefs('writer', 'Heading:段落标题')[0].afterHeading, undefined);
  for (const [type, ref] of [['writer', 'Paragraph:0'], ['writer', 'Table:99999999999999'], ['writer', 'Range:20:1'], ['writer', 'Heading:'], ['writer', 'Paragraph:1+invalid'], ['presentation', 'Slide:0'], ['presentation', 'SlideID:1!ShapeID:-1'], ['presentation', 'Slide:1!ShapeID:2.5'], ['presentation', '第2页 任意描述'], ['presentation', 'SlideID:1!ShapeID:2+'], ['writer', 'Slide:1'], ['presentation', 'Paragraph:1']]) assert.equal(parseDocumentRefs(type, ref).length, 0, ref);
  assert.equal(renderLocations({ targetRef: 'invalid', description: '第2页' }, 'presentation').length, 0);
  assert.equal(renderLocations({ description: '重写本周概况段落与表格' }, 'writer').length, 0);
});
