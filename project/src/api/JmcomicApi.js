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
        // 并发分支只对「按序号拼出不同服务器地址」的调用生效：
        // 传固定 URL 的调用（例如图片下载）每次重试都是同一个地址，并发没有意义
        const isMultiServer = typeof getUrl === "function";
        // 如果getUrl是字符串，则将其转换为返回该字符串的函数
        if (!isMultiServer) {
            let url = getUrl;
            getUrl = () => url;
        }
        // 如果init是数字，则表示重试次数，将init设为空对象
        if (typeof init === "number") {
            count = init;
            init = {};
        }
        // 并发模式：同时请求所有服务器，谁先回来用谁，其余的立刻取消
        if (isMultiServer && count > 1 && setting.concurrent_request === "on") {
            return this.#concurrentFetch(getUrl, init, count);
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
     * 并发请求：把所有候选服务器一次全发出去，取第一个成功返回的，其余立即取消
     * 尝试的序号与顺序重试分支完全一致（count-1 一路递减到 -1），
     * 区别只是从「一个失败再试下一个」变成「同时发出、取最快的那个」
     * @param {Function} getUrl - 接收序号返回URL的函数
     * @param {Object} init - 请求配置对象
     * @param {number} count - 尝试次数
     * @returns {Promise<Response>} 最先成功返回的响应对象
     */
    async #concurrentFetch(getUrl, init, count) {
        const controllers = [];
        const attempts = [];
        // 每个请求单独配一个 AbortController，只取消没赢的那些，赢家的响应体还要读
        for (let i = count - 1; i >= -1; i--) {
            const index = controllers.length;
            const controller = new AbortController();
            controllers.push(controller);
            attempts.push(
                fetch(getUrl(i), { ...init, signal: controller.signal }).then(
                    (response) => ({ index, response }),
                ),
            );
        }
        try {
            // Promise.any 只在全部失败时才会 reject，任何一个成功都会立刻返回
            const winner = await Promise.any(attempts);
            controllers.forEach((controller, i) => {
                if (i !== winner.index) controller.abort();
            });
            return winner.response;
        } catch (error) {
            // 全部失败：抛出第一条失败原因，报错信息和顺序分支保持一致
            throw new Error(error?.errors?.[0] ?? error);
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
                `https://${this.servers[4 - (i%4)]}/search?search_query=${searchQuery}&o=${mode}&page=${page}`,
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
            (i) => `https://${this.servers[4 - (i%4)]}/latest?page=${page}`,
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
            (i) => `https://${this.servers[4 - (i%4)]}/promote?page=1`,
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
            (i) => `https://${this.servers[4 - (i%4)]}/album?id=${comicId}`,
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
            (i) => `https://${this.servers[4 - (i%4)]}/chapter?id=${comicId}`,
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
            (i) => `https://${this.servers[4 - (i%4)]}/forum?page=${index}&mode=manhua&aid=${comicId}`,
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
            (i) => `https://${this.servers[4 - (i%4)]}/categories`,
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
            (i) => `https://${this.servers[4 - (i%4)]}/categories/filter?page=${page}&c=${category}&o=${order}`,
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
    getCoverImageURL(id, retryCount=0) {
        return `https://${this.imgServers[(id + retryCount) % 5]}/media/albums/${id}_3x4.jpg`;
    }
    
    /**
     * 获取漫画章节图片URL（指定图片服务器）
     * 章节图片的地址模板只在这里出现一次，测速时换服务器也用这个方法拼地址
     * @param {number|string} serverIndex - 图片服务器索引
     * @param {string|number} id - 章节ID
     * @param {string} pathName - 图片路径名
     * @returns {string} 完整的章节图片URL
     */
    getChapterImageURLByServer(serverIndex, id, pathName) {
        return `https://${this.imgServers[serverIndex]}/media/photos/${id}/${pathName}`;
    }

    /**
     * 获取漫画章节图片URL
     * @param {string|number} id - 章节ID
     * @param {string} pathName - 图片路径名
     * @returns {string} 完整的章节图片URL
     */
    getChapterImageURL(id, pathName) {
        return this.getChapterImageURLByServer(setting.using_imgserver_index, id, pathName);
    }
}

// 创建并导出jmApi实例
export const jmApi = new JmcomicApi();
