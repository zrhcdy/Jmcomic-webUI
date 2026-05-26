import { jmApi } from "../../api/JmcomicApi.js";

export class CategoriesHeadManager {
    headDom;
    tags;
    selectedTag;
    selectedInnerTags = {};
    selectedSortItem;
    sortDom

    searchMode
    slug
    subSlug
    constructor() {
        this.headDom = document.querySelector(".categories-head");
        this.tagsCr1 = this.headDom.querySelector(".tags-container-1");
        this.tagsInner = this.headDom.querySelector(".tags-inner");
        this.sortDom=this.headDom.querySelector(".sort")
    }
    async init() {
        const categories = await jmApi.getCategories();
        this.categories = categories.categories;
        this.updateTags();
        this.#addEvent();
        this.selectTag(this.tagsCr1.children[0]);
        this.selectSearchMode(this.sortDom.children[0])

    }
    updateTags() {
        let tagsInnerHTML = "";
        this.tagsCr1.innerHTML = this.categories
            .map((c) => {
                if (c.type === "slug") {
                    tagsInnerHTML += `<div class="tags-container-2" style="display:none;" data-parentslug="${c.slug}">${c.sub_categories
                        .map((sc) => {
                            return `<div class="tag" data-slug="${sc.slug}">${sc.name}</div>`;
                        })
                        .join("")}</div>`;
                }
                return `<div class="tag" data-slug="${c.slug}" data-type="${c.type}">${c.name}</div>`;
            })
            .join("");
        this.tagsInner.innerHTML = tagsInnerHTML;
    }
    updateInnerTags() {}
    selectTag(tag) {
        if (tag === this.selectedTag) return;
        let type = tag.dataset.type;
        let slug = tag.dataset.slug;
        let subCr;
        for (let i = 0; i < this.tagsInner.children.length; i++) {
            let child = this.tagsInner.children[i];
            child.style.display = "none";
            // console.log();

            if (child.dataset.parentslug === slug) {
                subCr = child;
                child.style.display = "flex";
            }
        }
        if (this.selectedTag) this.selectedTag.classList.remove("active");
        tag.classList.add("active");
        this.selectedTag = tag;
        this.slug=slug
        if(this.selectedInnerTags[slug])this.subSlug=this.selectedInnerTags[slug].dataset.slug
        this.onCategoryUpdate(this.slug+"_"+this.subSlug,this.searchMode)
    }
    selectInnerTag(tag) {
        let slug = tag.dataset.slug;
        let parentSlug = tag.parentNode.dataset.parentslug;
        if (this.selectedInnerTags[parentSlug] === tag) return;
        if (this.selectedInnerTags[parentSlug])
            this.selectedInnerTags[parentSlug].classList.remove("active");
        this.selectedInnerTags[parentSlug] = tag;
        tag.classList.add("active")
        this.subSlug=slug
        this.onCategoryUpdate(this.slug+"_"+this.subSlug,this.searchMode)
        
    }
    selectSearchMode(item){
        if(this.selectedSortItem===item)return
        if(this.selectedSortItem)this.selectedSortItem.classList.remove("active")
        this.selectedSortItem=item
        item.classList.add("active")
        this.searchMode=item.dataset.mode
        this.onCategoryUpdate(this.slug+"_"+this.subSlug,this.searchMode)

    }
    #addEvent() {
        for (let i = 0; i < this.tagsCr1.children.length; i++) {
            this.tagsCr1.children[i].addEventListener("click", (e) => {
                this.selectTag(e.target);
            });
        }
        this.tagsInner.addEventListener("click", (e) => {
            if (e.target.className === "tag") {
                this.selectInnerTag(e.target);
            }
        });
        this.sortDom.addEventListener("click", (e) => {
            if (e.target.className === "sort-item") {
                this.selectSearchMode(e.target);
            }
        });
    }
    onCategoryUpdate(slug,order){}
}
