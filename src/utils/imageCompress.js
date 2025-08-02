export async function compressImageFile(file, maxWidth = 1000, quality = 0.5) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);

    image.onload = () => {
      let width = image.width;
      let height = image.height;

      // 가로 최대 크기 제한
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Compression failed"));
            return;
          }
          const compressedFile = new File([blob], file.name, { type: blob.type });
          resolve(compressedFile);
          URL.revokeObjectURL(url);
        },
        file.type,
        quality
      );
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image load error"));
    };

    image.src = url;
  });
}
