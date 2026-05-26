import { jmApi } from "../api/JmcomicApi.js";
import { NavManager } from "../components/general/NavManager.js";
import { setting } from "../components/general/Setting.js";
import { SwitchServerBtnManager } from "../components/general/SwitchServerBtnManager.js";

class SettingPage {
    navManager
    switchServerBtnManager
    constructor() {}
    async init() {
        setting.init()
        await jmApi.init();
        this.navManager=new NavManager()
        this.navManager.init()
        this.switchServerBtnManager=new SwitchServerBtnManager()
        this.switchServerBtnManager.init()
    }
}
const app = new SettingPage();
app.init();
