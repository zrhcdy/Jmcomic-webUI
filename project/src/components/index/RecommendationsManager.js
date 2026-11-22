import { jmApi } from "../../api/JmcomicApi.js";
import { comicDom } from "../../dom/ComicDom.js";
import { lazyLoader } from "../../dom/LazyLoader.js";
import { SectionCarousel } from "./SectionCarousel.js";
export class RecommendationsManager {
    recommendationsDom;
    secComics;
    root = document.querySelector(".root");
    sectionObserver;
    secNavDom;
    constructor() {}
    async init() {
        let promotionData = await jmApi.getPromotionContent();
        if (promotionData.length == 0) {
            throw new Error("暂无数据");
        }
        //忽略小说和禁漫书库板块
        promotionData = promotionData.slice(0, promotionData.length - 2);

        this.#createSectionNav(promotionData);

        this.recommendationsDom = this.#getRecommendationsDom();
        this.root.appendChild(this.recommendationsDom);
        this.#createSections(promotionData);

        this.#addEvent();
    }
    #createSections(data) {
        //每帧创建一个板块
        const _create = (index) => {
            let container = this.#getSectionDom(data[index]);
            this.recommendationsDom.appendChild(container);

            let secComic = container.querySelector(".sec-comics");
            new SectionCarousel().init(secComic);
            let covers = secComic.querySelectorAll(".cover");

            for (let i = 0; i < covers.length; i++) {
                lazyLoader.addCover(covers[i]);
            }
            if (index >= data.length - 1) return;
            requestAnimationFrame(() => _create(index + 1));
        };
        _create(0);
    }
    #getRecommendationsDom() {
        let recommendationsDom = document.createElement("div");
        recommendationsDom.className = "recommendations";
        return recommendationsDom;
    }
    #getSectionDom(sectionData) {
        let sectionDom = document.createElement("div");
        sectionDom.className = "section";
        sectionDom.id = sectionData.title;
        sectionDom.innerHTML = `
                <div class="s-title">
                    <span>
                        <p>${sectionData.title.length > 10 ? sectionData.title.substring(0, 4) : sectionData.title}</p>
                    </span>
                </div>
                <div class="sec-comics">
                    <div class="sc-inner">
                        ${this.#getSecComicsHTML(sectionData.content)}
                    </div>
                </div>
                <div class="controls">
                    <div class="l-btn">&lAarr;</div>
                    <div class="r-btn">&rAarr;</div>
                </div>
                <div class="show-list-btn" title="以列表的形式显示">Show List...</div>
            `;
        return sectionDom;
    }
    #getSecComicsHTML(list) {
        return list.map((c) => comicDom.createComicItemHTML(c)).join("");
    }
    #createSectionNav(data) {
        const secNavDom = document.createElement("div");
        secNavDom.className = "section-nav";
        secNavDom.innerHTML = `
                <div class="sec-nav-inner">
                    ${data.map((item) => `<div class="sec-nav-item" data-to="${item.title}">${item.title.substring(0, 4)}</div>`).join("")}
                </div>
        `;

        secNavDom.addEventListener("click", (e) => {
            if (e.target.className === "sec-nav-item") {
                let to = e.target.dataset.to;
                for (const child of this.recommendationsDom.children) {
                    if (child.id === to) {
                        child.scrollIntoView({
                            behavior: "smooth",
                            block: "end",
                        });
                        return;
                    }
                }
            }
        });
        this.root.appendChild(secNavDom);
        this.secNavDom = secNavDom;
    }

    #addEvent() {
        this.recommendationsDom?.addEventListener("click", (e) => {
            let aDom = e.target.parentNode || e.target;
            if (aDom.tagName === "A") {
                e.preventDefault();
                localStorage.setItem("lastClickComic", aDom.dataset.comic);
                location.href = aDom.href;
            }
        });
        window.addEventListener("scroll", () => {
            if(innerWidth <= 1400) return
            let scrollTop = window.scrollY;
            for (let i = this.recommendationsDom.children.length-1;i>=0;i--) {
                const diffTop = scrollTop + innerHeight - this.recommendationsDom.children[i].offsetTop;
                if(diffTop > 0){
                    this.secNavDom.querySelector(".active")?.classList.remove("active");
                    this.secNavDom.querySelector(`[data-to="${this.recommendationsDom.children[i].id}"]`)?.classList.add("active");
                    return
                }
            }
        });
    }
}
