import { jmApi } from "../../api/JmcomicApi.js"
import { InfinityScrollContainer } from "../general/InfinityScrollContainer.js"

export class CommentManager{
    commentDom
    commentTitleDom
    commentInnerDom
    commentLockDom
    scrollContainer
    constructor(){
        this.commentDom=document.querySelector(".comment")
        this.commentTitleDom=this.commentDom.querySelector("h1")
        this.commentInnerDom=this.commentDom.querySelector(".comment-inner")
        this.commentLockDom=this.commentDom.querySelector(".comment-lock")

        this.scrollContainer=new InfinityScrollContainer({
            container:this.commentInnerDom,
            threshold:100,
            loadContent:(p)=>this.loadNewComments(p),
            coolingTime:500,
            isGlobalContainer:false
        })
        
    }
    init(album){
        this.album=album
        this.scrollContainer.init()
        this.scrollContainer.maxPageIndex = Math.ceil(album.comment_total / 10)
        this.commentTitleDom.textContent=`评论(${album.comment_total}):`
        // this.loadNewComments()

        this.commentLockDom.addEventListener("click",()=>{
            this.commentInnerDom.parentNode.classList.toggle("show-more")
        })
    }
    async loadNewComments(p){
        const data=await jmApi.getComicComments(this.album.id,p)
        console.log(data);
        
        this.commentInnerDom.innerHTML+=data.map(c=>this.#getCommentItemHTML(c)).join("")
    }
    #getCommentItemHTML(data){
        return `
        <div class="comment-item">
            <div class="user-head">
                <img src="${jmApi.getUserPhotoURL(data.photo)}" alt="head">
            </div>
            <div class="user-info">
                <h2>${data.username}</h2>
                <p class="comment-text">
                    ${data.content}
                </p>
            </div>
        </div>
        `
    }
}