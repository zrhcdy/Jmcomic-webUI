import { jmApi } from "../../api/JmcomicApi.js";
import { lazyLoader } from "../../dom/LazyLoader.js";
import { InfinityScrollContainer } from "../general/InfinityScrollContainer.js";

export class SearchContainerManager {
    containerDom;
    scrollContainer;
    searchQuery;
    searchMode = "mv";
    SEARCHMODE = {
        mostViews: "mv",
        mostLikes:"tf",
        day:"mv_t",
        addTime: "",
    };
    /*
    categoryOrderList: [
        { title: '最新', value: '' },
        { title: '最多爱心', value: 'tf' },
        { title: '总排行', value: 'mv' },
        { title: '月排行', value: 'mv_m' },
        { title: '周排行', value: 'mv_w' },
        { title: '日排行', value: 'mv_t' },
      ]
     */
    searchModeDom;
    constructor(sq) {
        this.searchQuery = sq;
        this.containerDom = document.querySelector(".search-cr");
        this.searchModeDom = document.querySelector(".sort");
        this.scrollContainer = new InfinityScrollContainer({
            container: this.containerDom,
            threshold: 100,
            coolingTime: 500,
            loadContent: (page) => this.loadContent(page),
        });
    }
    debounce(func, wait, context) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, ...args), wait);
        };
    }
    _research() {
        this.containerDom.innerHTML = "";
        this.scrollContainer.pageIndex = 1;
        this.loadContent(1);
    }
    research = this.debounce(this._research, 500, this);
    init() {
        this.scrollContainer.init();
        this.#addEvent();
    }
    async loadContent(page) {
        if (
            page === 1 &&
            Number.isInteger(+this.searchQuery) &&
            +this.searchQuery > 10
        ) {
            let album = await jmApi.getComicAlbum(this.searchQuery);
            if (album.name) {
                let crDom = this.#getComicsCr([album]);
                this.containerDom.appendChild(crDom);
                lazyLoader.addCover(crDom.querySelector(".cover"));
            }else{
                console.error("warning:the id is not defined")
            }
        }
        let list = await jmApi.getSearchResults(
            this.searchQuery,
            page,
            this.searchMode,
        );
        
        this.scrollContainer.maxPageIndex = Math.ceil(list.total / 80);

        let crDom = this.#getComicsCr(list.content);
        this.containerDom.appendChild(crDom);
        const covers = crDom.querySelectorAll(".cover");
        for (let cover of covers) {
            lazyLoader.addCover(cover);
        }
        // if(this.scrollContainer.maxPageIndex)
    }
    #addEvent() {
        let items = this.searchModeDom.children;
        for (let i = 0; i < items.length; i++) {
            items[i].addEventListener("click", () => {
                items[i].style.display = null;
                let item = items[(i + 1) % items.length];
                this.searchMode = this.SEARCHMODE[item.dataset.mode];
                item.style.display = "block";
                this.research();
            });
        }
    }
    #getComicsCr(list) {
        const cr = document.createElement("div");
        cr.className = "comics-cr";
        cr.innerHTML = this.#getComicsHTML(list);
        return cr;
    }
    #getComicsHTML(list) {
        return list
            .map(
                (c) => `
            <div class="comic-item">
                <a class="cover" data-src="${jmApi.getCoverImageURL(c.id)}" href="./chapter.html?id=${c.id}" target="_blank">
                    <img alt="封面"/>
                    <div class="tags"></div>
                </a>
                <h1 class="c-title">${c.name}</h1>
                <h2 class="c-sr-title">${c.author}</h2>
            </div>
        `,
            )
            .join("");
    }
}
