import { jmApi } from "../../api/JmcomicApi.js";
// import { domManager } from "../../dom/DomManager.js";
import { lazyLoader } from "../../dom/LazyLoader.js";
import { SectionCarousel } from "./SectionCarousel.js";
export class RecommendationsManager {
    recommendationsDom;
    secComics;
    constructor() {}
    async init() {
        const promotionData = await jmApi.getPromotionContent();
        console.log(promotionData);
        
        this.recommendationsDom = this.#getRecommendationsDom(promotionData);
        document.querySelector(".root").appendChild(this.recommendationsDom);
        this.secComics =
            this.recommendationsDom.querySelectorAll(".sec-comics");
        this.secComics.forEach((container) => {
            new SectionCarousel().init(container);
            let covers=container.querySelectorAll(".cover")
            for(let i=0;i<covers.length;i++){
                lazyLoader.addCover(covers[i])
            }
        });
    }
    #getRecommendationsDom(data) {
        let recommendationsDom = document.createElement("div");
        recommendationsDom.className="recommendations"
        let innerHTML = "";
        for (let sectionData of data) {
            let section = `
                <div class="section">
                    <div class="s-title">
                        <span>${sectionData.title.length>10?sectionData.title.substring(0,4):sectionData.title}</span>
                        <h2 class="s-sr-title">${sectionData.slug}</h2>
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
                </div>
            `;
            innerHTML+=section
        }
        recommendationsDom.innerHTML=innerHTML
        return recommendationsDom;
    }
    #getSecComicsHTML(data) {
        return data.map(
            (c) => `
            <div class="comic-item">
                <a class="cover" data-src="${jmApi.getCoverImageURL(c.id)}" href="./chapter.html?id=${c.id}">
                    <img alt="封面"/>
                    <div class="tags"></div>
                </a>
                <h1 class="c-title">${c.name}</h1>
                <h2 class="c-sr-title">${c.author}</h2>
            </div>
        `,
        ).join("");
    }
}
