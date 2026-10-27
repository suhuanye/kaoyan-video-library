(() => {
  'use strict'
  const data = window.VIDEO_LIBRARY
  const chapters = data.chapters
  const search = document.querySelector('#search')
  const clear = document.querySelector('#clear')
  const results = document.querySelector('#results')
  const params = new URLSearchParams(location.hash.slice(1))
  let selected = chapters.some(c => c.id === params.get('chapter')) ? params.get('chapter') : chapters[0].id
  let kind = ['all', 'point', 'chapter'].includes(params.get('kind')) ? params.get('kind') : 'all'
  search.value = params.get('q') || ''
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
  const norm = s => s.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim()
  const time = sec => {
    const s = Math.round(sec), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60)
    return (h ? `${h}:${String(m).padStart(2, '0')}` : String(m)) + ':' + String(s % 60).padStart(2, '0')
  }
  const allItems = chapters.flatMap(c => c.items)
  document.querySelector('#libraryStats').textContent = `${chapters.length} 个章节 / ${allItems.filter(i => i.kind === 'point').length} 个细分考点 / ${allItems.filter(i => i.kind === 'chapter').length} 个章节片段`

  function row(item) {
    const url = `https://www.bilibili.com/video/${item.bvid}?p=${item.page}&t=${Math.round(item.startSec)}`
    return `<div class="video-row"><div class="video-info"><h3 class="video-title">${esc(item.title)}</h3>
      <div class="video-meta"><span>${item.kind === 'point' ? '考点讲解' : '章节片段'}</span>${item.uncertain ? '<span>约略定位</span>' : ''}<span>${Math.max(1, Math.round((item.endSec - item.startSec) / 60))} 分钟${item.page > 1 ? ` · P${item.page}` : ''}</span></div></div>
      <a class="play-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(item.title)}，从 ${time(item.startSec)} 开始播放"><span class="play-icon" aria-hidden="true">▶</span>${time(item.startSec)} – ${time(item.endSec)}<span aria-hidden="true">↗</span></a></div>`
  }

  function groups(items, searching) {
    const groups = new Map()
    for (const item of items) {
      const key = item.kind === 'point' ? `考点 · ${item.section}` : '章节整段'
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key).push(item)
    }
    return [...groups].sort(([a], [b]) => Number(a === '章节整段') - Number(b === '章节整段')).map(([title, list], index) =>
      `<details class="section-group"${searching || index === 0 ? ' open' : ''}><summary><span>${esc(title)}</span><span class="group-count">${list.length} 个视频落点</span><span class="caret" aria-hidden="true">›</span></summary>${list.map(row).join('')}</details>`).join('')
  }

  function render() {
    const q = norm(search.value)
    clear.hidden = !q
    document.querySelector('#chapters').innerHTML = chapters.map((c, i) =>
      `<button type="button" class="chapter-button" data-chapter="${c.id}" aria-pressed="${!q && c.id === selected}"><span class="chapter-number">${String(i + 1).padStart(2, '0')}</span><span>${esc(c.title)}</span><span class="chapter-count">${c.items.length}</span></button>`).join('')
    document.querySelectorAll('[data-kind]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.kind === kind)))
    const chapter = chapters.find(c => c.id === selected)
    document.querySelector('#resultTitle').textContent = q ? `搜索“${search.value.trim()}”` : chapter.title
    document.querySelector('#resultEyebrow').textContent = q ? 'SEARCH ALL CHAPTERS' : `CHAPTER ${String(chapters.indexOf(chapter) + 1).padStart(2, '0')}`
    const tokens = q.split(' ').filter(Boolean)
    const matches = (q ? chapters : [chapter]).map(c => ({ ...c, items: c.items.filter(i =>
      (kind === 'all' || i.kind === kind) && tokens.every(t => norm(`${c.title} ${i.section} ${i.title}`).includes(t))) })).filter(c => c.items.length)
    const total = matches.reduce((sum, c) => sum + c.items.length, 0)
    document.querySelector('#resultCount').textContent = `${q ? '全部章节中找到' : '本章共'} ${total} 个视频落点${q ? `，分布在 ${matches.length} 个章节` : ''}`
    results.innerHTML = total ? matches.map(c => `${q ? `<h3 class="search-chapter">${esc(c.title)}</h3>` : ''}${groups(c.items, Boolean(q))}`).join('')
      : `<div class="empty">${q ? '没有找到对应的视频考点' : '本章暂未收录这类时间点'}<br><small>${q ? '试试更短的关键词，或切换视频类型。' : '可以切换到「全部」查看现有章节讲解。'}</small>${kind !== 'all' ? '<br><button type="button" class="reset-filter" data-kind="all">查看全部类型</button>' : ''}</div>`
    const next = new URLSearchParams({ chapter: selected })
    if (kind !== 'all') next.set('kind', kind)
    if (q) next.set('q', search.value.trim())
    history.replaceState(null, '', '#' + next.toString())
  }
  document.addEventListener('click', event => {
    const chapter = event.target.closest('[data-chapter]')
    const filter = event.target.closest('[data-kind]')
    if (chapter) { selected = chapter.dataset.chapter; search.value = ''; render() }
    if (filter) { kind = filter.dataset.kind; render() }
  })
  search.addEventListener('input', render)
  clear.addEventListener('click', () => { search.value = ''; render(); search.focus() })
  render()
})()
