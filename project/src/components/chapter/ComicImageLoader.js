import { jmApi } from "../../api/JmcomicApi.js";
import { COMIC_ID_R1, ImageCutter } from "../general/ImageCutter.js";
import { Queue } from "../general/Queue.js";
import { setting } from "../general/Setting.js";

export class ComicImageLoader {
    intersectionObserver;
    resizeObserver;
    cutter;
    id;
    queue;
    maxQueueLength = setting.max_queue_length || 10; //最大同时加载的图片数
    loadedCount = 0;
    constructor(id) {
        this.id = id;
        this.resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                let imgCr = entry.target.parentNode;
                let img = entry.target;
                if (entry.target.parentNode === null) {
                    this.resizeObserver.unobserve(img);
                    return;
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
        //监听图片是否可以加载
        this.intersectionObserver = new IntersectionObserver(
            (entries) => {
                for (let entry of entries) {
                    if (entry.isIntersecting) {
                        const cover = entry.target;
                        const coverImg = cover.querySelector("img");

                        if (cover.classList.contains("beginload")) continue;
                        cover.classList.add("beginload");
                        this.queue.add(
                            cover.dataset.path,
                            () => {
                                coverImg.src = jmApi.getChapterImageURL(
                                    this.id,
                                    cover.dataset.path,
                                );
                                let retryCount = 0;
                                coverImg.onerror = () => {
                                    if (retryCount >= 5) {
                                        cover.classList.remove("beginload");
                                        this.queue.removeItem(cover.dataset.path)
                                        return;
                                    }
                                    retryCount++;
                                    coverImg.src = jmApi.getChapterImageURL(
                                        this.id,
                                        cover.dataset.path,
                                    );
                                };
                            },
                            () => {
                                cover.classList.remove("beginload");
                            },
                        );
                    }
                }
            },
            { rootMargin: setting.root_margin },
        );
        //用于更新进度条
        this.indexUpdateObserver = new IntersectionObserver(
            (entries) => {
                for (let entry of entries) {
                    if (entry.isIntersecting) {
                        const cover = entry.target;
                        this.onIndexUpdate(+cover.dataset.index);
                    }
                }
            },
            { rootMargin: "0px" },
        );
        this.cutter = new ImageCutter();
        this.queue = new Queue(this.maxQueueLength, 3);
    }
    addImgCr(container) {
        this.intersectionObserver.observe(container);
        this.indexUpdateObserver.observe(container);

        this.resizeObserver.observe(container.children[1]);

        container.children[1].addEventListener("load", () => {
            this.loadedCount++;
            this.onLoadedImage(this.loadedCount);

            let span = container.querySelector("span");
            let img = container.querySelector("img");
            container.removeChild(span);

            if (
                this.id >= COMIC_ID_R1 &&
                !container.dataset.path.endsWith(".gif")
            ) {
                container.removeChild(img);
                container.appendChild(
                    this.cutter.cutImage(img, this.id, container.dataset.path),
                );
            } else {
                img.style.filter = "none";
            }
            container.style.height = null;
            this.queue.removeItem(container.dataset.path);
        });
    }
    onIndexUpdate() {}
    onLoadedImage(count) {}
}
