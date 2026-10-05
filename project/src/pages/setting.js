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

/**
 * 可选图片预加载边距（IntersectionObserver 的 rootMargin）
 * value 必须与 Setting.js 中 root_margin 的可选值保持一致
 */
const ROOT_MARGINS = ["0px", "50px", "100px", "200px", "500px"];

/**
 * 并发请求开关
 * value 必须与 Setting.js 中 concurrent_request 的可选值保持一致
 * 开启后 retryFetch 会同时请求所有服务器，只保留最快返回的那个，其余立刻取消
 */
const CONCURRENT_REQUESTS = [
    { value: "off", label: "关闭" },
    { value: "on", label: "开启" },
];

class SettingPage {
    navManager;
    switchServerBtnManager;
    themeListDom;
    themeItemDoms;
    activeTheme;
    marginListDom;
    marginItemDoms;
    activeRootMargin;
    concurrentListDom;
    concurrentItemDoms;
    activeConcurrentRequest;
    constructor() {}
    async init() {
        setting.init();

        // 初始化设置项：只依赖本地设置与静态DOM，放在网络请求之前，
        // 避免接口等待期间页面先以默认值渲染再变化
        this.#initTheme();
        this.#initRootMargin();
        this.#initConcurrentRequest();

        await jmApi.init();
        this.navManager=new NavManager()
        this.navManager.init()
        this.switchServerBtnManager=new SwitchServerBtnManager()
        this.switchServerBtnManager.init()
    }

    /**
     * 初始化主题：生成主题元素、恢复已保存主题并绑定交互
     */
    #initTheme() {
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

    /**
     * 初始化图片预加载边距：生成选项、恢复已保存值并绑定交互
     */
    #initRootMargin() {
        this.#createMarginOption();
        this.#updateActiveMargin(setting.root_margin);
        this.#addMarginEvent();
    }

    /**
     * 填充 setting.html 中 .margin-list 的选项元素
     */
    #createMarginOption() {
        const marginListDom = document.querySelector(
            ".setting-body .margin-list",
        );
        marginListDom.innerHTML = ROOT_MARGINS.map(
            (margin) =>
                `<div class="margin-item" data-margin="${margin}">${margin}</div>`,
        ).join("");

        this.marginListDom = marginListDom;
        this.marginItemDoms = marginListDom.querySelectorAll(".margin-item");
    }

    #addMarginEvent() {
        this.marginListDom.addEventListener("click", (e) => {
            const marginItemDom = e.target.closest(".margin-item");
            if (!marginItemDom) return;
            this.selectRootMargin(marginItemDom.dataset.margin);
        });
    }

    /**
     * 选择图片预加载边距：写入本地设置并更新选中态
     * 边距在 IntersectionObserver 创建后无法修改，需在章节页下一次加载时生效
     * @param {string} margin 边距值，取值见 ROOT_MARGINS
     */
    selectRootMargin(margin) {
        if (!ROOT_MARGINS.includes(margin)) return;
        if (margin === this.activeRootMargin) return;

        setting.setOption("root_margin", margin);
        this.#updateActiveMargin(margin);
    }

    #updateActiveMargin(margin) {
        this.marginItemDoms.forEach((item) => {
            item.classList.toggle("active", item.dataset.margin === margin);
        });
        this.activeRootMargin = margin;
    }

    /**
     * 初始化并发请求开关：生成选项、恢复已保存值并绑定交互
     */
    #initConcurrentRequest() {
        this.#createConcurrentOption();
        this.#updateActiveConcurrentRequest(setting.concurrent_request);
        this.#addConcurrentEvent();
    }

    /**
     * 在 .options 中追加并发请求选择元素
     */
    #createConcurrentOption() {
        const concurrentListDom = document.createElement("div");
        concurrentListDom.className = "concurrent-list";
        concurrentListDom.innerHTML = CONCURRENT_REQUESTS.map(
            (item) =>
                `<div class="concurrent-item" data-concurrent="${item.value}">${item.label}</div>`,
        ).join("");

        const optionDom = document.createElement("div");
        optionDom.className = "option concurrent-option";
        optionDom.innerHTML = `<span title="同时向所有服务器发起请求，只保留最快返回的那个，其余立刻取消（会成倍增加请求量）">并发请求: </span>`;
        optionDom.appendChild(concurrentListDom);

        document.querySelector(".setting-body .options").appendChild(optionDom);

        this.concurrentListDom = concurrentListDom;
        this.concurrentItemDoms =
            concurrentListDom.querySelectorAll(".concurrent-item");
    }

    #addConcurrentEvent() {
        this.concurrentListDom.addEventListener("click", (e) => {
            const concurrentItemDom = e.target.closest(".concurrent-item");
            if (!concurrentItemDom) return;
            this.selectConcurrentRequest(concurrentItemDom.dataset.concurrent);
        });
    }

    /**
     * 选择是否并发请求：写入本地设置并更新选中态
     * 每次发起请求时都会重新读取该设置，所以无需刷新页面即可生效
     * @param {string} value "off" 或 "on"，取值见 CONCURRENT_REQUESTS
     */
    selectConcurrentRequest(value) {
        if (!CONCURRENT_REQUESTS.some((item) => item.value === value)) return;
        if (value === this.activeConcurrentRequest) return;

        setting.setOption("concurrent_request", value);
        this.#updateActiveConcurrentRequest(value);
    }

    #updateActiveConcurrentRequest(value) {
        this.concurrentItemDoms.forEach((item) => {
            item.classList.toggle("active", item.dataset.concurrent === value);
        });
        this.activeConcurrentRequest = value;
    }
}
const app = new SettingPage();
app.init();
