import { jmApi } from "../api/JmcomicApi.js";
import { NavManager } from "../components/general/NavManager.js";
import { setting } from "../components/general/Setting.js";
import { SwitchServerBtnManager } from "../components/general/SwitchServerBtnManager.js";
import { HistoryContainerManager } from "../components/history/HistoryContainerManager.js";
class HistoryPage {
    navManager
    switchServerBtnManager
    historyContainerManager
    constructor() {}
    async init() {
        setting.init()
        await jmApi.init();

        this.historyContainerManager=new HistoryContainerManager()
        this.historyContainerManager.init()

        this.navManager=new NavManager()
        this.navManager.init()
        this.switchServerBtnManager=new SwitchServerBtnManager()
        this.switchServerBtnManager.init()
    }
}
const app = new HistoryPage();
app.init();
