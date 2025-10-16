/**
 * Utilidad para comprimir y redimensionar imágenes
 */
export class ImageCompressor {
  /**
   * Comprime una imagen redimensionándola y reduciendo su calidad
   * @param file Archivo de imagen a comprimir
   * @param maxWidth Ancho máximo de la imagen (default: 800)
   * @param quality Calidad de compresión JPEG de 0 a 1 (default: 0.7)
   * @returns Promise con la imagen en formato base64
   */
  static compressImage(
    file: File,
    maxWidth: number = 800,
    quality: number = 0.7
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e: ProgressEvent<FileReader>) => {
        const img = new Image();

        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('No se pudo obtener el contexto del canvas'));
            return;
          }

          // Calcular nuevas dimensiones manteniendo la proporción
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          // Establecer dimensiones del canvas
          canvas.width = width;
          canvas.height = height;

          // Dibujar la imagen redimensionada
          ctx.drawImage(img, 0, 0, width, height);

          // Convertir a base64 con compresión
          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedBase64);
        };

        img.onerror = () => reject(new Error('Error al cargar la imagen'));
        img.src = e.target?.result as string;
      };

      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Valida que un archivo sea una imagen válida
   * @param file Archivo a validar
   * @param maxSizeMB Tamaño máximo en MB (default: 5)
   * @returns Objeto con resultado de validación
   */
  static validateImage(
    file: File,
    maxSizeMB: number = 5
  ): {
    isValid: boolean;
    error?: string;
  } {
    // Verificar que sea una imagen
    if (!file.type.startsWith('image/')) {
      return {
        isValid: false,
        error: 'El archivo debe ser una imagen',
      };
    }

    // Verificar tamaño
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        isValid: false,
        error: `La imagen no debe superar los ${maxSizeMB}MB`,
      };
    }

    return { isValid: true };
  }
}
