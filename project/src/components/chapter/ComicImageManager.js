import { jmApi } from "../../api/JmcomicApi.js";
import { ComicImageLoader } from "./ComicImageLoader.js";
import { ComicReadingProgress } from "./ComicReadingProgress.js";

export class ComicImageManager {
    chapter;
    containerHead;
    imagesContainer;
    loader;
    constructor() {
        const comicContentCr = document.querySelector(".comic-content-cr");
        const head = comicContentCr.querySelector(".cr-head");
        this.containerHead = head;
        const imgcr = comicContentCr.querySelector(".comic-img-cr");
        this.imagesContainer = imgcr;
    }
    init(chapter) {
        this.chapter = chapter;
        this.loader = new ComicImageLoader(chapter.id);
        this.progress = new ComicReadingProgress();
        this.progress.init(this.chapter.images.length-1);
        this.imagesContainer.innerHTML = this.#getImageContainerHTML(
            this.chapter.images,
        );
        this.containerHead.textContent=`图集（0/${chapter.images.length}）`
        for (let i = 0; i < this.imagesContainer.children.length; i++) {
            this.loader.addImgCr(this.imagesContainer.children[i]);
        }
        this.loader.onIndexUpdate = (index) => {
            this.progress.setProgress(index);
        };
        this.loader.onLoadedImage=(count)=>{
            this.containerHead.textContent=`图集（${count}/${chapter.images.length}）`
        }
    }
    #getImageContainerHTML(imagesList) {
        return imagesList
            .map((imagePathName, i) => {
                return `
                <div class="comic-img" data-path="${imagePathName}" data-index="${i}" style="height:500px;">
                    <span>${imagePathName}</span>
                    <img alt="${i}"/>
                </div>
            `;
            })
            .join("");
    }
}
