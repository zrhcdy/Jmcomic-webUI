import { jmApi } from "../api/JmcomicApi.js";
import { FavoriteContainerManager } from "../components/favorite/FavoriteContainerManager.js";
import { NavManager } from "../components/general/NavManager.js";
import { setting } from "../components/general/Setting.js";
import { SwitchServerBtnManager } from "../components/general/SwitchServerBtnManager.js";
class FavoritePage {
    navManager
    switchServerBtnManager
    favoriteContainerManager
    constructor() {}
    async init() {
        setting.init()
        await jmApi.init();

        this.favoriteContainerManager=new FavoriteContainerManager()
        this.favoriteContainerManager.init()

        this.navManager=new NavManager()
        this.navManager.init()
        this.switchServerBtnManager=new SwitchServerBtnManager()
        this.switchServerBtnManager.init()
    }
}
const app = new FavoritePage();
app.init();
