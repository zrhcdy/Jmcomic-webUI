import { jmApi } from "../api/JmcomicApi.js";
import { BannerManager } from "../components/main/BannerManager.js";
import { NavManager } from "../components/general/NavManager.js";
import { RecommendationsManager } from "../components/main/RecommendationsManager.js";
import { TagContainerManager } from "../components/main/TagContainerManager.js";
import { setting } from "../components/general/Setting.js";
import { SwitchServerBtnManager } from "../components/general/SwitchServerBtnManager.js";

class MainPage {
    navManager;
    switchServerBtnManager
    bannerManager;
    tagContainerManager;
    recommendationsManager;

    constructor() {}
    async init() {
        setting.init()
        await jmApi.init();
        this.navManager = new NavManager();
        this.switchServerBtnManager=new SwitchServerBtnManager()
        this.bannerManager = new BannerManager();
        this.tagContainerManager = new TagContainerManager();
        this.recommendationsManager = new RecommendationsManager();

        this.navManager.init();
        this.switchServerBtnManager.init()
        this.bannerManager.init();
        this.tagContainerManager.init();
        this.recommendationsManager.init();
    }
}
const app = new MainPage();
app.init();
