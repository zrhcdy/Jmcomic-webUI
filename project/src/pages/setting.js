import { jmApi } from "../api/JmcomicApi.js";
import { NavManager } from "../components/general/NavManager.js";
import { setting } from "../components/general/Setting.js";
import { SwitchServerBtnManager } from "../components/general/SwitchServerBtnManager.js";

/**
 * 可选主题列表
 * value 必须与 Setting.js 中 app_theme 的可选值保持一致（setOption 会做校验）
 * 每项对应的样式类定义在 style/basic.css 中，类名为 `${value}-theme`
 */
const THEMES = [
    { value: "pink", label: "粉色" },
    { value: "blue", label: "蓝色" },
    { value: "green", label: "绿色" },
    { value: "purple", label: "紫色" },
    { value: "gray", label: "灰白" },
    { value: "dark", label: "深色" },
];

class SettingPage {
    navManager;
    switchServerBtnManager;
    themeListDom;
    themeItemDoms;
    activeTheme;
    constructor() {}
    async init() {
        setting.init();

        // 初始化主题切换：只依赖本地设置与静态DOM，放在网络请求之前，
        // 避免接口等待期间页面先以默认主题渲染再变色
        this.#initTheme();

        await jmApi.init();
        this.navManager=new NavManager()
        this.navManager.init()
        this.switchServerBtnManager=new SwitchServerBtnManager()
        this.switchServerBtnManager.init()
    }

    /**
     * 初始化主题：补齐设置项、生成主题元素、恢复已保存主题并绑定交互
     */
    #initTheme() {
        // Setting.init() 遍历配置项时只要有一项在 localStorage 中不存在就会提前 return，
        // 因此 app_theme 有可能没被读取到。这里先把图源配置补齐再 init 一次，
        // 保证主题设置能被正确加载（图源值取自已加载的设置，不会覆盖已有配置）
        setting.setOption("using_imgserver_index", setting.using_imgserver_index);
        setting.init();

        this.#createThemeOption();
        this.selectTheme(setting.app_theme, true);
        this.#addThemeEvent();
    }

    /**
     * 在 .options 中追加主题选择元素
     */
    #createThemeOption() {
        const themeListDom = document.createElement("div");
        themeListDom.className = "theme-list";
        themeListDom.innerHTML = THEMES.map(
            (theme) =>
                `<div class="theme-item" data-theme="${theme.value}" title="${theme.label}主题">
                    <span class="theme-dot"></span>
                    <span>${theme.label}</span>
                </div>`,
        ).join("");

        const optionDom = document.createElement("div");
        optionDom.className = "option theme-option";
        optionDom.innerHTML = `<span>主题配色: </span>`;
        optionDom.appendChild(themeListDom);

        document.querySelector(".setting-body .options").appendChild(optionDom);

        this.themeListDom = themeListDom;
        this.themeItemDoms = themeListDom.querySelectorAll(".theme-item");
    }

    #addThemeEvent() {
        this.themeListDom.addEventListener("click", (e) => {
            const themeItemDom = e.target.closest(".theme-item");
            if (!themeItemDom) return;
            this.selectTheme(themeItemDom.dataset.theme);
        });
    }

    /**
     * 选择主题：写入本地设置、把主题类应用到根元素并更新选中态
     * @param {string} theme 主题标识，取值见 THEMES
     * @param {boolean} force 为 true 时即使主题未变化也重新应用（用于初始化恢复）
     */
    selectTheme(theme, force = false) {
        if (!THEMES.some((item) => item.value === theme)) return;
        if (!force && theme === this.activeTheme) return;

        setting.setOption("app_theme", theme);
        this.#applyTheme(theme);
        this.#updateActiveItem(theme);
    }

    /**
     * 把主题类应用到 <html> 上，应用前先移除其它主题类
     * @param {string} theme 主题标识
     */
    #applyTheme(theme) {
        document.documentElement.classList.remove(
            ...THEMES.map((item) => `${item.value}-theme`),
        );
        document.documentElement.classList.add(`${theme}-theme`);
    }

    #updateActiveItem(theme) {
        this.themeItemDoms.forEach((item) => {
            item.classList.toggle("active", item.dataset.theme === theme);
        });
        this.activeTheme = theme;
    }
}
const app = new SettingPage();
app.init();
