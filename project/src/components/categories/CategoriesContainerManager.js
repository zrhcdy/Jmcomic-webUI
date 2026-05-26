import { jmApi } from "../../api/JmcomicApi.js"
import { lazyLoader } from "../../dom/LazyLoader.js"
import { InfinityScrollContainer } from "../general/InfinityScrollContainer.js"

export class CategoriesContainerManager{
    containerDom
    scrollContainer
    slug
    searchMode="mv"
    SEARCHMODE = {
        mostViews: "mv",
        mostLikes:"tf",
        day:"mv_t",
        addTime: "",
    };
    searchModeDom
    constructor(){
        this.containerDom=document.querySelector(".categories-body")
        this.searchModeDom=document.querySelector(".sort")
        this.scrollContainer=new InfinityScrollContainer({
            container:this.containerDom,
            threshold:100,
            coolingTime:500,
            loadContent:(page)=>this.loadContent(page)
        })
    }
    setArgs(slug,order){
        this.slug=slug
        this.searchMode=this.SEARCHMODE[order]
    }
    debounce(func,wait,context){
        let timeout
        return function(...args){
            clearTimeout(timeout)
            timeout=setTimeout(()=>func.apply(context,...args),wait)
        }
    }
    _research(){
        this.containerDom.innerHTML=''
        this.scrollContainer.pageIndex=0
        this.loadContent(0)
    }
    research=this.debounce(this._research,500,this)
    init(){
        this.scrollContainer.init()
        this.#addEvent()
    }
    async loadContent(page){
        if(!this.slug)return
        let list=await jmApi.getCategoriesFilter(this.slug,page,this.searchMode)
        this.scrollContainer.maxPageIndex=Math.ceil(list.total/80)
        
        let crDom=this.#getComicsCr(list.content)
        this.containerDom.appendChild(crDom)
        const covers=crDom.querySelectorAll(".cover")
        for(let cover of covers){
            lazyLoader.addCover(cover)
        }
        // if(this.scrollContainer.maxPageIndex)
    }
    #addEvent(){
        let items=this.searchModeDom.children
        for(let i=0;i<items.length;i++){
            items[i].addEventListener("click",()=>{
                items[i].style.display=null
                let item=items[(i+1)%items.length]
                this.searchMode=item.dataset.mode
                item.style.display="block"
                this.research()
            })
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