import { jmApi } from "../api/JmcomicApi.js";
import { NavManager } from "../components/general/NavManager.js";
import { ServerSpeedTester } from "../components/general/ServerSpeedTester.js";
import { setting } from "../components/general/Setting.js";
import { SwitchServerBtnManager } from "../components/general/SwitchServerBtnManager.js";

/**
 * 设置页的选项元素全部写在 setting.html 里，类名统一为下面这一套：
 *
 * <div class="option">
 *     <span>标题: </span>
 *     <div class="option-list" data-key="app_theme">
 *         <div class="option-item" data-value="pink">…</div>
 *     </div>
 * </div>
 *
 * data-key 是设置键（同时也是 localStorage 的键、Setting.js 里的 getter 名），
 * data-value 是该设置项的合法取值，点一下就把 data-value 写进 data-key。
 *
 * 所以增删设置项只需要改两处：setting.html 的选项元素 + Setting.js 的白名单与 getter，
 * 这里不用动。data-value 必须出现在对应设置项的白名单里，否则 setOption 会拒绝写入。
 */
class SettingPage {
    navManager;
    switchServerBtnManager;
    /** 所有设置项列表，每项形如 { key, listDom, itemDoms, value } */
    optionLists;
    /** 图片服务器测速 */
    speedTester;
    speedBtnDom;
    speedTipDom;
    speedResultDom;
    speedItemDoms;
    testing = false;
    /** 本轮测速里最快的那台用时，用来判断后面回来的结果是不是更快 */
    bestTime = Infinity;
    constructor() {}
    async init() {
        setting.init();

        // 初始化设置项：只依赖本地设置与静态DOM，放在网络请求之前，
        // 避免接口等待期间页面先以默认值渲染再变化
        this.#initOptions();
        // 测速条目同样只用静态DOM与 jmApi.imgServers（实例化时就填好了），不用等接口
        this.#initSpeedTest();

        await jmApi.init();
        this.navManager=new NavManager()
        this.navManager.init()
        this.switchServerBtnManager=new SwitchServerBtnManager()
        this.switchServerBtnManager.init()
    }

    /**
     * 初始化所有设置项：按已保存的设置标出选中项，并绑定点击
     * 一切都由 data-key / data-value 驱动，新增设置项无需改这里
     */
    #initOptions() {
        const listDoms = document.querySelectorAll(
            ".setting-body .option-list[data-key]",
        );
        this.optionLists = [...listDoms].map((listDom) => {
            const key = listDom.dataset.key;
            const itemDoms = [...listDom.querySelectorAll(".option-item")];
            const optionList = { key, listDom, itemDoms, value: setting[key] };

            if (optionList.value === undefined) {
                // data-key 在 Setting.js 里没有同名 getter，读不到当前值
                console.warn(
                    `data-key="${key}" 在 Setting.js 里没有同名的 getter，这一项不会生效`,
                );
            }
            this.#mark(optionList, optionList.value);

            // 事件委托：点选项本身或其子元素（比如主题的色卡圆点）都算选中
            listDom.addEventListener("click", (e) => {
                const itemDom = e.target.closest(".option-item");
                if (!itemDom) return;
                this.select(key, itemDom.dataset.value);
            });

            return optionList;
        });
    }

    /**
     * 选中某个设置项的某个值：写入本地设置并更新选中态
     * @param {string} key 设置键，对应 HTML 上的 data-key
     * @param {string} value 设置值，对应 HTML 上的 data-value
     */
    select(key, value) {
        const optionList = this.optionLists.find((item) => item.key === key);
        if (!optionList || value === optionList.value) return;

        setting.setOption(key, value);
        // 读回写入后的真实值：HTML 里的值和 Setting.js 白名单对不上时
        // setOption 会拒绝写入，此时保持原选中项，免得界面和实际设置不一致
        const currentValue = setting[key];
        if (currentValue === undefined) return;
        this.#mark(optionList, currentValue);
        // 主题是唯一需要立刻改变界面外观的设置项
        if (key === "app_theme") this.#applyTheme(currentValue);
    }

    /**
     * 按值标出选中项
     * @param {Object} optionList #initOptions 里建出来的列表对象
     * @param {string} value 选中的值
     */
    #mark(optionList, value) {
        optionList.itemDoms.forEach((itemDom) => {
            itemDom.classList.toggle("active", itemDom.dataset.value === value);
        });
        optionList.value = value;
    }

    /**
     * 把主题类应用到 <html>：先摘掉所有已知主题类，再挂上新的那个
     * 类名约定为 `${值}-theme`，定义在 style/basic.css
     * @param {string} theme 主题标识
     */
    #applyTheme(theme) {
        const themeValues = this.#getValues("app_theme");
        document.documentElement.classList.remove(
            ...themeValues.map((value) => `${value}-theme`),
        );
        document.documentElement.classList.add(`${theme}-theme`);
    }

    /**
     * 取某个设置项在 HTML 里列出的全部可选值
     * @param {string} key 设置键
     * @returns {string[]} 可选值数组
     */
    #getValues(key) {
        const optionList = this.optionLists.find((item) => item.key === key);
        return optionList
            ? optionList.itemDoms.map((itemDom) => itemDom.dataset.value)
            : [];
    }

    /**
     * 初始化图片服务器测速：按图片服务器数量生成结果条目，绑定按钮与条目点击
     * 服务器列表来自 jmApi.imgServers，实例化时就填好了，所以不依赖 jmApi.init()
     */
    #initSpeedTest() {
        this.speedBtnDom = document.querySelector(".speed-option .speed-btn");
        this.speedTipDom = document.querySelector(".speed-option .speed-tip");
        this.speedResultDom = document.querySelector(
            ".speed-option .speed-result",
        );
        if (!this.speedBtnDom || !this.speedResultDom) return;

        this.speedTester = new ServerSpeedTester();

        // 条目按服务器数量生成，服务器的增减不用改 HTML。
        // title 放域名，鼠标停在上面就能看到到底测的是哪台
        this.speedResultDom.innerHTML = jmApi.imgServers
            .map(
                (server, index) =>
                    `<div class="speed-item" data-index="${index}" title="${server}">` +
                    `<span class="speed-name">图源${index + 1}</span>` +
                    `<span class="speed-time">未测速</span>` +
                    `</div>`,
            )
            .join("");
        this.speedItemDoms = [
            ...this.speedResultDom.querySelectorAll(".speed-item"),
        ];
        this.#markServer(+setting.using_imgserver_index);

        this.speedBtnDom.addEventListener("click", () => this.runSpeedTest());
        // 点某一项就切到那台服务器：测速只是给建议，用哪台还是用户说了算
        this.speedResultDom.addEventListener("click", (e) => {
            const itemDom = e.target.closest(".speed-item");
            if (!itemDom || itemDom.classList.contains("failed")) return;
            this.useServer(+itemDom.dataset.index);
        });
    }

    /**
     * 测速：同时向所有图片服务器请求同一张图，每台一回来就刷新一条结果
     * 六台是同时起跑的，所以最先回来的那台就是最快的，一到手就直接切过去
     */
    async runSpeedTest() {
        if (this.testing) return;
        this.testing = true;
        this.bestTime = Infinity;
        this.speedBtnDom.disabled = true;
        this.speedBtnDom.textContent = "测速中…";
        this.#setSpeedTip("测速中…");
        this.speedItemDoms.forEach((itemDom) => {
            itemDom.classList.remove("best", "failed");
            itemDom.querySelector(".speed-time").textContent = "测速中";
        });

        try {
            const results = await this.speedTester.test((result) =>
                this.#showSpeedResult(result),
            );
            if (!results.some((result) => result.success)) {
                this.#setSpeedTip("所有图片服务器都测不通");
            }
        } catch (error) {
            this.#setSpeedTip(`测速失败: ${error?.message ?? error}`);
        } finally {
            this.testing = false;
            this.speedBtnDom.disabled = false;
            this.speedBtnDom.textContent = "开始测速";
        }
    }

    /**
     * 刷新一台服务器的测速结果；如果它是目前最快的，就顺手切过去
     * @param {Object} result ServerSpeedTester 的结果 { index, success, time, error }
     */
    #showSpeedResult(result) {
        const itemDom = this.speedItemDoms[result.index];
        if (!itemDom) return;
        const timeDom = itemDom.querySelector(".speed-time");

        if (!result.success) {
            itemDom.classList.add("failed");
            timeDom.textContent = result.error;
            return;
        }

        timeDom.textContent = `${Math.round(result.time)}ms`;
        if (result.time >= this.bestTime) return;

        this.bestTime = result.time;
        this.speedItemDoms.forEach((other) => other.classList.remove("best"));
        itemDom.classList.add("best");
        this.useServer(result.index);
        this.#setSpeedTip(
            `已切换到 图源${result.index + 1}（最快，${Math.round(result.time)}ms）`,
        );
    }

    /**
     * 使用某台图片服务器：写入本地设置，并同步导航上的图源按钮
     * 这里刻意不刷新页面 —— 测速结果还要留在屏幕上给用户看
     * @param {number} index 图片服务器索引
     */
    useServer(index) {
        setting.setOption("using_imgserver_index", index);
        // 读回真实生效的值：万一白名单里没有这个索引，界面跟着实际设置走
        const currentIndex = +setting.using_imgserver_index;
        this.#markServer(currentIndex);
        this.switchServerBtnManager?.setServer(currentIndex);
        this.#setSpeedTip(`已切换到 图源${currentIndex + 1}`);
    }

    /**
     * 标出当前正在使用的图片服务器
     * @param {number} index 图片服务器索引
     */
    #markServer(index) {
        this.speedItemDoms.forEach((itemDom) => {
            itemDom.classList.toggle("active", +itemDom.dataset.index === index);
        });
    }

    /**
     * 更新测速状态文字
     * @param {string} text 状态文字
     */
    #setSpeedTip(text) {
        if (this.speedTipDom) this.speedTipDom.textContent = text;
    }
}
const app = new SettingPage();
app.init();
