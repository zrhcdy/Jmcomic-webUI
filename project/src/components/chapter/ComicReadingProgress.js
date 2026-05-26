export class ComicReadingProgress {
    progressCrDom;
    progressDom;
    progressInnerDom;
    jmnianHotImage;
    maxIndex;
    comicImageCr
    constructor() {
        this.progressCrDom = document.querySelector(".progress-cr");
        this.progressDom = this.progressCrDom.querySelector(".progress");
        this.progressInnerDom =
            this.progressCrDom.querySelector(".progress-inner");
        this.jmnianHotImage = this.progressCrDom.querySelector(".jmnian-hot");
        this.comicImageCr=document.querySelector(".comic-img-cr")
    }
    init(maxIndex) {
        this.maxIndex = maxIndex;
        this.addMouseEvent();
    }
    addMouseEvent() {
        let isMouseDown = false;
        let index=0
        this.progressDom.addEventListener("mousedown", (e) => {
            isMouseDown = true;
            index = Math.floor(
                (e.layerY / this.progressDom.offsetHeight) * this.maxIndex,
            );

            this.setProgress(index);
        });
        window.addEventListener("mousemove", (e) => {
            if(!isMouseDown)return
            let y=e.pageY-this.progressCrDom.offsetTop
            index=Math.floor(
                (y / this.progressDom.offsetHeight) * this.maxIndex,
            );
            if(index<0)index=0
            if(index>this.maxIndex)index=this.maxIndex
            this.setProgress(index)
        });
        window.addEventListener("mouseup", (e) => {
            if(!isMouseDown)return
            this.jumpTo(index)
            isMouseDown=false
        });
    }
    setProgress(index) {
        this.progressInnerDom.style.height =
            index * (this.progressDom.offsetHeight / this.maxIndex) + "px";
        this.progressInnerDom.children[0].textContent = `←${index + 1}`;
        let opacity=index/this.maxIndex
        this.jmnianHotImage.style.opacity=opacity
    }
    jumpTo(index) {
        this.comicImageCr.children[index].scrollIntoView()
    }
}
