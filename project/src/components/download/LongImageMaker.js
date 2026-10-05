/**
 * 浏览器 canvas 的尺寸上限。
 * 各浏览器限制不太一样（Chrome 单边能到 65535、但整块面积上限约 16384×16384，
 * Firefox 单边只有 32767），这里取最保守的一档，
 * 免得算出来的长图在某些浏览器上直接变成空白。
 */
export const MAX_CANVAS_DIMENSION = 32767;
export const MAX_CANVAS_AREA = 16384 * 16384;

/**
 * 把一章的图片从上到下排成若干张长图。
 * 这里只做排版、不碰像素：先把分段算清楚，
 * 之后每张 canvas 才能按实际高度精确分配，不用先开一张超高的再裁掉大半。
 * @param {{width:number,height:number}[]} sizes 每张图的原始尺寸，顺序就是从上到下
 * @param {number} width 长图统一用的宽度（一般取本章第一张图的宽度）
 * @returns {{height:number,slices:{index:number,sy:number,sh:number,dy:number,dh:number}[]}[]}
 */
export function layoutLongImage(sizes, width) {
    const parts = [];
    if (!sizes.length || !width) return parts;
    const maxHeight = Math.min(MAX_CANVAS_DIMENSION, Math.floor(MAX_CANVAS_AREA / width));
    let part = { height: 0, slices: [] };
    // 当前这张长图里有内容就存下来，然后开一张新的
    const nextPart = () => {
        if (part.slices.length) parts.push(part);
        part = { height: 0, slices: [] };
    };
    sizes.forEach((size, index) => {
        // 尺寸异常的图片直接跳过，免得后面算出一堆 NaN
        if (!size.width || !size.height) return;
        // 同一章里图片宽度不一致时统一缩放到相同宽度，避免长图里左右错位
        const scale = width / size.width;
        const drawHeight = Math.max(1, Math.round(size.height * scale));
        let sy = 0;
        while (sy < drawHeight) {
            // 当前这张已经画满了就换下一张；单张图比一张长图还高时也会走到这里
            if (part.height >= maxHeight) nextPart();
            const slice = Math.min(maxHeight - part.height, drawHeight - sy);
            part.slices.push({
                index,
                sy: sy / scale,
                sh: slice / scale,
                dy: part.height,
                dh: slice,
            });
            part.height += slice;
            sy += slice;
        }
    });
    nextPart();
    return parts;
}

/** 按分段表把图片拼成一张长图，并导出成 jpeg */
export class LongImageRenderer {
    #width;
    #quality;

    /**
     * @param {number} width 长图宽度
     * @param {number} quality jpeg 质量，长图普遍很大，稍微降一点质量能省下可观的体积
     */
    constructor(width, quality = 0.95) {
        this.#width = width;
        this.#quality = quality;
    }

    /**
     * 渲染一张长图
     * @param {{height:number,slices:object[]}} part layoutLongImage 产出的一段
     * @param {(index:number)=>Promise<HTMLCanvasElement>} getCanvas 按需取还原好的图片
     * @returns {Promise<Blob>} jpeg 数据
     */
    async render(part, getCanvas) {
        const canvas = document.createElement("canvas");
        canvas.width = this.#width;
        canvas.height = part.height;
        const context = canvas.getContext("2d");
        // jpeg 不支持透明，先铺一层白底，图片没盖满的地方才不会是黑的
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        let current = null;
        let currentIndex = -1;
        for (const slice of part.slices) {
            // 一张图在同一段里只会连续出现，换图的时候才需要重新解码，
            // 于是任何时刻内存里只有一张原图加一张长图
            if (slice.index !== currentIndex) {
                current = await getCanvas(slice.index);
                currentIndex = slice.index;
            }
            context.drawImage(
                current,
                0,
                slice.sy,
                current.width,
                slice.sh,
                0,
                slice.dy,
                this.#width,
                slice.dh,
            );
        }
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", this.#quality));
        // 长图非常占内存，导完立刻把 canvas 释放掉
        canvas.width = 0;
        canvas.height = 0;
        if (!blob) throw new Error("长图导出失败：图片太大，浏览器分配不出 canvas");
        return blob;
    }
}
