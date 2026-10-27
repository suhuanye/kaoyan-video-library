import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import { createHash } from 'node:crypto'

const source = await readFile(new URL('../videos.js', import.meta.url), 'utf8')
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8')
for (const file of ['app.css', 'videos.js', 'app.js']) {
  const bytes = await readFile(new URL('../' + file, import.meta.url))
  const version = createHash('sha256').update(bytes).digest('hex').slice(0, 12)
  assert.ok(html.includes(`./${file}?v=${version}`), `${file} 的缓存版本未更新，请运行 tools/export-videos.mjs`)
}
const context = { window: {} }
vm.runInNewContext(source, context)
const data = context.window.VIDEO_LIBRARY
assert.equal(data.chapters.length, 11)
const items = data.chapters.flatMap(c => c.items)
const original = data.chapters.slice(0, 9).flatMap(c => c.items)
assert.equal(original.filter(i => i.kind === 'chapter').length, 194)
assert.equal(original.filter(i => i.kind === 'point').length, 442)
assert.equal(items.filter(i => i.kind === 'chapter').length, 227)
assert.equal(items.filter(i => i.kind === 'point').length, 541)
assert.equal(new Set(items.map(i => i.id)).size, items.length)
assert.ok(!source.includes('\uFFFD'), '导出数据不能包含乱码替代字符')
assert.ok(!/[A-Z]:[\\/]/.test(source), '导出数据不能包含本机绝对路径')
for (const item of items) {
  assert.ok(item.title && item.section)
  assert.match(item.bvid, /^BV[0-9A-Za-z]{10}$/)
  assert.ok(Number.isInteger(item.page) && item.page > 0)
  assert.ok(item.startSec >= 0 && item.endSec > item.startSec)
  assert.ok(Object.keys(item).every(key => ['id', 'title', 'section', 'kind', 'bvid', 'page', 'startSec', 'endSec', 'uncertain', 'source'].includes(key)))
}
const evidence = JSON.parse(await readFile(new URL('../data/special-topics.json', import.meta.url), 'utf8'))
for (const course of evidence.courses) {
  const chapter = data.chapters.find(c => c.id === course.id)
  for (const item of chapter.items) {
    const page = course.pages.find(p => p.page === item.page)
    assert.ok(page && item.endSec <= page.duration)
    assert.ok(item.source && new URL(item.source.url).hostname === 'www.bilibili.com')
    if (item.kind === 'point') {
      const timeline = course.timelines.find(t => t.rpid === item.source.rpid)
      assert.equal(timeline?.page, item.page, '评论坐标必须指向主题对应的实际分P')
      const stage = page.stages.find(([from, to]) => item.startSec >= from && item.startSec < to)
      assert.ok(stage && item.endSec <= stage[1], '细分区间不能跨越官方章节边界')
    }
  }
}
const series = data.chapters.find(c => c.id === 'series')
assert.equal(series.items.filter(i => i.kind === 'point').length, 99)
assert.ok(series.items.some(i => i.page === 4 && i.startSec === 741))
assert.ok(series.items.some(i => i.page === 5 && i.startSec === 600))
assert.ok(series.items.some(i => i.page === 6 && i.startSec === 220))
assert.ok(!series.items.some(i => i.kind === 'point' && i.page === 3 && i.startSec === 159))
const geometry = data.chapters.find(c => c.id === 'line-surface')
assert.equal(geometry.items.length, 8)
assert.equal(geometry.items.filter(i => i.source.type === 'comment').length, 0)
assert.ok(geometry.items.some(i => i.page === 3 && i.startSec === 0 && i.endSec === 2833 && i.source.type === 'whole'))
console.log(`PASS: ${data.chapters.length} chapters, ${items.length} valid video targets; no duplicate IDs, replacement characters, or local paths.`)
