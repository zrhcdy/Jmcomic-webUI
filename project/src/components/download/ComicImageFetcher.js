import { jmApi } from "../../api/JmcomicApi.js";
import { ImageCutter } from "../general/ImageCutter.js";

/**
 * 判断一张图片有没有被站点的切割算法打乱过。
 * 判定条件和章节页渲染时完全一致（ComicImageLoader.js）：
 * 只有章节 id >= 220980 且不是 gif 的图片才被打乱过，
 * 老章节和 gif 的原图本来就是对的，不需要还原。
 * @param {string|number} chapterId 章节 id
 * @param {string} pathName 图片路径名
 * @returns {boolean}
 */
export function isScrambled(chapterId, pathName) {
    return Number(chapterId) >= 220980 && !String(pathName).endsWith(".gif");
}

/**
 * 只读一下图片的尺寸，读完立刻释放解码结果。
 * 用来在真正拼长图之前把每一段的高度算准，
 * 免得先开一张超高的 canvas 再把大半裁掉，白白吃内存。
 * @param {Blob} blob 图片数据
 * @returns {Promise<{width:number,height:number}>}
 */
export async function readImageSize(blob) {
    const bitmap = await createImageBitmap(blob);
    try {
        return { width: bitmap.width, height: bitmap.height };
    } finally {
        bitmap.close();
    }
}

/** 把图源上的图片取回来，并在需要时还原成原图 */
export class ComicImageFetcher {
    #cutter = new ImageCutter();

    /**
     * 下载一张图片的原始数据
     * @param {string|number} chapterId 章节 id
     * @param {string} pathName 图片路径名
     * @returns {Promise<Blob>}
     */
    async download(chapterId, pathName) {
        const url = jmApi.getChapterImageURL(chapterId, pathName);
        const response = await jmApi.retryFetch(url, 3);
        if (!response.ok) throw new Error(`图片下载失败（HTTP ${response.status}）：${pathName}`);
        return await response.blob();
    }

    /**
     * 把已经拿到的图片数据还原成原图
     * @param {Blob} blob 图片数据
     * @param {string|number} chapterId 章节 id
     * @param {string} pathName 图片路径名
     * @returns {Promise<HTMLCanvasElement>}
     */
    async decode(blob, chapterId, pathName) {
        // 用 fetch 拿到数据再用 objectURL 喂给 <img>，而不是让 <img> 直接去请求图床：
        // 这样图片一定是同源的，画进 canvas 不会被 taint，后面才导得出来
        const objectURL = URL.createObjectURL(blob);
        try {
            const image = await new Promise((resolve, reject) => {
                const element = new Image();
                element.onload = () => resolve(element);
                element.onerror = () => reject(new Error(`图片解码失败：${pathName}`));
                element.src = objectURL;
            });
            return isScrambled(chapterId, pathName)
                ? this.#cutter.cutImage(image, chapterId, pathName)
                : this.#drawToCanvas(image);
        } finally {
            // 像素这时候已经在 canvas 里了，回收 objectURL 是安全的
            URL.revokeObjectURL(objectURL);
        }
    }

    #drawToCanvas(image) {
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        canvas.getContext("2d").drawImage(image, 0, 0);
        return canvas;
    }
}
