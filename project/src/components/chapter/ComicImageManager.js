import { jmApi } from "../../api/JmcomicApi.js";
import { ComicImageLoader } from "./ComicImageLoader.js";
import { ComicMobileProgress } from "./ComicMobileProgress.js";
import { ComicReadingProgress } from "./ComicReadingProgress.js";
import { ComicReader } from "./ComicReader.js";

export class ComicImageManager {
    chapter;
    containerHead;
    imagesContainer;
    loader;
    progress;
    mobProgress;
    reader;
    readerBtn;
    constructor() {
        const comicContentCr = document.querySelector(".comic-content-cr");
        const head = comicContentCr.querySelector(".cr-head");
        this.containerHead = head;
        const imgcr = comicContentCr.querySelector(".comic-img-cr");
        this.imagesContainer = imgcr;
        this.reader = new ComicReader(imgcr);
        this.readerBtn = head.querySelector(".cr-reader-btn");
        this.readerBtn.addEventListener("click", () => {
            this.reader.toggleReaderMode();
        });
        document.addEventListener("auto-enter-reader", () => {
            if (!this.reader.isReaderMode) {
                this.reader.enterReaderMode();
            }
        });
    }
    init(chapter) {
        this.chapter = chapter;
        this.loader = new ComicImageLoader(chapter.id);
        this.progress = new ComicReadingProgress();
        this.progress.init(this.chapter.images.length-1);
        this.mobProgress = new ComicMobileProgress();
        this.mobProgress.init(this.chapter.images.length-1);
        this.imagesContainer.innerHTML = this.#getImageContainerHTML(
            this.chapter.images,
        );
        this.containerHead.querySelector(".cr-head-text").textContent=`图集（0/${chapter.images.length}）`
        for (let i = 0; i < this.imagesContainer.children.length; i++) {
            this.loader.addImgCr(this.imagesContainer.children[i]);
        }
        this.loader.onIndexUpdate = (index) => {
            this.progress.setProgress(index);
            this.mobProgress.setProgress(index);
            this.mobProgress.drawCvs(index);
            this.reader.setProgress(index);
        };
        this.loader.onLoadedImage=(count)=>{
            this.containerHead.querySelector(".cr-head-text").textContent=`图集（${count}/${chapter.images.length}）`
        }
        this.reader.setTotalImages(this.chapter.images.length);
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