import { DropzoneErrorCode } from "@/enums";
import type { IDropzone, IFileError } from "@/interfaces";
import { validator } from "@/utils";
import { type HTMLAttributes, type RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";

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
	initialFiles,
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
	const defaultValidationMessages = useMemo(
		() => [
			{
				code: DropzoneErrorCode.FileInvalidType,
				message: `Geçersiz dosya türü. Sadece şu türler destekleniyor: ${acceptedFormats ? acceptedFormats.join(", ") : "*"}.`,
			},
			{ code: DropzoneErrorCode.FileTooLarge, message: "Dosya boyutu çok büyük." },
			{ code: DropzoneErrorCode.FileTooSmall, message: "Dosya boyutu çok küçük." },
			{
				code: DropzoneErrorCode.TooManyFiles,
				message: `Maksimum dosya sayısını aştınız. En fazla ${maxFiles} dosya yükleyebilirsiniz.`,
			},
		],
		[acceptedFormats, maxFiles],
	);

	/**
	 * Dosya bırakma veya dosya seçme işlemini yönetir.
	 * @param {React.DragEvent<HTMLDivElement> | React.ChangeEvent<HTMLInputElement>} event - Olay nesnesi.
	 */
	const handleDrop = useCallback(
		(event: React.DragEvent<HTMLDivElement> | React.ChangeEvent<HTMLInputElement>) => {
			event.preventDefault();
			const newFiles = "dataTransfer" in event ? Array.from(event.dataTransfer.files) : Array.from(event.target.files || []);
			if (!newFiles.length || (!multiple && files.length > 0)) return;
			const uniquedFiles = newFiles.filter((newFile) => !files.some((file) => file.name === newFile.name));
			setFiles((prev) => [...prev, ...uniquedFiles]);
		},
		[files, multiple],
	);

	/**
	 * Drag over olayını yönetir.
	 * @param {React.DragEvent<HTMLDivElement>} event - Olay nesnesi.
	 */
	const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
	}, []);

	/**
	 * Drag işlemi başladığında veya bittiğinde tetiklenir.
	 * @param {React.DragEvent<HTMLInputElement>} _e - Olay nesnesi.
	 * @param {"enter" | "leave"} type - Drag durumu.
	 */
	const handleDrag = useCallback((type: "enter" | "leave") => {
		setIsDragActive(type === "enter");
	}, []);

	/**
	 * Bir dosyayı listeden siler.
	 * @param {File} deletedFile - Silinecek dosya.
	 */
	const handleFileDelete = useCallback(
		(deletedFile: File) => {
			setFiles((prev) => prev.filter((file) => file.name !== deletedFile.name));

			if (!inputRef.current) return;

			const dataTransfer = new DataTransfer();

			for (const file of files) {
				if (file.name !== deletedFile.name) {
					dataTransfer.items.add(file);
				}
			}

			inputRef.current.files = dataTransfer.files;
			inputRef.current.dispatchEvent(new Event("change", { bubbles: true }));
		},
		[files],
	);

	// Container özellikleri
	const containerProps: HTMLAttributes<HTMLDivElement> = {
		className: "dropzone-container",
		style: {
			position: "relative",
		},
		onDrop: handleDrop,
		onDragEnter: () => handleDrag("enter"),
		onDragLeave: () => handleDrag("leave"),
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
		accept: acceptedFormats ? acceptedFormats.join(", ") : undefined,
		type: "file",
		role: "textbox",
		multiple,
		onChange: handleDrop,
		...props,
	};

	useEffect(() => {
		if (!initialFiles || !inputRef.current) return;

		const dataTransfer = new DataTransfer();

		for (const initialFile of initialFiles) {
			dataTransfer.items.add(initialFile);
		}

		inputRef.current.files = dataTransfer.files;
		inputRef.current.dispatchEvent(new Event("change", { bubbles: true }));
	}, [initialFiles]);

	// Bu kısımda validasyon mesajları kayıt edilip formatlanıyor
	useEffect(() => {
		if (validationMessages) {
			const formattedValidationMessages = defaultValidationMessages.map(
				(message) => validationMessages.find((msg) => msg.code === message.code) || message,
			);

			setInternalValidationMessages(formattedValidationMessages);
		} else {
			setInternalValidationMessages(defaultValidationMessages);
		}
	}, [validationMessages, defaultValidationMessages]);

	useEffect(() => {
		const rejections = validator({ files, maxFiles, maxSize, minSize, messages: internalValidationMessages, acceptedFormats });
		const validFiles = files.filter((file) => !rejections.some((rejection) => rejection.file.name === file.name));
		onDrop?.(validFiles, rejections);
		onDropRejected?.(rejections);
		onDropAccepted?.(validFiles);
	}, [files, internalValidationMessages]);

	if (typeof children !== "function") return null;

	return <div data-testid="dropzone">{children({ containerProps, inputProps, handleFileDelete, isDragActive })}</div>;
};
