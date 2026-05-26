import { jmApi } from "../../api/JmcomicApi.js";
import { ImageCutter } from "../general/ImageCutter.js";
import { Queue } from "../general/Queue.js";

export class ComicImageLoader {
    intersectionObserver;
    resizeObserver;
    cutter;
    id;
    queue
    maxQueueLength
    loadedCount=0
    constructor(id) {
        this.id=id
        this.resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                let imgCr = entry.target.parentNode;
                let img = entry.target;
                if(entry.target.parentNode===null){
                    this.resizeObserver.unobserve(img)
                    return
                }
                if (img.height > 40) {
                    this.resizeObserver.unobserve(img);
                    
                    imgCr.style.height = img.height + "px";
                    imgCr.ontransitionend = () => {
                        imgCr.ontransitionend = null;
                        imgCr.style.height = null;
                    };
                }
            }
        });
        this.intersectionObserver = new IntersectionObserver(
            (entries) => {
                for (let entry of entries) {
                    if (entry.isIntersecting) {
                        const cover = entry.target;
                        if(!cover.dataset.beginload && this.queue.hasEmptySeat()){
                            const coverImg = cover.querySelector("img");
                            this.queue.add(cover)
                            cover.dataset.beginload="true"
                            coverImg.src = jmApi.getChapterImageURL(this.id,cover.dataset.path);
                        }
                        this.onIndexUpdate(+cover.dataset.index)
                    }
                }
            },
            { rootMargin: "50px" },
        );
        this.cutter = new ImageCutter();
        this.maxQueueLength=this.getMaxQueueLength()
        this.queue=new Queue(this.maxQueueLength)
    }
    addImgCr(container) {
        this.intersectionObserver.observe(container);
        this.resizeObserver.observe(container.children[1]);
        
        container.children[1].addEventListener("load", () => {
            this.loadedCount++
            this.onLoadedImage(this.loadedCount)
            container.removeChild(container.children[0]);
            let img = container.children[0];
            if (this.id >= 220980 && !container.dataset.path.endsWith(".gif")){
                container.removeChild(container.children[0])
                container.appendChild(this.cutter.cutImage(img, this.id, container.dataset.path));
            }else{
                img.style.filter="none"
            }
            container.style.height = null
            this.queue.removeItem(container)
        });
    }
    getMaxQueueLength(){
        let hours=new Date().getHours()
        if(hours>21)return 3;
        if(hours>18)return 6;
        return 10;
    }
    onIndexUpdate(){}
    onLoadedImage(count){}
}
