import type { IFileError, IFileErrorTypes, IFileRejection } from "@/interfaces";

/**
 * Dosya doğrulama işlevi.
 * Belirli bir doğrulama kodu için dosyanın koşulunu kontrol eder ve geçerli bir hata mesajı döner.
 *
 * @param {Object} params - Parametreler
 * @param {IFileErrorTypes} params.validationCode - Doğrulama kodu (örneğin, "file-invalid-type")
 * @param {boolean} params.condition - Doğrulama koşulu (koşul doğruysa hata mesajı döner)
 * @param {IFileError[] | undefined} params.messages - Geçerli hata mesajları dizisi
 * @returns {IFileError | null} - Geçerli hata mesajı veya null
 */
const validateFile = ({
	validationCode,
	condition,
	messages,
}: { validationCode: IFileErrorTypes; condition: boolean; messages?: IFileError[] }) => {
	const validation = messages?.find((validation) => validation.code === validationCode);
	return validation && !condition ? validation : null;
};

/**
 * Dosyaları doğrulayan ana doğrulama işlevi.
 * Her dosya için, verilen dosya doğrulama koşullarına göre hata mesajları döndürür.
 *
 * @param {Object} params - Parametreler
 * @param {File[]} params.files - Doğrulanacak dosyalar
 * @param {IFileError[] | undefined} params.messages - Hata mesajları dizisi
 * @param {number} [params.maxFiles] - Maksimum dosya sayısı (isteğe bağlı)
 * @param {number} [params.maxSize] - Maksimum dosya boyutu (isteğe bağlı)
 * @param {number} [params.minSize] - Minimum dosya boyutu (isteğe bağlı)
 * @param {string[] | undefined} params.acceptedFormats - Kabul edilen dosya formatları
 * @returns {IFileRejection[]} - Reddedilen dosyalar ve hata mesajları dizisi
 */
export const validator = ({
	files,
	messages,
	maxFiles,
	maxSize,
	minSize,
	acceptedFormats,
}: {
	files: File[];
	messages?: IFileError[];
	maxSize?: number;
	minSize?: number;
	maxFiles?: number;
	acceptedFormats?: string[];
}): IFileRejection[] =>
	// Dosyalar üzerinde iterasyon yaparak her dosya için doğrulama işlemi yapıyoruz
	files.reduce((rejections, file) => {
		const fileRejections: IFileError[] = [
			// Her dosya için ilgili doğrulama koşullarını kontrol ediyoruz
			validateFile({ validationCode: "too-many-files", condition: !maxFiles || files.length <= maxFiles, messages }),
			validateFile({
				validationCode: "file-invalid-type",
				condition: acceptedFormats
					? acceptedFormats.some((format) => (format.startsWith(".") ? file.name.endsWith(format) : file.type.startsWith(format)))
					: true,
				messages,
			}),
			validateFile({ validationCode: "file-too-large", condition: !maxSize || file.size <= maxSize, messages }),
			validateFile({ validationCode: "file-too-small", condition: !minSize || file.size >= minSize, messages }),
		].filter((rejection) => rejection !== null); // Null olmayan hataları filtrele

		// Eğer dosyada herhangi bir hata mesajı varsa, reddedilen dosyalar listesine ekle
		if (fileRejections.length === 0) return rejections;

		rejections.push({ file, error: fileRejections });
		return rejections;
	}, [] as IFileRejection[]); // Sonuç olarak reddedilen dosyalar ve hata mesajlarını döner
