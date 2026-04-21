/**
 * 拍照 → 压缩 → 图像增强 → base64 data URL
 * 增强策略：缩放到 1280 以内 + 对比度 + unsharp mask，优化手写体 OCR 准确率
 */

export async function compressAndEnhanceImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 1280;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
          else { width = Math.round(width * MAX / height); height = MAX; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("无法创建 canvas 上下文"));
        ctx.drawImage(img, 0, 0, width, height);

        // 增强对比度（factor 1.4）
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const factor = 1.4;
        const intercept = 128 * (1 - factor);
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, Math.max(0, data[i] * factor + intercept));
          data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * factor + intercept));
          data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * factor + intercept));
        }
        ctx.putImageData(imageData, 0, 0);

        // Unsharp mask
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext("2d");
        if (!tempCtx) return resolve(canvas.toDataURL("image/jpeg", 0.85));
        tempCtx.filter = "blur(1px)";
        tempCtx.drawImage(canvas, 0, 0);
        const blurred = tempCtx.getImageData(0, 0, width, height);
        const sharp = ctx.getImageData(0, 0, width, height);
        const amount = 0.5;
        for (let i = 0; i < sharp.data.length; i += 4) {
          sharp.data[i] = Math.min(255, Math.max(0, sharp.data[i] + amount * (sharp.data[i] - blurred.data[i])));
          sharp.data[i + 1] = Math.min(255, Math.max(0, sharp.data[i + 1] + amount * (sharp.data[i + 1] - blurred.data[i + 1])));
          sharp.data[i + 2] = Math.min(255, Math.max(0, sharp.data[i + 2] + amount * (sharp.data[i + 2] - blurred.data[i + 2])));
        }
        ctx.putImageData(sharp, 0, 0);

        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = () => reject(new Error("图片加载失败"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("文件读取失败"));
    reader.readAsDataURL(file);
  });
}
