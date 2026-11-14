import { cacheManager } from "../components/general/CacheManager.js";
import { setting } from "../components/general/Setting.js"; // 导入设置模块
import { crypto } from "./Crypto.js"; // 导入加密解密模块

/** 单次 #request 的总尝试次数（含第一次） */
const REQUEST_ATTEMPTS = 3;
/** 重试前的等待基数（毫秒），实际等待时间按第几次重试递增 */
const RETRY_DELAY = 400;
/** 重试时最多还试几条线路 */
const RETRY_SERVER_COUNT = 2;

/**
 * 禁漫天堂API类
 * 提供对禁漫天堂API的各种操作接口
 */
class JmcomicApi {
    /**
     * 访问令牌对象，包含 token 和 tokenParam
     * @type {{token: string, tokenParam: string}}
     */
    accessToken;
    /**
     * 当前时间戳密钥（秒级），同时用于请求头签名和解密响应
     * @type {number}
     */
    currentKey;
    /**
     * 当前可用的 API 服务器域名列表，由 init() 拉取
     * @type {string[]}
     */
    servers;
    /**
     * 图片服务器域名列表（写死在前端），用于拼接封面、章节图片、头像地址
     * @type {string[]}
     */
    imgServers = [
        "cdn-msp.jmapiproxy1.cc",
        "cdn-msp.jmapiproxy2.cc",
        "cdn-msp2.jmapiproxy2.cc",
        "cdn-msp3.jmapiproxy2.cc",
        "cdn-msp.jmapinodeudzn.net",
        "cdn-msp3.jmapinodeudzn.net",
    ];
    /**
     * 图片请求计数器，按次数在启用中的图片服务器之间轮换
     * @type {number}
     */
    imgCounts = 0;

    /**
     * 接口注册表
     * 用「路径 + 请求方法 + 表单字段」描述每个接口，
     * 调用时只要传参对象，#request 就会按 form 列表拼出查询串
     * @type {Object<string, {path: string, method: string, form?: string[]}>}
     */
    API = {
        /** 分类筛选列表：page 页码、c 分类标识、o 排序方式 */
        getCategoriesFilter: {
            path: "/categories/filter",
            method: "GET",
            form: ["page", "c", "o"],
        },
        /** 分类列表，返回全部分类项 */
        getCategories: {
            path: "/categories",
            method: "GET",
        },
        /** 漫画评论列表：page 页码、mode 评论类型、aid 漫画ID */
        getComicComments: {
            path: "/forum",
            method: "GET",
            form: ["page", "mode", "aid"],
        },
        /** 单个章节信息，id 为章节ID */
        getComicChapter: {
            path: "/chapter",
            method: "GET",
            form: ["id"],
        },
        /** 漫画（本子）详情，id 为漫画ID */
        getComicAlbum: {
            path: "/album",
            method: "GET",
            form: ["id"],
        },
        /** 首页推广位内容：page 页码 */
        getPromotionContent: {
            path: "/promote",
            method: "GET",
            form: ["page"],
        },
        /** 最新上架列表：page 页码 */
        getLatestContent: {
            path: "/latest",
            method: "GET",
            form: ["page"],
        },
        /** 搜索结果：search_query 关键词、o 排序方式、page 页码 */
        getSearchResults: {
            path: "/search",
            method: "GET",
            form: ["search_query", "o", "page"],
        },
    };
    /**
     * 初始化方法，获取当前密钥、访问令牌和服务器列表
     * 必须在调用其他接口前执行，且每次调用都会重新拉取一次服务器列表
     * @returns {Promise<void>}
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
    async #getCurrentApi(useCache = true) {
        if (useCache) {
            let cache = cacheManager.apiCache;
            if (cache && cache.date === new Date().toDateString()) {
                // 如果缓存日期是今天，则直接返回缓存数据
                return cache.data;
            }
        }
        const resp = await this.retryFetch(
            "https://rup4a04-c02.tos-cn-hongkong.bytepluses.com/newsvr-2025.txt",
            5,
        );
        const text = await resp.text();
        const servers = crypto.decryptCurrentApi(text).Server;
        cacheManager.setCache(
            "apiCache",
            {
                date: new Date().toDateString(),
                data: servers,
            },
        );
        return servers;
    }

    /**
     * 带重试机制的请求方法，两种调用形式：
     * 1. retryFetch(url, init, count) —— 固定 URL，每次重试都是同一个地址
     * 2. retryFetch(getUrl, count) —— getUrl(序号) 返回地址，可轮换不同服务器
     * @param {string|Function} getUrl - 请求URL，或接收序号返回URL的函数
     * @param {Object|number} init - 请求配置对象；传数字时视为重试次数
     * @param {number} [count] - 尝试次数（含第一次），序号从 count 递减到 1
     * @returns {Promise<Response>} 请求响应对象
     */
    async retryFetch(getUrl, init, count) {
        // 并发分支只对「按序号拼出不同服务器地址」的调用生效：
        // 传固定 URL 的调用（例如图片下载）每次重试都是同一个地址，并发没有意义
        const isMultiServer = typeof getUrl === "function";
        // 如果getUrl是字符串，则将其转换为返回该字符串的函数
        if (!isMultiServer) {
            const url = getUrl;
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
        // 序号统一从 0 开始：第 n 次尝试取 getUrl(count - n)，最后一次是 0
        try {
            const resp = await fetch(getUrl(count - 1), init);
            return resp;
        } catch (error) {
            if (error.name === "AbortError") {
                throw error;
            }
            // 如果重试次数已用完，抛出错误
            if (count <= 1) throw error;
            // 否则递归调用retryFetch，减少重试次数
            return this.retryFetch(getUrl, init, count - 1);
        }
    }

    /**
     * 并发请求：把所有候选服务器一次全发出去，取第一个成功返回的，其余立即取消
     * 尝试的序号与顺序重试分支完全一致（0 一路递增到 count-1），
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
        for (let i = 0; i < count; i++) {
            const controller = new AbortController();
            controllers.push(controller);
            attempts.push(
                fetch(getUrl(i), {
                    ...init,
                    signal: this.#combineSignals(init.signal, controller),
                }).then((response) => ({ index: i, response })),
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
            throw error?.errors?.[0] ?? error;
        }
    }

    /**
     * 组合外部 signal 与本次请求自己的 controller.signal，任一方 abort 即触发合并结果。
     * 不用 AbortSignal.any：移动端旧版 Safari（< 17.4）/ Android WebView（< 116）不支持，
     * 改用手动转发 abort 事件，保证并发请求在移动端也能正常取消。
     * @param {AbortSignal} [outerSignal] - 调用方传入的 signal，可为空
     * @param {AbortController} controller - 本次请求独立的 controller
     * @returns {AbortSignal} 合并后的 signal
     */
    #combineSignals(outerSignal, controller) {
        // 没有外部 signal 时，直接用本次请求的 controller.signal
        if (!outerSignal) return controller.signal;
        const combined = new AbortController();
        const forward = () => {
            if (!combined.signal.aborted) combined.abort();
        };
        // 外部 signal 可能已经 abort 过，需立刻生效
        if (outerSignal.aborted) {
            forward();
        } else {
            outerSignal.addEventListener("abort", forward, { once: true });
        }
        controller.signal.addEventListener("abort", forward, { once: true });
        return combined.signal;
    }

    /**
     * 带重试的请求。网络错误、HTTP 状态异常、JSON 解析失败、解密失败都会触发重试，
     * 每次重试前重新生成 token（token 由秒级时间戳算出，页面开久了会过期），
     * 并等待一小段时间再发，避免对着已经出问题的线路连打。
     * @param {{path: string, method: string, form?: string[]}} APIOptions - 接口注册表中的一项
     * @param {Object} [params={}] - 接口参数，只取 APIOptions.form 里列出的字段
     * @param {number} [count=5] - 单次尝试里 retryFetch 的服务器轮询次数
     * @returns {Promise<*>} 解密后的接口数据
     */
    async #request(APIOptions, params = {}, signal = null, count = 5) {
        let lastError;
        let searchParams = new URLSearchParams();
        for (const key of APIOptions.form || []) {
            searchParams.append(key, params[key]);
        }
        for (let attempt = 1; attempt <= REQUEST_ATTEMPTS; attempt++) {
            try {
                return await this.#requestOnce(
                    APIOptions,
                    searchParams.toString(),
                    count,
                    signal,
                );
            } catch (error) {
                lastError = error;
                if (attempt >= REQUEST_ATTEMPTS || !this.#isRetryable(error)) {
                    break;
                }
                await this.#sleep(RETRY_DELAY * attempt);
                await this.#refreshToken();
                // 第一次已经把每条线路都走过了，重试时只留少量线路确认是不是一时抽风
                count = Math.min(count, RETRY_SERVER_COUNT);
            }
        }
        throw lastError;
    }

    /**
     * 发一次请求并解析，不做重试
     * 按序号 i 取 this.servers[i % 长度] 拼出完整地址，请求头带上 token 与 tokenParam
     * @param {{path: string, method: string, form?: string[]}} APIOptions - 接口注册表中的一项
     * @param {string} searchParams - 已序列化的查询串
     * @param {number} count - retryFetch 的服务器轮询次数
     * @returns {Promise<*>} 解密后的接口数据
     */
    async #requestOnce(APIOptions, searchParams, count, signal = null) {
        const resp = await this.retryFetch(
            (i) => {
                return `https://${this.servers[i % this.servers.length] + APIOptions.path}?${searchParams}`;
            },
            {
                headers: {
                    token: this.accessToken.token,
                    tokenParam: this.accessToken.tokenParam,
                },
                method: APIOptions.method,
                redirect: "follow",
                signal,
            },
            count,
        );
        if (!resp.ok) {
            const error = new Error(
                `请求失败：HTTP ${resp.status} ${resp.statusText}`,
            );
            error.status = resp.status;
            throw error;
        }
        const data = await resp.json();
        return crypto.decryptData(this.currentKey, data.data);
    }

    /**
     * 判断这次失败值不值得重试
     * @param {Error & {status?: number}} error - 上一次失败的原因
     * @returns {boolean} 没有 status 的是网络错误、解析失败、解密失败，都可能只是一时运气不好
     */
    #isRetryable(error) {
        if (error?.status === undefined) return true;
        // 5xx 是服务端一时抽风；4xx 里只有鉴权过期和限流可能是暂时的，404/400 重试也没用
        return error.status >= 500 || [401, 403, 429].includes(error.status);
    }

    /**
     * 用当前时间戳重新生成 token，重试前调用
     */
    async #refreshToken() {
        this.currentKey = this.#getCurrentKey();
        this.accessToken = this.#getAccessToken(this.currentKey);
        this.servers = await this.#getCurrentApi(false);
    }

    /**
     * 等待指定毫秒数
     * @param {number} ms - 毫秒
     * @returns {Promise<void>}
     */
    #sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    /**
     * 搜索漫画
     * @param {string} searchQuery - 搜索关键词
     * @param {number} page - 页码，从 1 开始
     * @param {string} mode - 排序方式（接口参数 o）
     * @returns {Promise<{total: number, content: Array}>} 搜索结果，total 用于算总页数
     */
    async getSearchResults(searchQuery, page, mode, signal = null) {
        return this.#request(
            this.API.getSearchResults,
            {
                search_query: searchQuery,
                page,
                o: mode,
            },
            signal,
        );
    }

    /**
     * 获取最新上架漫画列表
     * @param {number} page - 页码
     * @returns {Promise<Array>} 列表数据
     */
    async getLatestContent(page) {
        return this.#request(this.API.getLatestContent, {
            page,
        });
    }

    /**
     * 获取首页推广内容（带按天缓存，同一天内只请求一次）
     * @returns {Promise<*>} 推广位数据
     */
    async getPromotionContent() {
        // 尝试从本地存储中获取缓存的推广数据
        let cache = cacheManager.promoteCache;
        if (cache && cache.date === new Date().toDateString()) {
            // 如果缓存日期是今天，则直接返回缓存数据
            return cache.data;
        }
        const data = await this.#request(this.API.getPromotionContent, {
            page: 1,
        });
        // 将数据保存到本地存储中，以日期为标识进行缓存
        cacheManager.setCache(
            "promoteCache",
            {
                date: new Date().toDateString(),
                data,
            },
        );

        return data;
    }

    /**
     * 获取漫画（本子）详情
     * @param {string|number} comicId - 漫画ID
     * @returns {Promise<Object>} 漫画详情，包含 id、series、chapter 等字段
     */
    async getComicAlbum(comicId) {
        return this.#request(this.API.getComicAlbum, {
            id: comicId,
        });
    }

    /**
     * 获取单个章节信息
     * @param {string|number} comicId - 章节ID
     * @returns {Promise<Object>} 章节信息，包含图片列表等字段
     */
    async getComicChapter(comicId) {
        return this.#request(this.API.getComicChapter, {
            id: comicId,
        });
    }

    /**
     * 获取漫画评论列表（固定按 manhua 模式请求）
     * @param {string|number} comicId - 漫画ID
     * @param {number} [page=1] - 页码
     * @returns {Promise<Object>} 评论数据，包含 list、total 等字段
     */
    async getComicComments(comicId, page = 1, signal = null) {
        return this.#request(
            this.API.getComicComments,
            {
                page,
                mode: "manhua",
                aid: comicId,
            },
            signal,
        );
    }

    /**
     * 获取全部分类
     * @returns {Promise<Object>} 分类数据
     */
    async getCategories() {
        return this.#request(this.API.getCategories);
    }

    /**
     * 按分类筛选漫画
     * @param {string} category - 分类标识（slug）
     * @param {number} page - 页码
     * @param {string} order - 排序方式（接口参数 o）
     * @returns {Promise<{total: number, content: Array}>} 筛选结果
     */
    async getCategoriesFilter(category, page, order, signal = null) {
        return this.#request(
            this.API.getCategoriesFilter,
            {
                page,
                c: category,
                o: order,
            },
            signal,
        );
    }

    /**
     * 获取用户头像URL
     * @param {string} path - 头像相对路径
     * @returns {string} 完整头像地址（使用启用列表中的第一个图片服务器）
     */
    getUserPhotoURL(path) {
        return `https://${this.imgServers[setting.using_imgserver_index[0]]}/media/users/${path}`;
    }

    /**
     * 获取漫画封面图片URL
     * dynamic 模式下按漫画ID散列到不同图片服务器（分散压力），
     * 否则固定用第 5 号服务器；加载失败时由调用方传入更大的 retryCount 换下一台
     * @param {string|number} id - 漫画ID
     * @param {number} [retryCount=0] - 已重试次数，用于切换图片服务器
     * @returns {string} 完整的封面图片URL
     */
    getCoverImageURL(id, retryCount = 0) {
        if (setting.isImgModeDynamic) {
            return `https://${this.imgServers[(Number(id) + retryCount) % this.imgServers.length]}/media/albums/${id}_3x4.jpg`;
        }

        return `https://${this.imgServers[(5 + retryCount) % this.imgServers.length]}/media/albums/${id}_3x4.jpg`;
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
     * 获取漫画章节图片URL（在设置里启用的图片服务器之间轮换）
     * 每次调用都会自增计数器，让连续的图片尽量落在不同服务器上
     * @param {string|number} id - 章节ID
     * @param {string} pathName - 图片路径名
     * @returns {string} 完整的章节图片URL
     */
    getChapterImageURL(id, pathName) {
        this.imgCounts++;
        return this.getChapterImageURLByServer(
            setting.using_imgserver_index[
                this.imgCounts % setting.using_imgserver_index.length
            ],
            id,
            pathName,
        );
    }
}

// 创建并导出jmApi实例
export const jmApi = new JmcomicApi();