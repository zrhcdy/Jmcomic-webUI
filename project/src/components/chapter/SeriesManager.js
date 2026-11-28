export class SeriesManager {
    album;
    seriesnDom;
    nextBtn;
    constructor() {
        this.seriesnDom = document.querySelector(".series-inner");
        let controlDom = document.querySelector(".controls");
        this.nextBtn = controlDom.querySelector("button[name=next-chapter]");
        this.returnToTopBtn = controlDom.querySelector(
            "button[name=return-top]",
        );
        this.returnToTopBtn.addEventListener("click", () => {
            scrollTo({
                top: 0,
            });
        });
    }
    init(album) {
        this.album = album;
        if (album.series.length) {
            this.seriesnDom.innerHTML = album.series
                .map((s, i) => {
                    return `<a class="series-item" href="./chapter.html?id=${s.id}">章节${i + 1}</a>`;
                })
                .join("");
            let lockBtn = this.seriesnDom.nextElementSibling;
            lockBtn.addEventListener("click", () => {
                this.seriesnDom.classList.toggle("show-more");
                lockBtn.style.display = "none";
            });
        } else {
            this.seriesnDom.parentNode.style.display = "none";
        }

        let fi = album.series.findIndex((s) => s.id == album.id);
        if (fi > -1) {
            let c = this.seriesnDom.children[fi];
            c.href = "#";
            c.classList.add("active");
            this.seriesnDom.scrollTo({
                top: c.offsetTop - this.seriesnDom.offsetTop,
            });
        }
        if (fi > -1 && fi < album.series.length - 1) {
            this.nextBtn.addEventListener("click", () => {
                location.replace(
                    "./chapter.html?id=" + album.series[fi + 1].id,
                );
            });
        } else {
            this.nextBtn.style.display = "none";
        }
    }
}
