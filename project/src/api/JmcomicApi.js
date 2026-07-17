import { setting } from "../components/general/Setting.js"; // 导入设置模块
import { crypto } from "./Crypto.js"; // 导入加密解密模块

/**
 * 禁漫天堂API类
 * 提供对禁漫天堂API的各种操作接口
 */
class JmcomicApi {
    accessToken; // 访问令牌对象，包含token和tokenParam
    currentKey; // 当前时间戳作为密钥
    servers; // API服务器列表
    // 图片服务器列表，用于获取漫画图片
    imgServers = [
        "cdn-msp.jmapiproxy1.cc",
        "cdn-msp.jmapiproxy2.cc",
        "cdn-msp2.jmapiproxy2.cc",
        "cdn-msp3.jmapiproxy2.cc",
        "cdn-msp.jmapinodeudzn.net",
        "cdn-msp3.jmapinodeudzn.net",
    ];
    usingImgServerIndex = 0; // 使用中的图片服务器索引
    
    /**
     * 构造函数，初始化API实例
     */
    constructor() {
        this.init();
    }
    
    /**
     * 初始化方法，获取当前密钥、访问令牌和服务器列表
     */
    async init() {
        this.currentKey = this.#getCurrentKey(); // 获取当前时间戳作为密钥
        this.accessToken = this.#getAccessToken(this.currentKey); // 根据密钥生成访问令牌
        this.servers = await this.#getCurrentApi(); // 获取当前可用的API服务器列表
    }
    
    /**
     * 获取当前时间戳作为密钥
     * @returns {number} 当前时间戳（秒级）
     */
    #getCurrentKey() {
        return Math.floor(Date.now() / 1000);
    }
    
    /**
     * 根据密钥生成访问令牌
     * @param {number} key - 时间戳密钥
     * @returns {Object} 包含token和tokenParam的对象
     */
    #getAccessToken(key) {
        return {
            token: crypto.calculateMD5(key + "185Hcomic3PAPP7R"), // 计算MD5哈希值作为token
            tokenParam: `${key},3.2.0`, // 包含时间戳和版本号的参数
        };
    }
    
    /**
     * 获取当前可用的API服务器列表
     * @returns {Promise<Array>} 服务器列表
     */
    async #getCurrentApi() {
        const resp = await this.retryFetch(
            "https://rup4a04-c02.tos-cn-hongkong.bytepluses.com/newsvr-2025.txt",
            1,
        );
        const text = await resp.text();
        return crypto.decryptCurrentApi(text).Server;
    }
    
    /**
     * 带重试机制的请求方法
     * @param {string|Function} getUrl - 请求URL或返回URL的函数
     * @param {Object} init - 请求配置对象
     * @param {number} count - 重试次数
     * @returns {Promise<Response>} 请求响应对象
     */
    async retryFetch(getUrl, init, count) {
        // 如果getUrl是字符串，则将其转换为返回该字符串的函数
        if (typeof getUrl === "string") {
            let url = getUrl;
            getUrl = () => url;
        }
        // 如果init是数字，则表示重试次数，将init设为空对象
        if (typeof init === "number") {
            count = init;
            init = {};
        }
        try {
            const resp = await fetch(getUrl(count - 1), init);
            return resp;
        } catch (error) {
            // 如果重试次数已用完，抛出错误
            if (count <= 0) throw new Error(error);
            // 否则递归调用retryFetch，减少重试次数
            return this.retryFetch(getUrl, init, count - 1);
        }
    }
    
    /**
     * 搜索漫画结果
     * @param {string} searchQuery - 搜索关键词
     * @param {number} page - 页码
     * @param {string} mode - 排序模式
     * @returns {Promise<Object>} 搜索结果数据
     */
    async getSearchResults(searchQuery, page, mode) {
        const searchResponse = await this.retryFetch(
            (i) =>
                `https://${this.servers[4 - i]}/search?search_query=${searchQuery}&o=${mode}&page=${page}`,
            {
                headers: {
                    token: this.accessToken.token,
                    tokenParam: this.accessToken.tokenParam,
                },
                redirect: "follow",
            },
            5,
        );
        const searchData = await searchResponse.json();
        return crypto.decryptData(this.currentKey, searchData.data);
    }
    
    /**
     * 获取最新内容
     * @param {number} page - 页码
     * @returns {Promise<Object>} 最新内容数据
     */
    async getLatestContent(page) {
        const latestResponse = await this.retryFetch(
            (i) => `https://${this.servers[4 - i]}/latest?page=${page}`,
            {
                headers: {
                    token: this.accessToken.token,
                    tokenParam: this.accessToken.tokenParam,
                },
                redirect: "follow",
            },
            5,
        );
        const latestData = await latestResponse.json();
        return crypto.decryptData(this.currentKey, latestData.data);
    }
    
    /**
     * 获取推广内容（带缓存机制）
     * @returns {Promise<Object>} 推广内容数据
     */
    async getPromotionContent() {
        // 尝试从本地存储中获取缓存的推广数据
        let cache = localStorage.getItem("promoteCache");
        if (cache) {
            cache = JSON.parse(cache);
            // 如果缓存日期是今天，则直接返回缓存数据
            if (cache.date === new Date().toDateString()) {
                return cache.data;
            }
        }
        const promotionResponse = await this.retryFetch(
            (i) => `https://${this.servers[4 - i]}/promote?page=1`,
            {
                headers: {
                    token: this.accessToken.token,
                    tokenParam: this.accessToken.tokenParam,
                },
                redirect: "follow",
            },
            5,
        );
        const promotionData = await promotionResponse.json();
        const data = crypto.decryptData(this.currentKey, promotionData.data);
        // 将数据保存到本地存储中，以日期为标识进行缓存
        localStorage.setItem(
            "promoteCache",
            JSON.stringify({
                date: new Date().toDateString(),
                data,
            }),
        );
        console.log(data);

        return data;
    }
    
    /**
     * 获取漫画专辑信息
     * @param {string|number} comicId - 漫画ID
     * @returns {Promise<Object>} 漫画专辑数据
     */
    async getComicAlbum(comicId) {
        const albumResponse = await this.retryFetch(
            (i) => `https://${this.servers[4 - i]}/album?id=${comicId}`,
            {
                headers: {
                    token: this.accessToken.token,
                    tokenParam: this.accessToken.tokenParam,
                },
                redirect: "follow",
            },
            5,
        );
        const albumData = await albumResponse.json();
        return crypto.decryptData(this.currentKey, albumData.data);
    }
    
    /**
     * 获取漫画章节信息
     * @param {string|number} comicId - 漫画ID
     * @returns {Promise<Object>} 漫画章节数据
     */
    async getComicChapter(comicId) {
        const chapterResponse = await this.retryFetch(
            (i) => `https://${this.servers[4 - i]}/chapter?id=${comicId}`,
            {
                headers: {
                    token: this.accessToken.token,
                    tokenParam: this.accessToken.tokenParam,
                },
                redirect: "follow",
            },
            5,
        );
        const chapterData = await chapterResponse.json();
        return crypto.decryptData(this.currentKey, chapterData.data);
    }
    
    /**
     * 获取漫画评论
     * @param {string|number} comicId - 漫画ID
     * @param {number} index - 评论页码
     * @returns {Promise<Array>} 漫画评论列表
     */
    async getComicComments(comicId, index) {
        const forumResponse = await this.retryFetch(
            (i) => `https://${this.servers[4-i]}/forum?page=${index}&mode=manhua&aid=${comicId}`,
            {
                headers: {
                    token: this.accessToken.token,
                    tokenParam: this.accessToken.tokenParam,
                },
                redirect: "follow",
            },
            5,
        );
        const forumData = await forumResponse.json();
        return crypto.decryptData(
            this.currentKey,
            forumData.data,
        ).list;
    }
    
    /**
     * 获取分类列表
     * @returns {Promise<Object>} 分类数据
     */
    async getCategories() {
        const forumResponse = await this.retryFetch(
            (i) => `https://${this.servers[4-i]}/categories`,
            {
                headers: {
                    token: this.accessToken.token,
                    tokenParam: this.accessToken.tokenParam,
                },
                redirect: "follow",
            },
            5,
        );
        const forumData = await forumResponse.json();
        return crypto.decryptData(
            this.currentKey,
            forumData.data,
        )
    }
    
    /**
     * 获取分类筛选结果
     * @param {string} category - 分类ID
     * @param {number} page - 页码
     * @param {string} order - 排序方式
     * @returns {Promise<Object>} 分类筛选结果
     */
    async getCategoriesFilter(category, page, order) {
        const forumResponse = await this.retryFetch(
            (i) => `https://${this.servers[4-i]}/categories/filter?page=${page}&c=${category}&o=${order}`,
            {
                headers: {
                    token: this.accessToken.token,
                    tokenParam: this.accessToken.tokenParam,
                },
                redirect: "follow",
            },
            5,
        );
        const forumData = await forumResponse.json();
        return crypto.decryptData(
            this.currentKey,
            forumData.data,
        )
    }
    
    /**
     * 获取用户头像URL
     * @param {string} path - 用户头像路径
     * @returns {string} 完整的用户头像URL
     */
    getUserPhotoURL(path) {
        return `https://${this.imgServers[setting.using_imgserver_index]}/media/users/${path}`
    }
    
    /**
     * 获取漫画封面图片URL
     * @param {string|number} id - 漫画ID
     * @returns {string} 完整的封面图片URL
     */
    getCoverImageURL(id) {
        return `https://${this.imgServers[id % 5]}/media/albums/${id}_3x4.jpg`;
    }
    
    /**
     * 获取漫画章节图片URL
     * @param {string|number} id - 章节ID
     * @param {string} pathName - 图片路径名
     * @returns {string} 完整的章节图片URL
     */
    getChapterImageURL(id, pathName) {
        return `https://${this.imgServers[setting.using_imgserver_index]}/media/photos/${id}/${pathName}`;
    }
}

// 创建并导出jmApi实例
export const jmApi = new JmcomicApi();
