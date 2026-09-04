export class ComicMobileProgress {
    progressCrDom;
    progressDom;
    progressInnerDom;
    maxIndex;
    comicImageCr;
    progressCvs;
    cvsCtx;
    constructor() {
        this.progressCrDom = document.querySelector(".m-progress-cr");
        this.progressDom = this.progressCrDom.querySelector(".m-progress");
        this.progressInnerDom =
            this.progressCrDom.querySelector(".m-progress-inner");
        this.comicImageCr = document.querySelector(".comic-img-cr");
        this.progressCvs = this.progressCrDom.querySelector(".progress-cvs");
        this.cvsCtx = this.progressCvs.getContext("2d");
        this.cvsCtx.fillStyle="#ff84a9"
    }
    init(maxIndex) {
        this.maxIndex = maxIndex;
        this.addTouchingEvent();
    }
    addTouchingEvent() {
        let index = 0;
        let progressTop;
        this.progressDom.addEventListener("touchstart", (e) => {
            progressTop = this.progressDom.getBoundingClientRect().y;
            let y = e.touches[0].clientY - progressTop;
            index = Math.floor(
                (y / this.progressDom.offsetHeight) * this.maxIndex,
            );

            this.setProgress(index);
        });
        this.progressDom.addEventListener("touchmove", (e) => {
            e.preventDefault();
            let y = e.touches[0].clientY - progressTop;
            index = Math.floor(
                (y / this.progressDom.offsetHeight) * this.maxIndex,
            );
            if (index < 0) index = 0;
            if (index > this.maxIndex) index = this.maxIndex;
            this.setProgress(index);
        });
        this.progressDom.addEventListener("touchend", (e) => {
            this.jumpTo(index);
        });
    }
    drawCvs(index) {
        this.cvsCtx.fillRect(
            0,
            Math.ceil((index / (this.maxIndex+1)) * this.progressCvs.height),
            this.progressCvs.width,
            Math.ceil(this.progressCvs.height / (this.maxIndex+1)),
        );
    }
    setProgress(index) {
        this.progressInnerDom.style.top =
            index * (this.progressDom.offsetHeight / this.maxIndex) -
            this.progressInnerDom.offsetHeight / 2 +
            "px";
        this.progressInnerDom.children[0].textContent = `${index + 1}->`;
    }
    jumpTo(index) {
        this.comicImageCr.children[index].scrollIntoView();
    }
}
