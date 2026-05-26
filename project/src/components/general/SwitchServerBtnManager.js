import { setting } from "./Setting.js"

export class SwitchServerBtnManager{
    switchServerDom
    titleDom
    serverBtnDoms
    activeIndex=0
    constructor(){
        this.switchServerDom=document.querySelector(".switch-server")
        this.titleDom=this.switchServerDom.querySelector("span")
        this.serverBtnDoms=this.switchServerDom.querySelectorAll(".server-name")
    }
    init(){
        this.#addEvent()
        this.setServer(+setting.using_imgserver_index)
    }
    #addEvent(){
        for(let i=0;i<this.serverBtnDoms.length;i++){
            this.serverBtnDoms[i].addEventListener("click",()=>{
                this.setServer(i)
                setting.setOption("using_imgserver_index",i)
            })
        }
    }
    setServer(index){
        this.serverBtnDoms[this.activeIndex].classList.remove("active")
        
        this.serverBtnDoms[index].classList.add("active")
        this.titleDom.textContent=`图源${index+1}`
        this.activeIndex=index

    }
}