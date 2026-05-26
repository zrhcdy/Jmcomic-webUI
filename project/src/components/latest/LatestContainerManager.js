import { jmApi } from "../../api/JmcomicApi.js"
import { lazyLoader } from "../../dom/LazyLoader.js"
import { InfinityScrollContainer } from "../general/InfinityScrollContainer.js"

export class LatestContainerManager{
    containerDom
    scrollContainer
    constructor(){
        this.containerDom=document.querySelector(".latest-cr")
        this.scrollContainer=new InfinityScrollContainer({
            container:this.containerDom,
            threshold:100,
            coolingTime:500,
            loadContent:(page)=>this.loadContent(page)
        })
    }
    init(){
        this.scrollContainer.init()
        
    }
    async loadContent(page){
        let list=await jmApi.getLatestContent(page)
        let crDom=this.#getComicsCr(list)
        this.containerDom.appendChild(crDom)
        const covers=crDom.querySelectorAll(".cover")
        for(let cover of covers){
            lazyLoader.addCover(cover)
        }
    }
    #getComicsCr(list){
        const cr=document.createElement("div")
        cr.className="comics-cr"
        cr.innerHTML=this.#getComicsHTML(list)
        return cr
    }
    #getComicsHTML(list){
        return list.map((c)=>`
            <div class="comic-item">
                <a class="cover" data-src="${jmApi.getCoverImageURL(c.id)}" href="/chapter.html?id=${c.id}" target="_blank">
                    <img alt="封面"/>
                    <div class="tags"></div>
                </a>
                <h1 class="c-title">${c.name}</h1>
                <h2 class="c-sr-title">${c.author}</h2>
            </div>
        `).join("")
    }
}