export class InfinityScrollContainer {
    isLoading = false;
    pageIndex = 0;
    maxPageIndex = 10000;
    container;
    threshold;
    loadContent;
    coolingTime;
    prevLoadedTime = 0;
    constructor({
        container = null,
        threshold = 100,
        loadContent = () => {},
        coolingTime = 1000,
    }) {
        this.container = container;
        this.threshold = threshold;
        this.loadContent = loadContent;
        this.coolingTime = coolingTime;
    }
    init() {
        this.addEvent();
        this.#onScroll();
    }
    addEvent() {
        window.addEventListener("scroll", () => this.#onScroll());
    }
    #onScroll() {
        if (
            this.isLoading ||
            this.pageIndex >= this.maxPageIndex ||
            Date.now() - this.prevLoadedTime < this.coolingTime
        )
            return;
        
        let bottom = Math.floor(
            document.documentElement.offsetHeight -
                document.documentElement.scrollTop -
                window.screen.height,
        );
        if (bottom < this.threshold) {
            this.loadContent(++this.pageIndex).then(
                () => (this.isLoading = false),
            );
            this.isLoading = true;
            this.prevLoadedTime = Date.now();
        }
    }
}
