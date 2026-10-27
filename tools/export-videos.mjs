import { readFile, writeFile } from 'node:fs/promises'
import { buildSpecialChapters } from './special-topics.mjs'

const source = process.argv[2] || new URL('../../kaoyan-workbench/data/app-data.json', import.meta.url)
const store = JSON.parse(await readFile(source, 'utf8'))
const chapters = [
  ['fn', '函数极限连续', ['函数极限连续']],
  ['dy', '一元微分', ['一元微分']],
  ['jf', '积分', ['积分']],
  ['jfyy', '积分应用', ['积分应用·几何', '积分应用·物理']],
  ['ec', '二重积分', ['二重积分']],
  ['dywf', '多元微分', ['多元微分', '多元微分·可微充分条件']],
  ['wffc', '微分方程', ['微分方程']],
  ['ld1', '线性代数 · 上', ['线代上']],
  ['ld2', '线性代数 · 下', ['线代下']],
].map(([id, title, keys]) => ({ id, title, keys, items: [] }))

for (const m of store.materials || []) {
  if (m.type !== '视频') continue
  // 修复导出副本中的已知乱码，原工作台数据保持原样。
  const title = m.title.replace(/^\[\uFFFD+观·/, '[大观·')
  const key = title.match(/^\[大观·([^\]]+)\]/)?.[1]
  const chapter = chapters.find(c => c.keys.includes(key))
  if (!chapter) throw new Error(`未归类视频: ${m.id}`)
  chapter.items.push({ id: m.id, title: title.replace(/^\[大观·[^\]]+\]\s*/, ''),
    section: key, kind: 'chapter', ...videoFields(m.video) })
}
for (const p of store.lecturePoints || []) {
  const chapter = chapters.find(c => c.id === p.matChapter)
  if (!chapter) throw new Error(`未归类考点: ${p.id}`)
  // 对照原始 lecture-points-src.json 恢复这两处损坏的文字。
  const name = p.id === 'ch02-t058' && p.name.includes('\uFFFD')
    ? '参数方程零点导数的定义法（t 在分母上无法直接代入时）' : p.name
  const section = p.id === 'ch02-t040' && p.section.includes('\uFFFD') ? '导数概念' : p.section
  chapter.items.push({ id: p.id, title: name, section: section || '其他考点',
    kind: 'point', ...videoFields(p), uncertain: Boolean(p.uncertain) })
}

function videoFields(v) {
  if (!/^BV[0-9A-Za-z]{10}$/.test(v?.bvid) || !Number.isFinite(v.startSec)
    || !Number.isFinite(v.endSec) || v.startSec < 0 || v.endSec <= v.startSec
    || !Number.isInteger(v.page) || v.page < 1) throw new Error('视频时间数据无效')
  return { bvid: v.bvid, page: v.page, startSec: v.startSec, endSec: v.endSec }
}

const specials = buildSpecialChapters(JSON.parse(await readFile(new URL('../data/special-topics.json', import.meta.url), 'utf8')))
const data = { title: '考研数学视频导航', author: '澄潇宇 · 数学大观',
  chapters: [...chapters.map(({ keys, ...chapter }) => chapter), ...specials] }
const json = JSON.stringify(data).replace(/</g, '\\u003c')
await writeFile(new URL('../videos.js', import.meta.url), `window.VIDEO_LIBRARY = ${json};\n`, 'utf8')
console.log(JSON.stringify({ chapters: data.chapters.length,
  segments: data.chapters.flatMap(c => c.items).filter(i => i.kind === 'chapter').length,
  points: data.chapters.flatMap(c => c.items).filter(i => i.kind === 'point').length }))
