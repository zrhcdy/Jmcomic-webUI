import { crypto } from "../../api/Crypto.js";

export class ImageCutter {
    constructor() {}
    cutImage(image, id, path) {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const sliceCount = this.#getCuttingCount(id, path.substring(0,5));
        const sliceHeight = Math.floor(canvas.height / sliceCount);
        const remainingHeight = canvas.height % sliceCount;

        context.drawImage(
            image,
            0,
            canvas.height - sliceHeight - remainingHeight,
            canvas.width,
            sliceHeight + remainingHeight,
            0,
            0,
            canvas.width,
            sliceHeight + remainingHeight,
        );
        for (let i = 0; i < sliceCount - 1; i++) {
            context.drawImage(
                image,
                0,
                sliceHeight * (sliceCount - i - 2),
                canvas.width,
                sliceHeight,
                0,
                (i + 1) * sliceHeight + remainingHeight,
                canvas.width,
                sliceHeight,
            );
        }
        return canvas
    }
    #getCuttingCount(id, path) {
        if (id >= 220980 && id < 268850) {
            return 10;
        }
        const hashData = crypto.calculateMD5(id + path);
        let key = hashData.charCodeAt(hashData.length - 1);
        if (id >= 268850 && id <= 421925) {
            key = key % 10;
        } else {
            key = key % 8;
        }
        if (key >= 0 && key <= 9) {
            return key * 2 + 2;
        } else {
            return 10;
        }
    }
}
