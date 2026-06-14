import { Carousel } from "../general/Carousel.js";

export class SectionCarousel extends Carousel {
    secComicWidth;
    secComicGap;
    displayedCount;
    constructor() {
        super();
    }
    init(secComic) {
        console.log(secComic.parentNode);
        
        super.init(
            secComic,
            secComic.parentNode.querySelector(".l-btn"),
            secComic.parentNode.querySelector(".r-btn"),
        );
        this.addControlsEvent();
        this.#onResize()
        window.addEventListener("resize", ()=>this.#onResize());
    }
    getItemWidth() {
        return this.secComicWidth;
    }
    setTransform(){
        if(this.index<0)this.index=0;
        else if(this.index>this.maxIndex)this.index=this.maxIndex
        this.containerInner.style.transform=`translateX(-${this.index*(this.getItemWidth()+this.secComicGap)}px)`
    }
    setTouchingTranslate(deltaX){
        if(this.index<0)this.index=0;
        else if(this.index>this.maxIndex)this.index=this.maxIndex
        this.containerInner.style.transform=`translateX(${this.index*(this.getItemWidth()+this.secComicGap)*-1+deltaX}px)`
    }
    #onResize() {
        let parentNode = this.container.parentNode;
        let iWidth=this.containerInner.children[0].offsetWidth
        let count
        let gap=10
        if(parentNode.offsetWidth>520){
            count = Math.floor((parentNode.offsetWidth * 0.85 + 10) / (iWidth+10));
        }else{
            count = 3
            if(parentNode.offsetWidth<450){
                gap=5
            }
            this.container.style.setProperty("--iw",(parentNode.offsetWidth-(gap*2))/count-7+"px")
            // console.log(parentNode.offsetWidth/count+"px");
            
            iWidth=(parentNode.offsetWidth-(gap*2))/count-7
        }
        this.displayedCount = count;
        let width = count * (gap+iWidth) - gap;
        this.secComicWidth = width;
        this.secComicGap = gap;
        if (iWidth>160 && width / parentNode.offsetWidth < 0.7) {
            this.secComicWidth = width + (count - 1) * 10;
            this.secComicGap = 20;
        }
        this.container.style.width = this.secComicWidth + "px";
        this.containerInner.style.gap = this.secComicGap + "px";
        this.maxIndex=Math.ceil(this.containerInner.children.length/this.displayedCount)-1
        
        this.setTransform();
    }
}
