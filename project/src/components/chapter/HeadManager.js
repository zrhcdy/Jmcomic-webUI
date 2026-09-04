import { jmApi } from "../../api/JmcomicApi.js";
import { Evaluation } from "./Evaluation.js";

export class HeadManager {
    album;
    headDom;
    evaluation;
    favoriteListIndex = false;
    favoriteList;
    constructor() {}
    init(album) {
        this.album = album;
        this.headDom = document.querySelector(".head");
        this.#setAlbum();
        this.evaluation = new Evaluation();
        this.evaluation.init(this.album);
        this.favoriteList = this.getFavoriteList();
        this.favoriteListIndex = this.favoriteList.findIndex(
            (f) => f.id == album.id,
        );
        if (this.favoriteListIndex > -1) {
            this.headDom.querySelector(".add-favorite").textContent = "已收藏";
        }
        this.addEvents();
    }
    getFavoriteList() {
        let f = localStorage.getItem("favorite");
        if (!f) {
            f = [];
        } else {
            f = JSON.parse(f);
        }

        return f;
    }
    #setAlbum() {
        const cover = this.headDom.querySelector(".cover");
        cover.children[0].src = jmApi.getCoverImageURL(this.album.id);

        const title = this.headDom.querySelector(".title");
        title.textContent = this.album.name;

        const author = this.headDom.querySelector(".author");
        author.textContent = this.album.author.join(" & ");

        const tagsDom = this.headDom.querySelector(".tags");

        tagsDom.innerHTML = this.album.tags
            .map(
                (tagName) => `
            <a href="./search.html?sq=${tagName}" target="_blank" class="tag">${tagName}</a>
        `,
            )
            .join("");

        const latest = this.headDom.querySelector(".latest");
        latest.textContent = "";

        const introduction = this.headDom.querySelector(".introduction");
        introduction.textContent = this.album.description;

        const mobDetInfoDom = document.querySelector(".mob-det-info");
        const mobTagsDom = mobDetInfoDom.querySelector(".tags");
        mobTagsDom.innerHTML = this.album.tags
            .map(
                (tagName) => `
            <div class="tag">${tagName}</div>
        `,
            )
            .join("");
        const mobIntroduction = mobDetInfoDom.querySelector(".introduction");
        mobIntroduction.textContent = this.album.description;
    }
    addEvents() {
        const readBtn = this.headDom.querySelector(".start-read");
        readBtn.addEventListener("click", () => {
            document.querySelector(".comic-content-cr").scrollIntoView({
                behavior: "smooth",
            });
        });

        const favoriteBtn = this.headDom.querySelector(".add-favorite");
        favoriteBtn.addEventListener("click", () => {
            if (this.favoriteListIndex > -1) {
                favoriteBtn.textContent = "收藏";
                this.favoriteList.splice(this.favoriteListIndex, 1);
                this.favoriteListIndex = -1;
            } else {
                favoriteBtn.textContent = "已收藏";
                let fi = this.favoriteList.findIndex(
                    (h) => +h.id == +this.album.id,
                );
                if (fi > -1) {
                    this.favoriteList.splice(fi, 1);
                }
                this.favoriteList.unshift({
                    id: this.album.id,
                    addTime: new Date().toLocaleDateString(),
                    name: this.album.name,
                    author: this.album.author,
                });
                this.favoriteListIndex = 0;
            }
            localStorage.setItem("favorite", JSON.stringify(this.favoriteList));
        });
    }
}
