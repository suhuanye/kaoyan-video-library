import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'

const source = await readFile(new URL('../videos.js', import.meta.url), 'utf8')
const context = { window: {} }
vm.runInNewContext(source, context)
const data = context.window.VIDEO_LIBRARY
assert.equal(data.chapters.length, 9)
const items = data.chapters.flatMap(c => c.items)
assert.equal(items.filter(i => i.kind === 'chapter').length, 194)
assert.equal(items.filter(i => i.kind === 'point').length, 442)
assert.equal(new Set(items.map(i => i.id)).size, items.length)
assert.ok(!source.includes('\uFFFD'), '导出数据不能包含乱码替代字符')
assert.ok(!/[A-Z]:[\\/]/.test(source), '导出数据不能包含本机绝对路径')
for (const item of items) {
  assert.ok(item.title && item.section)
  assert.match(item.bvid, /^BV[0-9A-Za-z]{10}$/)
  assert.ok(Number.isInteger(item.page) && item.page > 0)
  assert.ok(item.startSec >= 0 && item.endSec > item.startSec)
  assert.ok(Object.keys(item).every(key => ['id', 'title', 'section', 'kind', 'bvid', 'page', 'startSec', 'endSec', 'uncertain'].includes(key)))
}
console.log(`PASS: ${data.chapters.length} chapters, ${items.length} valid video targets; no duplicate IDs, replacement characters, or local paths.`)
