import { type HTMLAttributes, type RefObject, useEffect, useState, useRef } from "react";
import type { IDropzone, IFileError } from "@/interfaces";
import { DropzoneErrorCode } from "@/enums";
import { validator } from "@/utils";

/**
 * Dropzone bileşeni, dosya yükleme işlemleri için kullanılan bir React bileşenidir.
 * @param {IDropzone} props - Dropzone bileşenine iletilen özellikler.
 * @param {Function} props.onDrop - Geçerli ve reddedilen dosyaları döndüren bir işlev.
 * @param {(rejections:IFileRejection[]) => void} props.onDropRejected - Reddedilen dosyaları sağlayan event.
 * @param {(files:File[]) => void} props.onDropAccepted - Kabul edilen dosyaları sağlayan event.
 * @param {boolean} [props.multiple=true] - Birden fazla dosya yükleme desteği.
 * @param {string[]} [props.acceptedFormats] - Kabul edilen dosya türleri.
 * @param {number} [props.maxFiles] - Maksimum yüklenebilir dosya sayısı.
 * @param {number} [props.maxSize] - Yüklenebilir maksimum dosya boyutu (byte).
 * @param {number} [props.minSize] - Yüklenebilir minimum dosya boyutu (byte).
 * @param {IFileError[]} [props.validationMessages] - Özel hata mesajları.
 * @param {Function} props.children - Özelleştirilmiş içerik işlevi.
 * @returns {JSX.Element | null} Dropzone bileşeni.
 */
export const Dropzone = ({
	onDrop,
	onDropRejected,
	onDropAccepted,
	multiple = true,
	acceptedFormats,
	maxFiles,
	maxSize,
	minSize,
	validationMessages,
	children,
	...props
}: IDropzone) => {
	// İç hata mesajları state'i
	const [internalValidationMessages, setInternalValidationMessages] = useState<IFileError[] | undefined>(validationMessages);
	const [isDragActive, setIsDragActive] = useState<boolean>(false);

	// Yüklenmiş dosyalar state'i
	const [files, setFiles] = useState<File[]>([]);

	// input elementine referans
	const inputRef = useRef<HTMLInputElement>(null);

	// Varsayılan doğrulama mesajları
	const defaultValidationMessages: IFileError[] = [
		{
			code: DropzoneErrorCode.FileInvalidType,
			message: `Geçersiz dosya türü. Sadece şu türler destekleniyor: ${acceptedFormats ? acceptedFormats.join(", ") : "*"}.`,
		},
		{
			code: DropzoneErrorCode.FileTooLarge,
			message: "Dosya boyutu çok büyük.",
		},
		{
			code: DropzoneErrorCode.FileTooSmall,
			message: "Dosya boyutu çok küçük.",
		},
		{
			code: DropzoneErrorCode.TooManyFiles,
			message: `Maksimum dosya sayısını aştınız. En fazla ${maxFiles} dosya yükleyebilirsiniz.`,
		},
	];

	/**
	 * Dosya bırakma veya dosya seçme işlemini yönetir.
	 * @param {React.DragEvent<HTMLDivElement> | React.ChangeEvent<HTMLInputElement>} event - Olay nesnesi.
	 */
	const handleDrop = (event: React.DragEvent<HTMLDivElement> | React.ChangeEvent<HTMLInputElement>) => {
		event.preventDefault();

		let newFiles: File[] = [];

		// Drag and Drop işlemi mi yoksa input değişikliği mi olduğunu kontrol eder.
		if ("dataTransfer" in event) {
			newFiles = Array.from(event.dataTransfer.files);
		} else if (event.target?.files) {
			newFiles = Array.from(event.target.files);
		}

		if (!newFiles.length) return;

		// Aynı isimdeki dosyaları filtreler.
		const uniquedFiles = newFiles.filter((newFile) => !files.some((file) => file.name === newFile.name));

		setFiles((prev) => [...prev, ...uniquedFiles]);
	};

	/**
	 * Drag over olayını yönetir.
	 * @param {React.DragEvent<HTMLDivElement>} event - Olay nesnesi.
	 */
	const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
	};

	/**
	 * Drag işlemi başladığında veya bittiğinde tetiklenir.
	 * @param {React.DragEvent<HTMLInputElement>} _e - Olay nesnesi.
	 * @param {"enter" | "leave"} type - Drag durumu.
	 */
	const handleDrag = (_e: React.DragEvent<HTMLDivElement>, type: "enter" | "leave") => {
		if (type === "enter") {
			return setIsDragActive(true);
		}
		setIsDragActive(false);
	};

	/**
	 * Bir dosyayı listeden siler.
	 * @param {File} deletedFile - Silinecek dosya.
	 */
	const handleFileDelete = (deletedFile: File) => {
		const dataTransfer = new DataTransfer();

		const updatedFiles = files.filter((file) => file.name !== deletedFile.name);

		// Geçerli dosyaları dataTransfer objesine ekle
		for (const file of updatedFiles) {
			dataTransfer.items.add(file);
		}

		if (!inputRef.current) return;

		const input = inputRef.current;

		const fileList = dataTransfer.files;

		// Input elemanının files özelliğini doğrudan değiştirmek yerine
		// input'un değişim olayını tetikleyeceğiz
		const changeEvent = new Event("change", { bubbles: true });

		// input elemanını dataTransfer ile güncellemek için
		input.files = fileList;

		// Değişiklik olayını tetikle
		input.dispatchEvent(changeEvent);

		setFiles(updatedFiles);
	};

	// Container özellikleri
	const containerProps: HTMLAttributes<HTMLDivElement> = {
		className: "dropzone-container",
		style: {
			position: "relative",
		},
		onDrop: handleDrop,
		onDragEnter: (e) => handleDrag(e, "enter"),
		onDragLeave: (e) => handleDrag(e, "leave"),
		onDragOver: handleDragOver,
	};

	// Input özellikleri
	const inputProps: React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> & {
		ref: RefObject<HTMLInputElement | null>;
	} = {
		className: "dropzone-input",
		style: {
			position: "absolute",
			top: 0,
			left: 0,
			right: 0,
			bottom: 0,
			width: "100%",
			height: "100%",
			opacity: 0,
			cursor: "pointer",
		},
		tabIndex: -1,
		ref: inputRef,
		multiple,
		accept: acceptedFormats ? acceptedFormats.join(", ") : undefined,
		type: "file",
		role: "textbox",
		onChange: handleDrop,
		...props,
	};

	// Bu kısımda validasyon mesajları kayıt edilip formatlanıyor
	useEffect(() => {
		if (validationMessages) {
			const formattedValidationMessages = defaultValidationMessages.reduce((acc, message) => {
				const findValidCodeInCustomValidationMessages = validationMessages.find((msg) => msg.code === message.code);
				if (!findValidCodeInCustomValidationMessages) {
					acc.push(message);
				} else {
					acc.push(findValidCodeInCustomValidationMessages);
				}
				return acc;
			}, [] as IFileError[]);

			setInternalValidationMessages(formattedValidationMessages);
		} else {
			setInternalValidationMessages(defaultValidationMessages);
		}
	}, [validationMessages]);

	useEffect(() => {
		const rejections = validator({ files, maxFiles, maxSize, minSize, messages: internalValidationMessages, acceptedFormats });
		const validFiles = files.filter((file) => !rejections.some((rejection) => rejection.file.name === file.name));

		onDrop?.(validFiles, rejections);
		if (validFiles.length > 0) {
			onDropAccepted?.(validFiles);
		}
		if (rejections.length > 0) {
			onDropRejected?.(rejections);
		}
	}, [files, internalValidationMessages]);

	if (typeof children !== "function") return null;

	return <div data-testid="dropzone">{children({ containerProps, inputProps, handleFileDelete, isDragActive })}</div>;
};
