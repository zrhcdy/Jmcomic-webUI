import { jmApi } from "../api/JmcomicApi.js";
import { NavManager } from "../components/general/NavManager.js";
import { setting } from "../components/general/Setting.js";
import { SwitchServerBtnManager } from "../components/general/SwitchServerBtnManager.js";
import { SearchContainerManager } from "../components/search/SearchContainerManager.js";

class SearchPage {
    navManager
    searchContainerManager
    searchQuery
    switchServerBtnManager
    constructor() {}
    async init() {
        const sq = new URLSearchParams(location.search).get("sq");
        if (typeof sq !== "string" || sq.trim()==="")
            throw new Error("sq is not true");

        this.searchQuery = sq;
        setting.init()
        await jmApi.init();
        const searchContainerManager=new SearchContainerManager(this.searchQuery)
        searchContainerManager.init()

        this.navManager=new NavManager()
        this.navManager.init()
        this.switchServerBtnManager=new SwitchServerBtnManager()
        this.switchServerBtnManager.init()
    }
}
const app = new SearchPage();
app.init();
