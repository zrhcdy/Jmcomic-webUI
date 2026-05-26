import { jmApi } from "../../api/JmcomicApi.js";

export class RecommendationsComicManager {
    album;
    recommendedComicsDom;
    recommendedComicsCrDom;
    constructor() {
        this.recommendedComicsDom = document.querySelector(
            ".recommended-comics",
        );
        this.recommendedComicsCrDom =
            this.recommendedComicsDom.querySelector(".rc-cr");
    }
    init(album) {
        this.album = album;
        this.recommendedComicsCrDom.innerHTML = this.album.related_list
            .map((data) => this.#getRCItemHTML(data))
            .join("");
        this.#addClickEvent();
    }
    #getRCItemHTML(data) {
        return `
        <div class="rc-item" data-cid="${data.id}">
            <div class="item-cover">
                <img src="${jmApi.getCoverImageURL(data.id)}" alt="1" />
            </div>
            <div class="item-info">
                <h1 class="item-title">${data.name}</h1>
                <h2 class="item-aname">${data.author}</h2>
            </div>
        </div>
        `;
    }
    #addClickEvent() {
        for (let i = 0; i < this.recommendedComicsCrDom.children.length; i++) {
            let ele = this.recommendedComicsCrDom.children[i];
            ele.addEventListener("click", () => {
                open("/chapter.html?id=" + ele.dataset.cid);
            });
        }
    }
}
