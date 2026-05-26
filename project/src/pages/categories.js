import { jmApi } from "../api/JmcomicApi.js";
import { CategoriesContainerManager } from "../components/categories/CategoriesContainerManager.js";
// import { CategoriesContainerManager } from "../components/categories/CategoriesContainerManager.js";
import { CategoriesHeadManager } from "../components/categories/CategoriesHeadManager.js";
import { NavManager } from "../components/general/NavManager.js";
import { setting } from "../components/general/Setting.js";

class CategoriesPage {
    navManager
    constructor() {}
    async init() {
        setting.init()
        await jmApi.init();
        this.navManager=new NavManager()
        this.navManager.init()

        this.categoriesHeadManager=new CategoriesHeadManager()
        this.categoriesHeadManager.init()

        this.categoriesContainerManager=new CategoriesContainerManager()
        this.categoriesContainerManager.init()

        this.categoriesHeadManager.onCategoryUpdate=(slug,order)=>{
            console.log(slug);
            
            this.categoriesContainerManager.setArgs(slug,order)
            this.categoriesContainerManager.research()
        }
    }
}
const app = new CategoriesPage();
app.init();
