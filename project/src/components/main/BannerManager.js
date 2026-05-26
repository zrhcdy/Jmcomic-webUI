import { jmApi } from "../../api/JmcomicApi.js";
import { lazyLoader } from "../../dom/LazyLoader.js";
import { BannerCarousel } from "./BannerCarousel.js";

export class BannerManager {
    bannerDom;
    bannerInner;
    bannerItems;
    bannerContent = [
        {
            large: [
                { title: "", id: "1436985" },
                { title: "", id: "1436983" },
            ],
            small: ["1371700", "1436050", "345016", "1027519", "1220641", "1439051"],
        },
        {
            large: [
                { title: "", id: "1433587" },
                { title: "", id: "1263887" },
            ],
            small: ["1426236", "1435722", "557728", "1435728", "1116808", "1437298"],
        },
        {
            large: [
                { title: "", id: "1428159" },
                { title: "", id: "1421773" },
            ],
            small: ["1438246", "1436983", "1436682", "1292074", "1438891", "1143863"],
        },
    ];
    constructor() {
        this.bannerDom = document.querySelector(".banner");
        this.bannerInner=this.bannerDom.children[0];
        this.bannerItems=[...this.bannerInner.children]
    }
    init() {
        this.#setBannerContent();
        this.bannerCarousel=new BannerCarousel(this.bannerDom)
        this.bannerCarousel.init()
    }
    #setBannerContent() {
        this.bannerItems.forEach((item,index)=>{
            let content=this.bannerContent[index]
            let largeComics=item.querySelectorAll(".l-comic")
            for(let i=0;i<largeComics.length;i++){
                let data=content.large[i]
                let cover=largeComics[i].children[0]
                cover.dataset.src=jmApi.getCoverImageURL(data.id)
                cover.href=`./chapter.html?id=${data.id}`
                lazyLoader.addCover(cover)
            }
            let smallComics=item.querySelectorAll(".s-comic")
            for(let i=0;i<smallComics.length;i++){
                let id=content.small[i]
                let cover=smallComics[i].children[0]
                cover.dataset.src=jmApi.getCoverImageURL(id)
                cover.href=`./chapter.html?id=${id}`
                lazyLoader.addCover(cover)
            }
        })
    }
}
