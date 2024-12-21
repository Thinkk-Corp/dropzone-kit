import { DropzoneErrorCode } from "@/Enums";
import type { IDropzone, IFileError, IFileRejection } from "@/Interfaces";
import { validator } from "@/validator/Validator";
import { type HTMLAttributes, type RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Dropzone bileşeni, dosya yükleme için çoklu veya tekli dosya yükleme özelliği sunan bir React bileşenidir.
 * Kullanıcıların sürükle ve bırak veya dosya seçme yoluyla dosya yüklemelerini sağlar.
 *
 * @param {IDropzone} props - Dropzone bileşenine iletilen özellikler.
 * @param {(files: File[], rejections: IFileRejection[]) => void} props.onDrop - Geçerli ve geçersiz dosyaların döndürüldüğü callback.
 * @param {(rejections: IFileRejection[]) => void} [props.onDropRejected] - Geçersiz dosyalar için çalışan callback.
 * @param {(files: File[]) => void} [props.onDropAccepted] - Geçerli dosyalar için çalışan callback.
 * @param {boolean} [props.multiple=true] - Çoklu dosya yükleme seçeneği.
 * @param {File[]} [props.initialFiles] - İlk yüklenmiş dosyalar.
 * @param {string[]} [props.acceptedFormats] - Kabul edilen dosya formatları.
 * @param {number} [props.maxFiles] - Maksimum yüklenebilecek dosya sayısı.
 * @param {number} [props.maxSize] - Dosya boyutu üst sınırı (byte cinsinden).
 * @param {number} [props.minSize] - Dosya boyutu alt sınırı (byte cinsinden).
 * @param {IFileError[]} [props.validationMessages] - Doğrulama mesajları.
 * @param {React.MouseEventHandler<HTMLInputElement>} [props.onClick] - Input elementine tıklanıldığında çalışan callback.
 * @param {Function} props.children - Render fonksiyonu.
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
	onClick,
	children,
	...props
}: IDropzone) => {
	// İç hata mesajları state'i
	const [internalValidationMessages, setInternalValidationMessages] = useState<IFileError[] | undefined>(validationMessages);
	const [internalRejections, setInternalRejections] = useState<IFileRejection[]>([]);
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
			if (!newFiles.length) return;

			// Benzersiz dosyaları filtreleme (dosya ismi ile karşılaştırmak)
			const filesSet = new Set(files.map((file) => file.name));
			const uniquedFiles = newFiles.filter((file) => !filesSet.has(file.name));

			// multiple seçeneği kontrolü
			if (multiple) {
				setFiles((prev) => [...prev, ...uniquedFiles]);
				return;
			}
			setFiles(uniquedFiles);
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
	 * @param {File[]} deletedFiles - Silinecek dosya listesi.
	 */
	const handleFileDelete = (deletedFiles: File[], notUpdateState?: boolean) => {
		if (!inputRef.current) return;

		// Silinecek dosyaların isimlerini bir Set'e ekliyoruz
		const deletedFilesNames = new Set(deletedFiles.map((file) => file.name));

		// Yeni dosya listesi oluşturuyoruz
		const remainingFiles = files.filter((file) => !deletedFilesNames.has(file.name));

		// State güncellemesi işlemi
		if (!notUpdateState) {
			setFiles((prev) => {
				// Silinmeyen dosyaları filtrele
				return prev.filter((file) => !deletedFilesNames.has(file.name));
			});
		}

		addFileToInput(remainingFiles);

		// "change" olayını yalnızca dosyalar silindikten sonra tetikleyin, tekrar tetiklememek için kontrol yapıyoruz
		if (!notUpdateState) {
			inputRef.current.dispatchEvent(new Event("change", { bubbles: true }));
		}
	};

	// Tıklama olayından sonra dosya seçilmez ise tarayıcının seçili dosyaları input'dan silmesini engeller ve event dönderir.
	const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
		const checkMissingFiles = () => {
			if (!inputRef.current?.files || inputRef.current.files.length > 0) return;

			// Rejected dosyaları filtrele
			const rejectionFileNames = new Set(internalRejections.map((rej) => rej.file.name));
			const missingFiles = files.filter((file) => !rejectionFileNames.has(file.name));

			addFileToInput(missingFiles);
		};

		// onfocus olayını bileşen içi kontrol ile kapsülle
		const handleFocus = () => {
			setTimeout(() => {
				checkMissingFiles();
				document.body.onfocus = null; // Olay dinleyicisini kaldır
			}, 100);
		};

		document.body.onfocus = handleFocus;
		onClick?.(e);
	};

	// Dosya formatlar ve inputa yükler
	const addFileToInput = useCallback((files: File[]) => {
		if (!inputRef.current) return;
		const dataTransfer = new DataTransfer();
		for (const file of files) {
			dataTransfer.items.add(file);
		}
		inputRef.current.files = dataTransfer.files;
	}, []);

	// Container özellikleri
	const containerProps: HTMLAttributes<HTMLDivElement> = {
		className: "dropzone-container",
		style: { position: "relative" },
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
		onClick: handleClick,
		...props,
	};

	// Initial files setup
	useEffect(() => {
		if (initialFiles && initialFiles.length > 0 && inputRef.current) {
			addFileToInput(initialFiles);
			inputRef.current.dispatchEvent(new Event("change", { bubbles: true }));
		}
	}, [initialFiles]);

	// Validation messages'lerin ayarlanması
	useEffect(() => {
		const formattedValidationMessages = validationMessages
			? defaultValidationMessages.map((message) => validationMessages.find((msg) => msg.code === message.code) || message)
			: defaultValidationMessages;

		setInternalValidationMessages(formattedValidationMessages);
	}, [validationMessages, defaultValidationMessages]);

	// Dosya validasyon ve callback'ler
	useEffect(() => {
		if (!inputRef.current?.files) return;

		const rejections = validator({
			files,
			maxFiles,
			maxSize,
			minSize,
			messages: internalValidationMessages,
			acceptedFormats,
		});

		// Geçerli dosyaları dışarıya iletme (geçersiz dosyaları hariç tutarak)
		const validFiles = files.filter((file) => !rejections.some((rejection) => rejection.file.name === file.name));

		// Geçersiz dosyaları silme
		if (rejections.length > 0) {
			setInternalRejections(rejections);
			handleFileDelete(
				rejections.map((rejection) => rejection.file),
				true, // Not updating state yet
			);
		}
		const inputFiles = Array.from(inputRef.current.files);

		if (validFiles.length > 0 && validFiles.length !== inputFiles.length) {
			const inputFileNames = new Set(inputFiles.map((file) => file.name));
			const prevAddedFiles = validFiles.filter((file) => !inputFileNames.has(file.name));
			if (prevAddedFiles.length > 0) {
				const mergedValidFiles = [...prevAddedFiles, ...inputFiles];
				addFileToInput(mergedValidFiles);
			}
		}

		onDrop?.(validFiles, rejections);
		onDropRejected?.(rejections);
		onDropAccepted?.(validFiles);
	}, [files, internalValidationMessages]);

	// Eğer children bir fonksiyon değilse render etmiyoruz
	if (typeof children !== "function") return null;

	return <div data-testid="dropzone">{children({ containerProps, inputProps, handleFileDelete, isDragActive })}</div>;
};
