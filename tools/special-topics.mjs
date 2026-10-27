import assert from 'node:assert/strict'

export function parseTimestamp(text) {
  const parts = text.split(/[:：]/).map(Number)
  assert.ok(parts.length >= 2 && parts.length <= 3 && parts.every(Number.isInteger))
  assert.ok(parts.every(n => n >= 0) && parts.slice(1).every(n => n < 60))
  return parts.reduce((sum, n) => sum * 60 + n, 0)
}

export function buildSpecialChapters(data) {
  return data.courses.map(course => {
    const items = []
    for (const page of course.pages) {
      const stages = page.stages.length ? page.stages : [[0, page.duration, page.title]]
      let lastEnd = 0
      for (const [from, to, title] of stages) {
        assert.ok(from === lastEnd && to > from && to <= page.duration, `${course.id} P${page.page}: 章节边界无效`)
        lastEnd = to
        items.push({ id: `${course.id}-p${page.page}-stage-${from}`, title: `${page.title} · ${title}`,
          section: page.title, kind: 'chapter', bvid: course.bvid, page: page.page, startSec: from, endSec: to,
          source: { type: page.stages.length ? 'official' : 'whole', url: `https://www.bilibili.com/video/${course.bvid}/?p=${page.page}`, checkedAt: data.checkedAt } })
      }
      assert.equal(lastEnd, page.duration)
    }
    for (const timeline of course.timelines) {
      const page = course.pages.find(p => p.page === timeline.page)
      assert.ok(page, '评论必须对应到实际存在的分P')
      const marks = timeline.marks.map(([time, title]) => ({ time, title, sec: parseTimestamp(time) }))
      for (let index = 0; index < marks.length; index++) {
        const mark = marks[index]
        assert.ok(mark.sec < page.duration && mark.sec >= 0)
        if (index) assert.ok(mark.sec > marks[index - 1].sec, '评论时间必须递增，不自动猜测修正')
        const stage = page.stages.find(([from, to]) => mark.sec >= from && mark.sec < to)
        assert.ok(stage, '细分考点必须处于已核对的官方章节内')
        const end = Math.min(marks[index + 1]?.sec ?? page.duration, stage[1])
        items.push({ id: `${course.id}-p${page.page}-point-${mark.sec}`, title: mark.title,
          section: `${page.title} · ${stage[2]}`, kind: 'point', bvid: course.bvid, page: page.page,
          startSec: mark.sec, endSec: end, uncertain: (timeline.approximate || []).includes(mark.time),
          source: { type: 'comment', rpid: timeline.rpid, root: timeline.root,
            url: `https://www.bilibili.com/video/${course.bvid}/?p=${page.page}&comment_on=1&comment_root_id=${timeline.root}&comment_secondary_id=${timeline.rpid}#reply${timeline.rpid}`,
            checkedAt: data.checkedAt, endBasis: 'next-marker-or-stage-end' } })
      }
    }
    return { id: course.id, title: course.title, group: '数一数三专项', audience: course.audience, note: course.note, items }
  })
}
