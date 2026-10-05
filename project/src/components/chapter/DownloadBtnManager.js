/**
 * 章节页的下载按钮。
 * 点一下展开菜单，选中长图或压缩包之后跳到 download.html。
 * 下载页需要的参数只有两项：章节 id 和模式，所以这里不需要等接口返回，
 * 只要有地址栏里的 id 就能用。
 */
const DOWNLOAD_MODES = ["longimg", "zipper"];

export class DownloadBtnManager {
    downloadBtn;
    menuDom;
    menuItemDoms;
    chapterId;
    isOpen = false;
    constructor() {}
    init(chapterId) {
        this.chapterId = chapterId;
        this.downloadBtn = document.querySelector(".download-comic");
        if (!this.downloadBtn) return;
        this.menuDom = this.downloadBtn.querySelector(".download-menu");
        this.menuItemDoms = [
            ...this.menuDom.querySelectorAll(".download-menu-item"),
        ];
        this.addEvents();
    }
    addEvents() {
        this.downloadBtn.addEventListener("click", (e) => {
            // 点在菜单项上时不要顺手把菜单收起来，让菜单项自己去处理
            if (e.target.closest(".download-menu-item")) return;
            this.toggle();
        });
        this.menuItemDoms.forEach((itemDom) => {
            itemDom.addEventListener("click", () => {
                this.download(itemDom.dataset.mode);
            });
        });
        // 点到页面别的位置就把菜单收起来
        document.addEventListener("click", (e) => {
            if (!this.downloadBtn.contains(e.target)) this.close();
        });
    }
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.openMenu();
        }
    }
    openMenu() {
        this.isOpen = true;
        this.downloadBtn.classList.add("open");
    }
    close() {
        this.isOpen = false;
        this.downloadBtn.classList.remove("open");
    }
    download(mode) {
        if (!DOWNLOAD_MODES.includes(mode)) return;
        if (typeof this.chapterId !== "string" || isNaN(+this.chapterId)) return;
        location.href = `./download.html?id=${encodeURIComponent(this.chapterId)}&mode=${mode}`;
    }
}
