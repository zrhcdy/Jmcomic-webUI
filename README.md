# jmViewer

一个**纯静态**的漫画浏览前端：界面数据全部来自线上接口，本地没有后端、没有构建步骤、没有 npm 依赖。把仓库克隆下来，用任意静态服务器打开 `index.html` 就能跑。
> 预览地址：<https://zrhcdy.github.io/Jmcomic-webUI/project/index.html>

> 仓库地址：<https://github.com/zrhcdy/Jmcomic-webUI>

---

## 快速开始

**不能用 `file://` 直接双击打开 HTML** —— 项目用的是原生 ES Module，浏览器会以 CORS 为由拒绝加载，`fetch` 也一样。必须走 HTTP 服务。
**JM的服务器非常烂，如果遇到封面加载不出是正常现象( 封面已有重试机制，但还是避免不了）。
任选一种起服务的方式，在项目根目录执行：

```bash
# VS Code：装 Live Server 插件，右键 index.html → Open with Live Server（默认 5501 端口）

# 或者 Python
python -m http.server 5501

# 或者 Node
npx serve -l 5501
```

然后访问 <http://127.0.0.1:5501/index.html>。

> 端口随便，5501 只是开发时用的习惯值。页面之间的跳转全是相对路径，换端口不用改代码。

**环境要求**：只要求一个较新的浏览器（需要支持 `IntersectionObserver`、`createImageBitmap`、可选链等）。不需要 Node.js、不需要 npm install —— `src/utils/jszip.min.js` 已经作为普通文件随仓库提供。

---

## 页面一览

| 页面 | 入口脚本 | 说明 |
| --- | --- | --- |
| [index.html](index.html) | [src/pages/index.js](src/pages/index.js) | 首页：热门轮播、标签快捷入口、推广推荐位 |
| [latest.html](latest.html) | [src/pages/latest.js](src/pages/latest.js) | 最新更新，滚动到底自动加载下一页 |
| [categories.html](categories.html) | [src/pages/categories.js](src/pages/categories.js) | 分类浏览：分类选择 + 排序筛选，同样无限加载 |
| [search.html](search.html) | [src/pages/search.js](src/pages/search.js) | 搜索，地址栏参数 `?sq=关键词` |
| [chapter.html](chapter.html) | [src/pages/chapter.js](src/pages/chapter.js) | 章节阅读页：作品信息、章节列表、图片阅读、评论、下载入口 |
| [favorite.html](favorite.html) | [src/pages/favorite.js](src/pages/favorite.js) | 收藏列表（存在本地） |
| [history.html](history.html) | [src/pages/history.js](src/pages/history.js) | 浏览历史（存在本地） |
| [setting.html](setting.html) | [src/pages/setting.js](src/pages/setting.js) | 设置：主题配色、图片预加载边距 |
| [download.html](download.html) | [src/pages/download.js](src/pages/download.js) | 下载页：`?id=作品id&mode=longimg\|zipper` |

### 各页面的参数

- **search.html** — `?sq=关键词`。如果关键词是一个大于 10 的纯整数，会先把它当作品 ID 直接查一次作品并置顶（方便直接粘 JM 号），再照常出搜索结果。
- **chapter.html** — `?id=作品id`。如果这部作品有多话，章节列表按 `album.series` 的顺序渲染；只有一话时就是作品本身。
- **download.html** — `?id=作品id&mode=longimg|zipper`，两个参数都会校验，非法值直接报错。

---

## 目录结构

```
.
├── index.html / latest.html / categories.html / search.html
├── chapter.html / favorite.html / history.html / setting.html
├── download.html
├── image/                        静态图标（封面占位、hot、looking）
├── style/                        每个页面一个 CSS + 一个 basic.css（全局与主题变量）
│   ├── basic.css                 全局样式 + 6 套主题的全部颜色变量
│   ├── index.css  chapter.css  categories.css  favorite.css
│   ├── history.css  latest.css  search.css  setting.css  download.css
└── src/
    ├── api/
    │   ├── JmcomicApi.js         接口封装（唯一对外出口 jmApi）
    │   └── Crypto.js             接口数据的解密
    ├── utils/
    │   ├── crypto.js             CryptoJS（供 Crypto.js 使用）
    │   └── jszip.min.js          JSZip 3.10.1（打包 zip 用）
    ├── dom/
    │   └── LazyLoader.js         封面图懒加载
    ├── pages/                    每个 HTML 对应一个入口脚本
    ├── components/               按页面/职责拆分的 UI 组件
    │   ├── general/              Setting、NavManager、Queue、ImageCutter、
    │   │                         SwitchServerBtnManager、InfinityScrollContainer、Carousel
    │   ├── index/                BannerManager、TagContainerManager、RecommendationsManager
    │   ├── latest/ categories/ search/ favorite/ history/
    │   ├── chapter/              HeadManager、SeriesManager、ComicImageManager、
    │   │                         ComicImageLoader、CommentManager、Evaluation、
    │   │                         ReadingProgress、RecommendedComicsManager、DownloadBtnManager
    │   └── download/             ComicImageFetcher、LongImageMaker、ZipPacker
    └── ...
```

每个 HTML 的 `<body>` 第一个子元素都是一小段同步脚本（见[主题](#主题)），紧接着才是页面结构。

---

## 功能说明

### 导航与图源

每个页面顶部都有同一套导航：桌面端 `.nav`（首页 / 最新 / 分类 ｜ 收藏 / 历史 / 设置 + 搜索框），移动端 `.mob-nav`（汉堡菜单）。这两块由 [NavManager.js](src/components/general/NavManager.js) 统一接管，搜索框提交后跳 `search.html?sq=`。

导航右侧的「图源 N」是图片服务器切换（共 6 条线路），由 [SwitchServerBtnManager.js](src/components/general/SwitchServerBtnManager.js) 处理，选中的线路记在 `localStorage`，所有图片链接都跟着它走。

### 阅读体验

章节页 [ComicImageManager.js](src/components/chapter/ComicImageManager.js) 按 `chapter.images` 生成占位容器，[ComicImageLoader.js](src/components/chapter/ComicImageLoader.js) 用 `IntersectionObserver` 逐张加载：滚动到附近才开始下载，加载完更新顶部与移动端的阅读进度。预加载的提前量就是设置里的「图片预加载边距」。

作品信息（封面 / 标题 / 作者 / 收藏按钮）、章节列表、点赞与浏览量、评论区、相关推荐分别由 `HeadManager`、`SeriesManager`、`Evaluation`、`CommentManager`、`RecommendedComicsManager` 填充。

### 收藏与历史

两者都只存在浏览器本地（`localStorage`），没有账号系统。章节页的收藏按钮写入 `favorite`，浏览章节时写入 `history`。

### 主题

见下方[主题](#主题)一节。

### 下载

见下方[下载功能](#下载功能)一节。

---

## 设置项

设置由 [Setting.js](src/components/general/Setting.js) 统一管理（单例 `setting`）。它有一份白名单，只有白名单里的键值才允许读写 —— 换句话说，设置项的合法取值在代码里写死，UI 只是把可选值画出来。

| 键（localStorage） | 可选值 | 默认 | 说明 |
| --- | --- | --- | --- |
| `using_imgserver_index` | `"0"` ~ `"5"` | `"0"` | 使用第几条图片服务器线路（对应导航上的「图源 N」） |
| `app_theme` | `pink` `blue` `green` `purple` `gray` `dark` | `pink` | 配色主题 |
| `root_margin` | `0px` `50px` `100px` `200px` `500px` | `50px` | 图片懒加载的预加载边距，越大越早开始加载 |

> 注意：`root_margin` 是在创建 `IntersectionObserver` 时读取的，而 `rootMargin` 一旦创建就不能修改 —— **改完设置要重新进一次章节页才生效**。

`setting.init()` 会在读取时校验本地存的值：合法就采用，非法就把它改回默认值。

---

## 主题

界面里的所有颜色都走 CSS 变量，不再有硬编码色值。变量集中定义在 [style/basic.css](style/basic.css) 顶部的 `.pink-theme, :root { … }`，每套主题 **49 个变量**。

- `:root` 与 `.pink-theme` 并列，所以**没有任何主题类时就是粉色**（默认主题，兜底）。
- 另外 5 套是同优先级的类选择器，写在 `:root` 之后：`.blue-theme`、`.green-theme`、`.purple-theme`、`.gray-theme`、`.dark-theme`。
- 切换时只改 `document.documentElement` 的类名：先摘掉旧主题类，再加 `{theme}-theme`。

**避免主题闪烁**：每个 HTML 的 `<body>` 第一个子元素都有一段同步脚本：

```html
<script>
    // 应用已保存的主题，避免页面先以默认主题渲染再变色
    (function () {
        const theme = localStorage.getItem("app_theme");
        if (theme) document.documentElement.classList.add(theme + "-theme");
    })();
</script>
```

它是普通（非 module）脚本，会同步阻塞执行，位置又在 body 最前面，因此在内容解析/绘制之前就已经把主题类打好了；而 head 里阻塞渲染的 CSS 已经就绪，所以不会出现「先粉一下再变色」。module 脚本是 defer 的，做不到这一点 —— 这也是它单独写成一段而不是放进入口脚本的原因。

这段脚本**刻意不做白名单校验**：写入端 `setting.setOption` 已经校验过了；就算本地存了个非法值，也只是拼出一个匹配不到任何规则的无害类名，`:root` 的粉色依然兜底。好处是新增主题时不用动 8 份 HTML。

**调整配色**：想改配色，改 [style/basic.css](style/basic.css) 里对应主题块的变量即可，不用碰其它 CSS。

---

## 下载功能

### 入口

章节页作者名下面有一个「下载」按钮（[DownloadBtnManager.js](src/components/chapter/DownloadBtnManager.js)），点开选「长图」或「压缩包」，会带着当前作品的 id 跳到：

```
download.html?id=<作品id>&mode=<longimg | zipper>
```

这个按钮只依赖地址栏里的 `id`，**不等待接口返回**，所以作品信息还没加载出来（甚至加载失败）时也能用。

### 两种模式

下载页会列出这部作品的所有章节，默认全选，也可以逐章勾选。

| 模式 | 产物 | 说明 |
| --- | --- | --- |
| `longimg` | `作品名_章节N.jpg` | 每章拼成一张竖长图。超过浏览器 canvas 上限时自动切成 `作品名_章节N_1.jpg`、`_2` … |
| `zipper` | `作品名.zip` | 所选章节打进一个压缩包，条目为 `章节N/001.jpg` |

两种模式输出都是 **JPEG**（长图走 canvas 重编码）。处理过程中会显示进度、逐条日志，可以中途取消；单章失败只记日志跳过，连续 3 章失败才认定是全局问题并中止（比如线路挂了或被跨域拦了）。

### 为什么不能直接存原图

图片服务器上的图有一部分是**打乱过的**：站点把原图横向切片重排，同时用 CSS 把 `img` 涂黑（`.comic-img img { filter: brightness(0) }`）当防抓手段，只有站点自己用 canvas 还原出来的画面才看得见。所以下载时：

- 满足「章节 id ≥ 220980 且扩展名不是 `.gif`」的图片，必须用 canvas 按同样的规则重排切片再导出；
- 其余图片（老章节、gif）原本就是对的，**直接存原始字节**（顺带保住 gif 动图）。

解扰逻辑在 [ImageCutter.js](src/components/general/ImageCutter.js)，下载侧复用它。

### 关于 CORS

这是整个下载功能**最大的不确定因素**：图片必须先 `fetch` 成 blob、再喂给 `<img>`/canvas，否则 canvas 会被污染（tainted），导出时直接抛 `SecurityError`。这要求图片 CDN 返回允许跨域的响应头。

如果哪条图源线路没回 CORS 头，该线路下长图与压缩包两种模式都会失败（日志里能看到明确的报错，而不是静默出错）。遇到这种情况，换一条图源试试。

### JSZip

zip 由 [JSZip 3.10.1](src/utils/jszip.min.js)（UMD 版）生成，[download.html](download.html) 用普通 `<script>` 引入后读 `window.JSZip`。

图片本身已经是压缩格式，再 deflate 一遍几乎压不了多少、只白烧 CPU 和内存，所以 **图片条目一律用 STORE 存储**；压缩包的默认算法仍是 DEFLATE，留给非图片文件。

如果这个文件丢了或需要升级，重新下载一份放回原位即可：

```bash
curl -L -o src/utils/jszip.min.js https://unpkg.com/jszip@3.10.1/dist/jszip.min.js
# 3.10.1 的完整大小应为 97630 字节
```

[download.html](download.html) 里还留了一条同步的 CDN 兜底（本地文件加载失败时用 `document.write` 补一个 unpkg 的 `<script>`），正常运行不会走到。

---

## 技术实现要点

- **无框架、无打包**：所有脚本都是原生 ES Module，用相对路径直接 `import`。改完代码刷新页面即可，没有编译步骤。
- **组件按页面分目录**：`src/components/<page>/`，通用组件放 `src/components/general/`，每个 HTML 只引一个 `src/pages/*.js` 入口。
- **接口层单一出口**：业务代码只用 `jmApi`（[JmcomicApi.js](src/api/JmcomicApi.js)）的方法，它统一处理鉴权参数、地址解密、失败重试。`jmApi.init()` 会先取一个时间戳作为密钥、算出 access token，再拉取服务器列表。
- **懒加载 + 提前量**：封面图由 [LazyLoader.js](src/dom/LazyLoader.js)（`IntersectionObserver`）加载；章节图片由 `ComicImageLoader` 加载，并用 `Queue` 限制并发，队列长度会根据时间段动态调整。
- **无限滚动**：列表页都复用 [InfinityScrollContainer.js](src/components/general/InfinityScrollContainer.js) —— 触底自动加载下一页，带 1 秒冷却与页码上限（搜索每页 80 条）。
- **本地数据**：收藏、历史、设置、推广位缓存都存在 `localStorage`，没有服务端。

---

## 免责声明

- 本项目只是一个**界面**，不含任何内容；所有漫画数据、图片都来自第三方接口，与项目作者无关。
- 请遵守你所在地区的法律法规，以及内容来源方的服务条款。
- 下载功能仅供个人备份离线阅读使用，请勿二次传播或用于任何商业用途。
- 如有侵权，请联系删除。
