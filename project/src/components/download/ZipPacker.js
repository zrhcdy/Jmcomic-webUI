/**
 * 图片本身就已经是压缩格式了（jpg/png/gif…），再用 deflate 压一遍基本一点也压不小，
 * 只会白白吃掉大量 CPU 和内存，所以这些文件直接原样存进压缩包（STORE）。
 * 只有其它格式才交给 deflate 去压。
 */
const PRECOMPRESSED = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".bmp"];
/** 还原后的图片重新编码成 jpeg 时的质量 */
const IMAGE_QUALITY = 0.92;

/** 用 JSZip 把一堆图片打成一个压缩包 */
export class ZipPacker {
    #zip = null;
    #count = 0;

    /** 页面上的 JSZip 有没有加载成功 */
    static isAvailable() {
        return typeof window.JSZip === "function";
    }

    /** 已经放进压缩包的图片数量 */
    get count() {
        return this.#count;
    }

    /**
     * 直接放一份原始数据进压缩包
     * @param {string} path 在压缩包里的路径
     * @param {Blob} blob 数据
     * @param {string} fileName 用来判断要不要 deflate 的文件名
     */
    addBlob(path, blob, fileName) {
        this.#ensure().file(path, blob, { compression: this.#compressionOf(fileName) });
        this.#count++;
    }

    /**
     * 把还原后的 canvas 编码成 jpeg 再放进压缩包
     * @param {string} path 在压缩包里的路径
     * @param {HTMLCanvasElement} canvas 还原后的图片
     * @param {string} fileName 用来判断要不要 deflate 的文件名
     */
    async addCanvas(path, canvas, fileName) {
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", IMAGE_QUALITY));
        if (!blob) throw new Error("图片导出失败：浏览器分配不出 canvas");
        this.addBlob(path, blob, fileName);
    }

    /**
     * 生成压缩包
     * @param {(percent:number)=>void} [onProgress] 打包进度 0~100
     * @returns {Promise<Blob>}
     */
    async generate(onProgress) {
        return await this.#ensure().generateAsync(
            // streamFiles 尽量流式地生成，整包漫画很大，能省一点内存是一点
            { type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 }, streamFiles: true },
            (meta) => onProgress?.(meta.percent),
        );
    }

    #ensure() {
        if (this.#zip) return this.#zip;
        if (!ZipPacker.isAvailable()) throw new Error("JSZip 没有加载成功，无法打包成 zip");
        this.#zip = new window.JSZip();
        return this.#zip;
    }

    #compressionOf(fileName) {
        const name = String(fileName).toLowerCase();
        return PRECOMPRESSED.some((extension) => name.endsWith(extension)) ? "STORE" : "DEFLATE";
    }
}
