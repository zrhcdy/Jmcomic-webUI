import { jmApi } from "../../api/JmcomicApi.js";

/**
 * 测速统一使用这一张图：所有服务器比的是同一份资源，结果才有可比性
 * 1479091 是章节ID，00001.webp 是该章节里的第一张图
 */
export const TEST_IMAGE_ID = 1479091;
export const TEST_IMAGE_PATH = "00001.webp";

/** 单台服务器的超时时间，超过就认为这台不可用 */
const TIMEOUT = 8000;

/** 用来顶掉尚未完成的图片请求（换 src 会让浏览器放弃上一次加载） */
const EMPTY_IMAGE =
    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

/**
 * 图片服务器测速：同时向所有图片服务器请求同一张图，记录各自加载耗时
 *
 * 用 <img> 而不是 fetch 是有意的：
 * 1. 图床不一定返回 CORS 头，用 fetch 会因为跨域被浏览器拦下报错，
 *    可图片本身其实加载得动 —— 那测出来的就是「能不能跨域」而不是「快不快」
 * 2. <img> 加载不受同源策略限制，量到的正好是「这张图多久能显示出来」
 */
export class ServerSpeedTester {
    /**
     * 测试所有图片服务器
     * @param {(result: Object) => void} [onResult] 每台服务器出结果就回调一次，用于实时刷新界面
     * @returns {Promise<Array>} 每台服务器的结果 { index, success, time, error }
     */
    async test(onResult) {
        const tasks = [];
        for (let index = 0; index < jmApi.imgServers.length; index++) {
            tasks.push(
                this.#testOne(index).then((result) => {
                    onResult?.(result);
                    return result;
                }),
            );
        }
        // 每台服务器的结果都在 #testOne 里兜住了异常，所以这里不会 reject
        return Promise.all(tasks);
    }

    /**
     * 测一台服务器：图片加载完（加载 + 解码）才停表
     * @param {number} index 图片服务器索引
     * @returns {Promise<Object>} { index, success, time, error }
     */
    #testOne(index) {
        const base = jmApi.getChapterImageURLByServer(
            index,
            TEST_IMAGE_ID,
            TEST_IMAGE_PATH,
        );
        // 避免缓存：给地址挂一个每次都不同的查询参数，浏览器与中间的 CDN
        // 都会把它当成一张全新的图，不会拿旧的出来应付
        const url = `${base}${base.includes("?") ? "&" : "?"}_t=${Date.now()}_${index}`;
        const start = performance.now();

        return new Promise((resolve) => {
            const img = new Image();
            const done = (result) => {
                clearTimeout(timer);
                img.onload = null;
                img.onerror = null;
                resolve(result);
            };
            const timer = setTimeout(() => {
                // 换成一个空图，让浏览器放弃这次请求
                img.src = EMPTY_IMAGE;
                done({ index, success: false, time: null, error: "超时" });
            }, TIMEOUT);

            img.onload = () => {
                done({
                    index,
                    success: true,
                    time: performance.now() - start,
                    error: null,
                });
            };
            img.onerror = () => {
                done({ index, success: false, time: null, error: "加载失败" });
            };
            img.src = url;
        });
    }
}
