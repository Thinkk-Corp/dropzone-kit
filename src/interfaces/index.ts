import type { HTMLAttributes, ReactNode, RefObject } from "react";

export type IFileErrorTypes = "file-invalid-type" | "file-too-large" | "file-too-small" | "too-many-files";

export type IFileRejection = { file: File; error: IFileError[] };

export type IFileError = { code: IFileErrorTypes; message: string };

export interface IDropzone extends Omit<HTMLAttributes<HTMLInputElement>, "onDrop" | "children"> {
	onDrop?: (files: File[], fileRejections: IFileRejection[], ref: RefObject<HTMLInputElement>) => void;
	onDropAccepted?: (files: File[]) => void;
	onDropRejected?: (fileRejections: IFileRejection[]) => void;
	acceptedFormats?: string[];
	validationMessages?: IFileError[];
	maxSize?: number;
	minSize?: number;
	multiple?: boolean;
	maxFiles?: number;
	children: ({
		containerProps,
		isDragActive,
		inputProps,
		handleFileDelete,
	}: {
		isDragActive?: boolean;
		containerProps: HTMLAttributes<HTMLDivElement>;
		inputProps: HTMLAttributes<HTMLInputElement>;
		handleFileDelete: (file: File) => void;
	}) => ReactNode;
}
