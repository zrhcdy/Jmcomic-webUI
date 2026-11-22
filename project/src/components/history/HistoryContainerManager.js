import { jmApi } from "../../api/JmcomicApi.js";
import { comicDom } from "../../dom/ComicDom.js";
import { lazyLoader } from "../../dom/LazyLoader.js";
import { cacheManager } from "../general/CacheManager.js";

export class HistoryContainerManager {
    containerDom;
    constructor() {
        this.containerDom = document.querySelector(".history-cr");
    }
    init() {
        this.loadContent();
        this.#addEvent();
    }
    loadContent() {
        let list = cacheManager.history;
        if (!list || list.length === 0) {
            alert("没有历史记录");
            return;
        }
        try {
            let crDom = this.#getComicsCr(list);
            this.containerDom.appendChild(crDom);
            const covers = crDom.querySelectorAll(".cover");
            for (let cover of covers) {
                lazyLoader.addCover(cover);
            }
        } catch (err) {
            console.error("解析历史记录失败", err);
            throw new Error("解析历史记录失败");
        }
    }
    #getComicsCr(list) {
        const cr = document.createElement("div");
        cr.className = "comics-cr";
        cr.innerHTML = this.#getComicsHTML(list);
        return cr;
    }
    #getComicsHTML(list) {
        return list.map((c)=>comicDom.createComicItemHTML(c)).join("")
    }
    #addEvent(){
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
