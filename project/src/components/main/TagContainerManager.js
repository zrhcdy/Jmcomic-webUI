export class TagContainerManager{
    tagContainerDom
    items
    constructor(){
        this.tagContainerDom=document.querySelector('.tag-cr')
        this.items=this.tagContainerDom.children
    }
    init(){
        this.#addEvent()
    }
    #addEvent(){
        window.addEventListener("resize",()=>{
            this.#onResize()
        })
        this.#onResize()
    }
    #onResize(){
        let width=90
        if(this.tagContainerDom.offsetWidth<500){
            width=75
        }
        let count=Math.floor(this.tagContainerDom.offsetWidth/width)
        if(count>this.items.length){
            count=this.items.length
        }
        for(let i=0;i<this.items.length;i++){
            if(i>this.items.length-count-1){
                this.items[i].style.display='block'
            }else{
                this.items[i].style.display='none'
            }
        }
    }
}