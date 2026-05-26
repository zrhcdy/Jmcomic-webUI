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
    }
}
export const lazyLoader=new LazyLoader()
