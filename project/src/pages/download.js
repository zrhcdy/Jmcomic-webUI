import { jmApi } from "../api/JmcomicApi.js";
import { setting } from "../components/general/Setting.js";
import { NavManager } from "../components/general/NavManager.js";
import { ComicImageFetcher, readImageSize, isScrambled } from "../components/download/ComicImageFetcher.js";
import { layoutLongImage, LongImageRenderer } from "../components/download/LongImageMaker.js";
import { ZipPacker } from "../components/download/ZipPacker.js";

/** 支持的下载模式 */
const MODES = {
    longimg: "长图片",
    zipper: "zip 压缩包",
};
/** 连续保存多个文件时中间歇一下，免得浏览器把它们当成自动下载给拦掉 */
const SAVE_INTERVAL = 500;
/** 长图导出的 jpeg 质量 */
const LONG_IMAGE_QUALITY = 0.95;
/** 长图模式里，下载图片占一章进度的比例，剩下的用来拼接导出 */
const DOWNLOAD_PHASE = 0.7;
/** zip 模式里，收集图片占总体进度的比例，剩下的用来生成压缩包 */
const ZIP_COLLECT_PHASE = 0.85;
/** 连续这么多章都失败，就当成全局问题（图源挂了 / 跨域被拦）不再往下跑 */
const MAX_CONSECUTIVE_FAILURES = 3;

/**
 * download.html 的页面逻辑。
 * 用法：download.html?id=章节id&mode=longimg|zipper
 * longimg 每章导出一张长图（超过 canvas 上限就切成多张），
 * zipper 把勾选的章节按 章节N/ 目录打进一个 zip。
 */
class DownloadPage {
    #id = "";
    #mode = "";
    #album = null;
    /** 章节列表，[{ id, label }] */
    #chapters = [];
    /** 勾选的章节下标 */
    #selected = new Set();
    /** 章节图片列表的缓存，避免重复请求 */
    #imageCache = new Map();
    #fetcher = new ComicImageFetcher();
    #running = false;
    #cancelled = false;
    #dom = {};

    async init() {
        this.#collectDom();
        try {
            new NavManager().init();
            setting.init();
            if (!this.#readParams()) return;
            this.#bindEvents();
            await this.#loadAlbum();
        } catch (error) {
            console.error(error);
            this.#fail(`页面初始化失败：${error.message}`);
        }
    }

    /* ---------- 页面准备 ---------- */

    #collectDom() {
        const pick = (id) => document.getElementById(id);
        this.#dom = {
            cover: pick("dl-cover"),
            name: pick("dl-name"),
            meta: pick("dl-meta"),
            param: pick("dl-param"),
            error: pick("dl-error"),
            chapters: pick("dl-chapters"),
            selectedCount: pick("dl-selected-count"),
            selectAll: pick("dl-select-all"),
            selectNone: pick("dl-select-none"),
            start: pick("dl-start"),
            cancel: pick("dl-cancel"),
            status: pick("dl-status"),
            progressInner: pick("dl-progress-inner"),
            progressText: pick("dl-progress-text"),
            log: pick("dl-log"),
        };
    }

    #readParams() {
        const params = new URLSearchParams(location.search);
        const id = params.get("id");
        const mode = params.get("mode");
        if (!id || Number.isNaN(Number(id))) {
            this.#fail("缺少或非法的 id 参数，用法：download.html?id=章节id&mode=longimg");
            return false;
        }
        if (!Object.hasOwn(MODES, mode)) {
            this.#fail("缺少或非法的 mode 参数，只支持 longimg（长图片）和 zipper（zip 压缩包）");
            return false;
        }
        this.#id = id;
        this.#mode = mode;
        if (this.#dom.param) this.#dom.param.textContent = `id=${id}　mode=${mode}（${MODES[mode]}）`;
        return true;
    }

    #bindEvents() {
        this.#dom.chapters?.addEventListener("change", (event) => {
            const index = Number(event.target.dataset.index);
            if (Number.isNaN(index)) return;
            if (event.target.checked) this.#selected.add(index);
            else this.#selected.delete(index);
            this.#updateSelectedCount();
        });
        this.#dom.selectAll?.addEventListener("click", () => this.#toggleAll(true));
        this.#dom.selectNone?.addEventListener("click", () => this.#toggleAll(false));
        this.#dom.start?.addEventListener("click", () => this.#start());
        this.#dom.cancel?.addEventListener("click", () => {
            this.#cancelled = true;
            this.#setStatus("正在取消…");
        });
    }

    /* ---------- 漫画信息 ---------- */

    async #loadAlbum() {
        this.#setStatus("正在获取漫画信息…");
        await jmApi.init();
        const album = await jmApi.getComicAlbum(this.#id);
        if (!album) throw new Error("图源没有返回漫画信息");
        this.#album = album;
        this.#chapters = this.#buildChapters(album);
        this.#renderAlbum();
        this.#renderChapters();
        this.#setStatus(`请勾选要下载的章节（共 ${this.#chapters.length} 章）`);
    }

    #buildChapters(album) {
        const series = Array.isArray(album.series) ? album.series : [];
        // 没有 series 的作品本身就只有一个章节，就是地址里的这个 id
        if (!series.length) return [{ id: this.#id, label: "章节1" }];
        return series.map((item, index) => ({ id: item.id, label: `章节${index + 1}` }));
    }

    #renderAlbum() {
        const album = this.#album;
        if (this.#dom.cover) {
            this.#dom.cover.src = jmApi.getCoverImageURL(this.#id);
            this.#dom.cover.alt = album.name ?? "";
        }
        if (this.#dom.name) this.#dom.name.textContent = album.name ?? "未命名";
        if (this.#dom.meta) {
            const authors = Array.isArray(album.author) ? album.author.join(" & ") : "";
            const prefix = authors ? `${authors}　` : "";
            this.#dom.meta.textContent = `${prefix}共 ${this.#chapters.length} 章　下载格式：${MODES[this.#mode]}`;
        }
    }

    #renderChapters() {
        const list = this.#dom.chapters;
        if (!list) return;
        list.textContent = "";
        this.#selected.clear();
        this.#chapters.forEach((chapter, index) => {
            const item = document.createElement("label");
            item.className = "chapter-item";
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = true;
            checkbox.dataset.index = String(index);
            const text = document.createElement("span");
            text.textContent = chapter.label;
            item.append(checkbox, text);
            list.append(item);
            this.#selected.add(index);
        });
        this.#updateSelectedCount();
    }

    #toggleAll(checked) {
        this.#selected.clear();
        this.#dom.chapters?.querySelectorAll("input[type=checkbox]").forEach((checkbox) => {
            checkbox.checked = checked;
            if (checked) this.#selected.add(Number(checkbox.dataset.index));
        });
        this.#updateSelectedCount();
    }

    #updateSelectedCount() {
        if (this.#dom.selectedCount) {
            this.#dom.selectedCount.textContent = `已选 ${this.#selected.size}/${this.#chapters.length} 章`;
        }
        this.#syncButtons();
    }

    #syncButtons() {
        if (this.#dom.start) this.#dom.start.disabled = this.#running || !this.#selected.size || !this.#album;
        if (this.#dom.cancel) this.#dom.cancel.disabled = !this.#running;
    }

    /* ---------- 下载流程 ---------- */

    async #start() {
        if (this.#running || !this.#album) return;
        const selected = [...this.#selected].sort((a, b) => a - b);
        if (!selected.length) {
            this.#setStatus("请先勾选要下载的章节");
            return;
        }
        this.#running = true;
        this.#cancelled = false;
        this.#syncButtons();
        this.#clearLog();
        this.#setProgress(0);
        try {
            if (this.#mode === "zipper") await this.#runZipper(selected);
            else await this.#runLongImage(selected);
            this.#finish(this.#cancelled ? "已取消" : "全部下载完成");
        } catch (error) {
            console.error(error);
            this.#finish(`下载失败：${error.message}`);
        } finally {
            this.#running = false;
            this.#syncButtons();
        }
    }

    async #runLongImage(selected) {
        await this.#runChapters(selected, (chapter, position, total) =>
            this.#buildChapterLongImage(chapter, position, total),
        );
    }

    /**
     * 逐章跑一遍。单章失败不打断整批，
     * 但连续好几章都失败说明是图源、跨域这类全局问题，就先停下来别白跑一遍
     * @param {number[]} selected 勾选的章节下标
     * @param {(chapter:object,position:number,total:number)=>Promise<void>} handler 处理单章
     */
    async #runChapters(selected, handler) {
        let failures = 0;
        for (const [position, index] of selected.entries()) {
            if (this.#cancelled) return;
            const chapter = this.#chapters[index];
            try {
                await handler(chapter, position, selected.length);
                failures = 0;
            } catch (error) {
                console.error(error);
                failures++;
                this.#log(`${chapter.label}：处理失败（${error.message}），已跳过`);
                if (failures >= MAX_CONSECUTIVE_FAILURES) {
                    throw new Error(`连续 ${failures} 章都失败了，先停下来看看：${error.message}`);
                }
            }
        }
    }

    async #buildChapterLongImage(chapter, position, total) {
        const paths = await this.#getImages(chapter.id);
        if (!paths.length) {
            this.#log(`${chapter.label}：没有图片，已跳过`);
            return;
        }
        // 第一遍：先把图都下回来，顺便量好尺寸，这样后面分段才算得准
        const blobs = [];
        const sizes = [];
        for (const [index, path] of paths.entries()) {
            const blob = await this.#fetcher.download(chapter.id, path);
            blobs.push(blob);
            sizes.push(await readImageSize(blob));
            this.#setStatus(`第 ${position + 1}/${total} 章（${chapter.label}）：正在下载图片 ${index + 1}/${paths.length}`);
            this.#progress(position, total, DOWNLOAD_PHASE * ((index + 1) / paths.length));
        }
        // 第二遍：按分段一张张拼出来
        const width = sizes[0].width;
        if (!width) throw new Error(`${chapter.label}：第一张图片尺寸异常`);
        const parts = layoutLongImage(sizes, width);
        const renderer = new LongImageRenderer(width, LONG_IMAGE_QUALITY);
        for (const [partIndex, part] of parts.entries()) {
            if (this.#cancelled) return;
            this.#setStatus(`第 ${position + 1}/${total} 章（${chapter.label}）：正在拼接长图 ${partIndex + 1}/${parts.length}`);
            const blob = await renderer.render(part, (index) =>
                this.#fetcher.decode(blobs[index], chapter.id, paths[index]),
            );
            const suffix = parts.length > 1 ? `_${partIndex + 1}` : "";
            this.#save(blob, `${this.#safeName(this.#album.name)}_${chapter.label}${suffix}.jpg`);
            this.#log(`${chapter.label}：已导出长图 ${partIndex + 1}/${parts.length}（${this.#sizeText(blob.size)}）`);
            this.#progress(position, total, DOWNLOAD_PHASE + (1 - DOWNLOAD_PHASE) * ((partIndex + 1) / parts.length));
            await this.#sleep(SAVE_INTERVAL);
        }
    }

    async #runZipper(selected) {
        if (!ZipPacker.isAvailable()) throw new Error("JSZip 没有加载成功，无法打包成 zip");
        const packer = new ZipPacker();
        await this.#runChapters(selected, (chapter, position, total) =>
            this.#collectChapter(packer, chapter, position, total),
        );
        if (this.#cancelled) return;
        if (!packer.count) throw new Error("没有取到任何图片，压缩包没有生成");
        this.#setStatus("正在生成 zip 压缩包…");
        const zipBlob = await packer.generate((percent) =>
            this.#setProgress(ZIP_COLLECT_PHASE * 100 + percent * (1 - ZIP_COLLECT_PHASE)),
        );
        this.#save(zipBlob, `${this.#safeName(this.#album.name)}.zip`);
        this.#log(`压缩包共 ${packer.count} 张图片，${this.#sizeText(zipBlob.size)}`);
    }

    /**
     * 把一章的图片（还原后）加进压缩包
     * @param {ZipPacker} packer 压缩包
     * @param {object} chapter 章节
     * @param {number} position 第几章（从 0 开始）
     * @param {number} total 一共几章
     */
    async #collectChapter(packer, chapter, position, total) {
        const paths = await this.#getImages(chapter.id);
        for (const [imageIndex, path] of paths.entries()) {
            if (this.#cancelled) return;
            const fileName = `${String(imageIndex + 1).padStart(3, "0")}${this.#extensionOf(path)}`;
            const entry = `${chapter.label}/${fileName}`;
            const blob = await this.#fetcher.download(chapter.id, path);
            if (isScrambled(chapter.id, path)) {
                // 被打乱过的图必须重新编码一份正常的；canvas 用完立刻释放
                const canvas = await this.#fetcher.decode(blob, chapter.id, path);
                await packer.addCanvas(entry, canvas, fileName);
                canvas.width = 0;
                canvas.height = 0;
            } else {
                // 老章节和 gif 的原图本来就是对的，直接放原件，还能少解码一次；
                // gif 这样也保住了动图
                packer.addBlob(entry, blob, fileName);
            }
            this.#setStatus(`第 ${position + 1}/${total} 章（${chapter.label}）：已加入 ${imageIndex + 1}/${paths.length} 张`);
            this.#progress(position, total, 0.3 + 0.6 * ((imageIndex + 1) / paths.length), ZIP_COLLECT_PHASE);
        }
        this.#log(`${chapter.label}：${paths.length} 张图片已加入压缩包`);
    }

    /**
     * 取某个章节的图片路径名列表
     * @param {string|number} chapterId 章节 id
     * @returns {Promise<string[]>}
     */
    async #getImages(chapterId) {
        if (!this.#imageCache.has(chapterId)) {
            const chapter = await jmApi.getComicChapter(chapterId);
            this.#imageCache.set(chapterId, Array.isArray(chapter?.images) ? chapter.images : []);
        }
        return this.#imageCache.get(chapterId);
    }

    /* ---------- 界面 ---------- */

    #setStatus(message) {
        if (this.#dom.status) this.#dom.status.textContent = message;
    }

    #setProgress(percent) {
        const value = Math.max(0, Math.min(100, Number(percent) || 0));
        if (this.#dom.progressInner) this.#dom.progressInner.style.width = `${value}%`;
        if (this.#dom.progressText) this.#dom.progressText.textContent = `${Math.round(value)}%`;
    }

    /**
     * 刷新总进度
     * @param {number} position 当前是第几章（从 0 开始）
     * @param {number} total 一共要下载几章
     * @param {number} fraction 这一章已经完成的占比
     * @param {number} scale 这批进度占总进度的比例
     */
    #progress(position, total, fraction, scale = 1) {
        if (!total) return;
        this.#setProgress(((position + fraction) / total) * scale * 100);
    }

    #log(message) {
        if (!this.#dom.log) return;
        const line = document.createElement("div");
        line.className = "dl-log-line";
        line.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        this.#dom.log.append(line);
        this.#dom.log.scrollTop = this.#dom.log.scrollHeight;
    }

    #clearLog() {
        if (this.#dom.log) this.#dom.log.textContent = "";
    }

    #finish(message) {
        this.#setStatus(message);
        this.#log(message);
    }

    #fail(message) {
        this.#setStatus(message);
        this.#log(message);
        if (this.#dom.error) {
            this.#dom.error.textContent = message;
            this.#dom.error.hidden = false;
        }
        if (this.#dom.start) this.#dom.start.disabled = true;
    }

    /* ---------- 工具 ---------- */

    /**
     * 触发一次浏览器下载
     * @param {Blob} blob 文件数据
     * @param {string} fileName 文件名
     */
    #save(blob, fileName) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        link.style.display = "none";
        document.body.append(link);
        link.click();
        link.remove();
        // 立刻 revoke 有可能让下载半路断掉，等一会儿再回收
        setTimeout(() => URL.revokeObjectURL(url), 60 * 1000);
    }

    #safeName(name) {
        const text = String(name ?? "未命名").replace(/[\\/:*?"<>|\r\n\t]/g, "_").trim();
        return text.slice(0, 60) || "未命名";
    }

    #extensionOf(pathName) {
        const matched = /\.([a-zA-Z0-9]+)$/.exec(String(pathName));
        return matched ? `.${matched[1].toLowerCase()}` : ".jpg";
    }

    #sizeText(bytes) {
        return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
    }

    #sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

const page = new DownloadPage();
page.init().catch((error) => {
    console.error(error);
    const status = document.getElementById("dl-status");
    if (status) status.textContent = `页面初始化失败：${error.message}`;
});
