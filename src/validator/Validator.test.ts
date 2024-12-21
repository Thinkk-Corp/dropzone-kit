import type { IFileError } from "@/Interfaces";
import { validator } from "@/validator/Validator";

/**
 * Dosya doğrulayıcı testleri
 */
describe("validator", () => {
	/**
	 * Testler için hata mesajlarını tanımlayan dizi
	 */
	const messages: IFileError[] = [
		{ code: "too-many-files", message: "Too many files" },
		{ code: "file-invalid-type", message: "Invalid file type" },
		{ code: "file-too-large", message: "File is too large" },
		{ code: "file-too-small", message: "File is too small" },
	];

	/**
	 * Test dosyaları oluşturmak için yardımcı fonksiyon
	 * @param name - Dosya adı
	 * @param size - Dosya boyutu (byte cinsinden)
	 * @param type - Dosya türü (MIME tipi)
	 * @returns Oluşturulan File nesnesi
	 */
	const createFile = (name: string, size: number, type: string): File =>
		new File([new Array(size).fill("a").join("")], name, { type });

	/**
	 * Herhangi bir kısıtlama ihlal edilmediğinde doğrulamanın başarılı olduğunu test eder.
	 */
	it("should validate files successfully when no constraints are violated", () => {
		const files = [createFile("file1.txt", 1000, "text/plain"), createFile("file2.jpg", 2000, "image/jpeg")];

		const result = validator({ files, messages });
		expect(result).toEqual([]);
	});

	/**
	 * Maksimum dosya sayısı limitini aşan dosyaları reddeder.
	 */
	it("should reject files exceeding the maxFiles limit", () => {
		const files = [createFile("file1.txt", 1000, "text/plain"), createFile("file2.txt", 1000, "text/plain")];

		const result = validator({ files, messages, maxFiles: 1 });

		expect(result).toHaveLength(2);
		expect(result[0].error[0]).toEqual(messages.find((m) => m.code === "too-many-files"));
	});

	/**
	 * Geçersiz türdeki dosyaları reddeder.
	 */
	it("should reject files with invalid types", () => {
		const files = [createFile("file1.exe", 1000, "application/octet-stream"), createFile("file2.txt", 1000, "text/plain")];

		const result = validator({ files, messages, acceptedFormats: ["text/plain"] });

		expect(result).toHaveLength(1);
		expect(result[0].file.name).toBe("file1.exe");
		expect(result[0].error[0]).toEqual(messages.find((m) => m.code === "file-invalid-type"));
	});

	/**
	 * Çok büyük olan dosyaları reddeder.
	 */
	it("should reject files that are too large", () => {
		const files = [createFile("file1.txt", 3000, "text/plain")];

		const result = validator({ files, messages, maxSize: 2000 });

		expect(result).toHaveLength(1);
		expect(result[0].error[0]).toEqual(messages.find((m) => m.code === "file-too-large"));
	});

	/**
	 * Çok küçük olan dosyaları reddeder.
	 */
	it("should reject files that are too small", () => {
		const files = [createFile("file1.txt", 500, "text/plain")];

		const result = validator({ files, messages, minSize: 1000 });

		expect(result).toHaveLength(1);
		expect(result[0].error[0]).toEqual(messages.find((m) => m.code === "file-too-small"));
	});

	/**
	 * Birden fazla doğrulama hatası içeren dosyaları reddeder.
	 */
	it("should reject files for multiple validation errors", () => {
		const files = [createFile("file1.exe", 3000, "application/octet-stream")];

		const result = validator({
			files,
			messages,
			maxSize: 2000,
			acceptedFormats: ["text/plain"],
		});

		expect(result).toHaveLength(1);
		expect(result[0].error).toEqual([
			messages.find((m) => m.code === "file-invalid-type"),
			messages.find((m) => m.code === "file-too-large"),
		]);
	});
});
