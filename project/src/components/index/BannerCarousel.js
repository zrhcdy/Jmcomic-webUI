import { Carousel } from "../general/Carousel.js";

export class BannerCarousel extends Carousel{
    bannerDom
    mobItems
    isMob=false
    constructor(bannerDom){
        super()
        this.bannerDom=bannerDom
        this.maxIndex=2
        this.mobItems=bannerDom.querySelectorAll(".cover")

    }
    init(){
        const controlLeft=this.bannerDom.querySelector(".l-btn")
        const controlRight=this.bannerDom.querySelector(".r-btn")
        super.init(this.bannerDom,controlLeft,controlRight)

        

        this.addControlsEvent()
        this.#onResize()
        window.addEventListener("resize",()=>{
            this.#onResize()
        })
    }
    moveLeft(){
        if(this.index<=0)return
        if(!this.isMob)this.containerInner.children[this.index].classList.remove("active")
        this.index--
        this.setTransform()
        if(!this.isMob)this.containerInner.children[this.index].classList.add("active")
        
    }
    moveRight(){
        if(this.index>=this.maxIndex)return
        if(!this.isMob)this.containerInner.children[this.index].classList.remove("active")
        this.index++
        this.setTransform()
        if(!this.isMob)this.containerInner.children[this.index].classList.add("active")

    }
    setTransform(){
        let itemWidth=this.getItemWidth()
        let transform=`translateX(${-this.index*itemWidth+(this.container.offsetWidth-itemWidth)/2}px)`

        this.containerInner.style.transform=transform
    }
    setTouchingTranslate(deltaX){
        let itemWidth=this.getItemWidth()
        let transform=`translateX(${-this.index*itemWidth+(this.container.offsetWidth-itemWidth)/2+deltaX}px)`

        this.containerInner.style.transform=transform
    }
    getItemWidth(){
        if(!this.isMob){
            return this.containerInner.children[0].offsetWidth
        }else{
            return this.containerInner.children[0].children[0].offsetWidth
        }
    }
    #onResize(){
        if(this.container.offsetWidth<=700){
            if(this.isMob)return this.setTransform()
            this.isMob=true
            this.containerInner.classList.add("mob")
            this.maxIndex=this.mobItems.length-1
        }else{
            if(!this.isMob)return this.setTransform()
            this.isMob=false
            this.containerInner.classList.remove("mob")
            this.maxIndex=this.containerInner.children.length-1
            if(this.index>this.maxIndex)this.index=this.maxIndex
            for(let i=0;i<this.containerInner.children.length;i++){
                this.containerInner.children[i].className="br-item"
            }
            this.containerInner.children[this.index].classList.add("active")
        }
        this.setTransform()
    }
}