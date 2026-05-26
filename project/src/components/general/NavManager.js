export class NavManager{
    mobileNavDom
    navDom
    pageListBtn
    mobNavInner
    searchForm
    searchInput
    constructor(){
        this.navDom=document.querySelector(".nav")
        this.mobileNavDom=document.querySelector(".mob-nav")
        this.pageListBtn=this.navDom.querySelector(".page-list-btn")
        this.mobNavInner=this.mobileNavDom.children[0]
        this.searchForm=this.navDom.querySelector(".search form")
        this.searchInput=this.searchForm.children[0]
    }
    init(){
        this.#addEvent()
    }
    #addEvent(){
        this.pageListBtn.addEventListener("click",()=>{
            this.mobileNavDom.style.display='block'
            this.mobileNavDom.getBoundingClientRect()
            this.mobileNavDom.classList.add("show")
            this.mobileNavDom.ontransitionend=null
        })
        this.mobileNavDom.addEventListener("click",(e)=>{
            if(e.target===this.mobileNavDom){
                this.mobileNavDom.classList.remove("show")
                // this.mobNavInner.getBoundingClientRect()
                this.mobileNavDom.ontransitionend=()=>this.mobileNavDom.style.display='none'
            }
        })
        this.searchForm.addEventListener("submit",(e)=>{
            e.preventDefault()
            let value=this.searchInput.value
            if(value.trim()==="")return
            open(`/search.html?sq=${value}`,"search_page")
        })
    }
}