import { jmApi } from "../../api/JmcomicApi.js"

export class CommentManager{
    commentDom
    commentTitleDom
    commentInnerDom
    constructor(){
        this.commentDom=document.querySelector(".comment")
        this.commentTitleDom=this.commentDom.querySelector("h1")
        this.commentInnerDom=this.commentDom.querySelector(".comment-inner")
    }
    init(album){
        this.album=album
        this.commentTitleDom.textContent=`评论(${album.comment_total}):`
        this.loadNewComments()
    }
    async loadNewComments(){
        const data=await jmApi.getComicComments(this.album.id,0)
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