import { jmApi } from "../../api/JmcomicApi.js";
import { comicDom } from "../../dom/ComicDom.js";
import { lazyLoader } from "../../dom/LazyLoader.js";
import { InfinityScrollContainer } from "../general/InfinityScrollContainer.js";

export class CategoriesContainerManager {
    containerDom;
    scrollContainer;
    slug;
    searchMode = "mv";
    SEARCHMODE = {
        mostViews: "mv",
        mostLikes: "tf",
        day: "mv_t",
        addTime: "",
    };
    searchModeDom;
    loadingIconDom;
    abortController = null;
    constructor() {
        this.containerDom = document.querySelector(".categories-body");
        this.searchModeDom = document.querySelector(".sort");
        this.scrollContainer = new InfinityScrollContainer({
            container: this.containerDom,
            threshold: 300,
            coolingTime: 500,
            loadContent: (page) => this.loadContent(page),
            onPageEnd: (page) => this.onPageEnd(page),
        });
        this.loadingIconDom = document.querySelector(".loading-icon");
    }
    setArgs(slug, order) {
        this.slug = slug;
        this.searchMode = this.SEARCHMODE[order];
    }
    debounce(func, wait, context) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }
    _research() {
        lazyLoader.clear();
        this.scrollContainer.reset();
    }
    research = this.debounce(this._research, 500, this);
    init() {
        this.scrollContainer.init();
        this.#addEvent();
    }
    async loadContent(page) {
        if (!this.slug) return;
        this.loadingIconDom.style.display = "block";
        this.abortController?.abort();
        this.abortController = new AbortController();
        let list = await jmApi.getCategoriesFilter(
            this.slug,
            page,
            this.searchMode,
            this.abortController.signal,
        );

        this.scrollContainer.maxPageIndex = Math.ceil(list.total / 80);

        const childCount = this.containerDom.children.length;
        this.containerDom.insertAdjacentHTML(
            "beforeend",
            this.#getComicsHTML(list.content),
        );
        for (let i = childCount; i < this.containerDom.children.length; i++) {
            lazyLoader.addCover(this.containerDom.children[i].querySelector(".cover"));
        }
    }
    #addEvent() {
        let items = this.searchModeDom.children;
        for (let i = 0; i < items.length; i++) {
            items[i].addEventListener("click", () => {
                items[i].style.display = null;
                let item = items[(i + 1) % items.length];
                this.searchMode = item.dataset.mode;
                item.style.display = "block";
                this.research();
            });
        }
        this.containerDom?.addEventListener("click", (e) => {
            let aDom = e.target.parentNode || e.target;
            if (aDom.tagName === "A") {
                e.preventDefault();
                localStorage.setItem("lastClickComic", aDom.dataset.comic);
                location.href = aDom.href;
            }
        });
    }
    #getComicsHTML(list) {
        return list
            .map(
                (c) => comicDom.createComicItemHTML(c)
            )
            .join("");
    }
    onPageEnd(page) {
        this.loadingIconDom.style.display = "none";
    }
}