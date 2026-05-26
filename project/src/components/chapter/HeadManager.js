import { jmApi } from "../../api/JmcomicApi.js"
import { Evaluation } from "./Evaluation.js"

export class HeadManager{
    album
    headDom
    evaluation
    constructor(){

    }
    init(album){
        this.album=album
        this.headDom=document.querySelector(".head")
        this.#setAlbum()
        this.evaluation=new Evaluation()
        this.evaluation.init(this.album)
        this.addEvents()
    }
    #setAlbum(){
        const cover=this.headDom.querySelector(".cover")
        cover.children[0].src=jmApi.getCoverImageURL(this.album.id)

        const title=this.headDom.querySelector(".title")
        title.textContent=this.album.name

        const author=this.headDom.querySelector(".author")
        author.textContent=this.album.author.join(" & ")

        const tagsDom=this.headDom.querySelector(".tags")
        
        tagsDom.innerHTML=this.album.tags.map((tagName)=>`
            <div class="tag">${tagName}</div>
        `).join("")

        const latest=this.headDom.querySelector(".latest")
        latest.textContent=""

        const introduction=this.headDom.querySelector(".introduction")
        introduction.textContent=this.album.description

        const mobDetInfoDom=document.querySelector(".mob-det-info")
        const mobTagsDom=mobDetInfoDom.querySelector(".tags")
        mobTagsDom.innerHTML=this.album.tags.map((tagName)=>`
            <div class="tag">${tagName}</div>
        `).join("")
        const mobIntroduction=mobDetInfoDom.querySelector(".introduction")
        mobIntroduction.textContent=this.album.description
    }
    addEvents(){
        const readBtn=this.headDom.querySelector(".start-read")
        readBtn.addEventListener("click",()=>{
            document.querySelector(".comic-content-cr").scrollIntoView({
                behavior:"smooth"
            })
        })
    }
}