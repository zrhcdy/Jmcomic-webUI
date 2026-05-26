export class Carousel{
    index=0;
    maxIndex=0;
    container;
    containerInner;

    controls={
        left:null,right:null
    }

    constructor(){

    }
    init(container,controlLeft=null,controlRight=null){
        this.container=container
        this.controls.left=controlLeft;
        this.controls.right=controlRight;
        this.containerInner=container.children[0]
    }

    setTransform(){
        this.containerInner.style.transform=`translateX(-${this.index*this.getItemWidth()}px)`
    }
    getItemWidth(){
        return this.containerInner.children[0].offsetWidth
    }
    moveLeft(){
        // console.log(this);
        
        if(this.index<=0)return
        this.index--
        this.setTransform()
    }
    moveRight(){
        if(this.index>=this.maxIndex)return
        this.index++
        this.setTransform()
    }
    addControlsEvent(){
        this.controls.left.addEventListener("click",()=>this.moveLeft())
        this.controls.right.addEventListener("click",()=>this.moveRight())
    }
}