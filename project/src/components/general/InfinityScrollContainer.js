export class InfinityScrollContainer {
    isLoading = false;
    pageIndex = 0;
    maxPageIndex = 10000;
    container;
    threshold;
    loadContent;
    coolingTime;
    prevLoadedTime = 0;
    isGlobalContainer
    constructor({
        container = null,
        threshold = 100,
        loadContent = () => {},
        coolingTime = 1000,
        isGlobalContainer = true
    }) {
        this.container = container;
        this.threshold = threshold;
        this.loadContent = loadContent;
        this.coolingTime = coolingTime;
        this.isGlobalContainer = isGlobalContainer
    }
    init() {
        this.addEvent();
        this.#onScroll();
    }
    addEvent() {
        (this.isGlobalContainer?window:this.container.parentNode).addEventListener("scroll", () => this.#onScroll());
    }
    getBottom(){
        if(this.isGlobalContainer){
            return Math.floor(
                document.documentElement.offsetHeight -
                document.documentElement.scrollTop -
                innerHeight,
            );
        }
        
        return Math.floor(
            this.container.offsetHeight -
            this.container.parentNode.scrollTop -
            this.container.parentNode.offsetHeight,
        );
    }
    #onScroll() {
        if (
            this.isLoading ||
            this.pageIndex >= this.maxPageIndex ||
            Date.now() - this.prevLoadedTime < this.coolingTime
        )
            return;
        
        let bottom = this.getBottom()
        console.log(bottom);
        
        if (bottom < this.threshold) {
            this.loadContent(++this.pageIndex).then(
                () => (this.isLoading = false),
            );
            this.isLoading = true;
            this.prevLoadedTime = Date.now();
        }
    }
}
