import { jmApi } from "../api/JmcomicApi.js";

class LazyLoader {
    observer;
    constructor() {
        this.observer = new IntersectionObserver(
            (entries) => {
                for (let entry of entries) {
                    if (entry.isIntersecting) {
                        this.observer.unobserve(entry.target);
                        const cover = entry.target;
                        const coverImg = cover.children[0];
                        coverImg.src = cover.dataset.src;
                    }
                }
            },
            { rootMargin: "50px" },
        );
    }
    addCover(coverEle){
        this.observer.observe(coverEle)
        let img=coverEle.children[0]
        let retryCount=0
        img.onerror=()=>{
            img.src = null;
            img.src = coverEle.dataset.id?jmApi.getCoverImageURL(coverEle.dataset.id,retryCount):coverEle.dataset.src;
            retryCount++;
            if (retryCount >= 5) {
                img.onerror=null
                img.onload=null
            }
        }
        img.onload=()=>{
            img.onerror=null
            img.onload=null
        }
    }
    clear(){
        this.observer.disconnect()
    }
}
export const lazyLoader=new LazyLoader()