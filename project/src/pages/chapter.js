import { jmApi } from "../api/JmcomicApi.js";
import { ComicImageManager } from "../components/chapter/ComicImageManager.js";
import { CommentManager } from "../components/chapter/CommentManager.js";
import { HeadManager } from "../components/chapter/HeadManager.js";
import { RecommendationsComicManager } from "../components/chapter/RecommendedComicsManager.js";
import { SeriesManager } from "../components/chapter/SeriesManager.js";
import { NavManager } from "../components/general/NavManager.js";
import { setting } from "../components/general/Setting.js";
import { SwitchServerBtnManager } from "../components/general/SwitchServerBtnManager.js";

class ChapterPage {
    comicId;
    comicImageManager;
    commentManager;
    headManager;
    recommendedComicsManager;
    navManager;
    switchServerBtnManager;
    seriesManager;
    constructor() {}
    async init() {
        const id = new URLSearchParams(location.search).get("id");
        if (typeof id !== "string" || isNaN(+id))
            throw new Error("ID is not true");

        this.id = id;
        setting.init();
        await jmApi.init();

        let history = localStorage.getItem("history");
        if (!history) {
            history = [];
        } else {
            history = JSON.parse(history);
        }

        localStorage.setItem("history", JSON.stringify(history));
        jmApi.getComicAlbum(this.id).then((album) => {
            console.log(album);
            this.headManager = new HeadManager();
            this.headManager.init(album);

            this.commentManager = new CommentManager();
            this.commentManager.init(album);

            this.recommendedComicsManager = new RecommendationsComicManager();
            this.recommendedComicsManager.init(album);

            this.seriesManager = new SeriesManager()
            this.seriesManager.init(album)
            let fi = history.findIndex((h) => +h.id == +this.id);
            if (fi > -1) {
                history.splice(fi, 1);
            }
            history.unshift({
                id: this.id,
                addTime: new Date().toLocaleDateString(),
                name: album.name,
                author: album.author,
            });
            if(history.length>9999){
                history.pop()
            }
            localStorage.setItem("history", JSON.stringify(history));
        });

        jmApi.getComicChapter(this.id).then((chapter) => {
            console.log(chapter);
            this.comicImageManager = new ComicImageManager();
            this.comicImageManager.init(chapter);
        });
        this.navManager = new NavManager();
        this.switchServerBtnManager = new SwitchServerBtnManager();
        this.navManager.init();
        this.switchServerBtnManager.init();
    }
}
const app = new ChapterPage();
app.init();
