# 数二视频导航

适合手机和电脑的数学二视频目录。按章节或关键词找到澄潇宇《数学大观》的讲解，点击时间跳到 B 站对应位置。

- 9 个章节，194 个章节片段，442 个细分考点。
- 按章节浏览、跨章节搜索、细分考点 / 章节整段筛选。
- 搜索词、章节和筛选条件保留在网址中，可直接收藏或分享。
- 纯静态页面，无需安装依赖、启动后端或登录；也可直接打开 `index.html`。
- 时间区间用于导航，播放器从起点播放，不会在区间终点自动暂停。标有“约略定位”的考点时间尚有不确定性。

## 更新视频数据

在原工作区中运行：

```sh
node tools/export-videos.mjs
```

也可提供工作台数据文件路径：

```sh
node tools/export-videos.mjs /path/to/app-data.json
```

脚本只导出视频导航字段，不导出个人学习记录、任务、知识卡或本机路径，也不修改源数据。

导出后可运行 `node tools/check-data.mjs` 检查数量、重复 ID、视频时间、乱码及本机路径。

## GitHub Pages

将此目录作为独立仓库上传。在仓库 **Settings → Pages** 选择 **Deploy from a branch**，分支 `main`，目录 `/ (root)`。

此后推送 `main` 会自动更新网页。官方说明：[配置 GitHub Pages 发布来源](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)。

## 数据来源

视频来源：B 站澄潇宇《数学大观》。章节时间来自视频章节及评论区时间轴；细分考点导航元数据来自原工作台已整理的 [数二题型手册](https://math.zmqlss.icu/) 时间点，未复制其题型卡正文。视频版权归原作者及平台所有，本站仅提供目录与跳转。
