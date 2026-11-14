import { jmApi } from "../../api/JmcomicApi.js";
import { comicDom } from "../../dom/ComicDom.js";
import { errorDom } from "../../dom/ErrorDom.js";
import { lazyLoader } from "../../dom/LazyLoader.js";
import { InfinityScrollContainer } from "../general/InfinityScrollContainer.js";

export class LatestContainerManager {
    containerDom;
    scrollContainer;
    loadingIconDom;
    constructor() {
        this.containerDom = document.querySelector(".latest-cr");
        this.loadingIconDom = document.querySelector(".loading-icon");
        this.scrollContainer = new InfinityScrollContainer({
            container: this.containerDom,
            threshold: 300,
            coolingTime: 500,
            loadContent: (page) => this.loadContent(page),
            onPageEnd: (page) => this.onPageEnd(page),
        });
    }
    init() {
        this.scrollContainer.init();
        this.#addEvent();
    }
    async loadContent(page) {
        this.loadingIconDom.style.display = "block";
        let list = await jmApi.getLatestContent(page).catch((err) => {
            document
                .querySelector(".root")
                .insertAdjacentHTML(
                    "beforeend",
                    errorDom.createErrorDom("加载失败，"),
                );
            throw err;
        });
        
        // 接口不返回 total，只能靠「返回空数组」判断是否翻到最后一页
        if (list.length === 0) {
            this.scrollContainer.maxPageIndex = Math.max(page - 1, 1);
            return;
        }

        const childCount = this.containerDom.children.length;

        this.containerDom.insertAdjacentHTML(
            "beforeend",
            this.#getComicsHTML(list),
        );
        for (let i = childCount; i < this.containerDom.children.length; i++) {
            lazyLoader.addCover(this.containerDom.children[i].querySelector(".cover"));
        }
    }
    onPageEnd(page) {
        this.loadingIconDom.style.display = "none";
    }
    #getComicsHTML(list) {
        return list.map((c) => comicDom.createComicItemHTML(c)).join("");
    }
    #addEvent() {
        this.containerDom?.addEventListener("click", (e) => {
            let aDom = e.target.parentNode || e.target;
            if (aDom.tagName === "A") {
                e.preventDefault();
                localStorage.setItem("lastClickComic", aDom.dataset.comic);
                location.href = aDom.href;
            }
        });
    }
}