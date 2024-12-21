import { DropzoneErrorCode } from "@/Enums";
import { Dropzone } from "@/dropzone/Dropzone"; // Dosya yolunu projenize göre ayarlayın
import { validator } from "@/validator/Validator";
import { fireEvent, render, screen } from "@testing-library/react";
import { act } from "react";
import { vi } from "vitest";

vi.mock("@/validator/Validator", () => ({
	validator: vi.fn(({ files, maxFiles }) => {
		const errors = [];
		if (maxFiles && files.length > maxFiles) {
			errors.push({ code: DropzoneErrorCode.TooManyFiles, file: files[0] });
		}
		return errors;
	}),
}));

const setFiles = (files: File[]) => {
	const dataTransfer = new DataTransfer();
	// biome-ignore lint/complexity/noForEach: <explanation>
	files.forEach((file) => dataTransfer.items.add(file));
	return dataTransfer.files;
};

// Belirtilen boyut, ad ve türde sahte bir dosya oluşturur
const createFile = (size: number, name: string, type: string) => {
	const content = new Array(size).fill("a").join("");
	return new File([content], name, { type });
};

const onDropMock = vi.fn();

describe("Dropzone Component", () => {
	// Test bileşeni kurulum fonksiyonu
	const setup = (props: object) => {
		const childrenMock = vi.fn(({ containerProps, inputProps }) => (
			<div {...containerProps} data-testid="dropzone-container">
				<input {...inputProps} data-testid="dropzone-input" />
			</div>
		));

		render(<Dropzone {...props}>{childrenMock}</Dropzone>);

		return { childrenMock };
	};

	// Bileşenin doğru render edildiğini kontrol eder
	it("renders without crashing and calls children as a function", () => {
		const { childrenMock } = setup({});

		expect(screen.getByTestId("dropzone-container")).toBeInTheDocument();
		expect(childrenMock).toHaveBeenCalled();
	});

	// Dosya seçim işlevselliğini kontrol eder
	it("handles file selection via input", () => {
		const onDropAcceptedMock = vi.fn();
		const onDropRejectedMock = vi.fn();

		setup({ onDrop: onDropMock, onDropAccepted: onDropAcceptedMock, onDropRejected: onDropRejectedMock });

		const input = screen.getByTestId("dropzone-input");

		const file = createFile(4, "example.txt", "text/plain");

		fireEvent.change(input, { target: { files: [file] } });

		expect(onDropMock).toHaveBeenCalledWith([file], []);
		expect(onDropAcceptedMock).toHaveBeenCalledWith([file]);
	});

	// Sürükle bırak işlevselliğini kontrol eder
	it("handles drag-and-drop functionality", () => {
		setup({ onDrop: onDropMock });

		const input = screen.getByTestId("dropzone-input");

		const file = createFile(4, "example.txt", "text/plain");

		fireEvent.dragOver(input);

		fireEvent.drop(input, {
			dataTransfer: { files: setFiles([file]) },
		});

		expect(onDropMock).toHaveBeenCalledWith([file], []);
	});

	it("should not upload file when multiple false and one file uploaded", () => {
		setup({ onDrop: onDropMock, multiple: false });

		const input = screen.getByTestId("dropzone-input");
		const file1 = createFile(4, "example.txt", "text/plain");
		const file2 = createFile(4, "examplee.txt", "text/plain");

		fireEvent.change(input, { target: { files: [file1, file2] } });

		expect(onDropMock).toHaveBeenCalledWith([file1], []);
	});

	// Dosya kısıtlamalarını kontrol eder ve reddetme geri çağrısını tetikler
	it("validates file constraints and triggers rejection callbacks", () => {
		const onDropRejectedMock = vi.fn();

		setup({ onDropRejected: onDropRejectedMock, maxFiles: 1 });

		const input = screen.getByTestId("dropzone-input");

		const file1 = createFile(5, "file.txt", "text/plain");
		const file2 = createFile(5, "file2.txt", "text/plain");

		fireEvent.change(input, {
			target: { files: [file1, file2] },
		});

		expect(onDropRejectedMock).toHaveBeenCalledWith(
			expect.arrayContaining([
				expect.objectContaining({
					code: DropzoneErrorCode.TooManyFiles,
				}),
			]),
		);
	});

	// Yinelenen dosyaları filtreler
	it("filters duplicate files", () => {
		const onDropMock = vi.fn();

		setup({ onDrop: onDropMock });

		const input = screen.getByTestId("dropzone-input");

		const file = createFile(5, "example.txt", "test/plain");

		fireEvent.change(input, {
			target: { files: [file] },
		});

		fireEvent.change(input, {
			target: { files: [file] },
		});

		expect(onDropMock).toHaveBeenCalledWith([file], []);
	});

	// Özel doğrulama mesajlarını uygular
	it("applies custom validation messages", () => {
		const validationMessages = [{ code: DropzoneErrorCode.FileTooLarge, message: "Custom too large message" }];

		setup({ validationMessages, maxSize: 1024 * 1024 });

		expect(validator).toHaveBeenCalledWith(
			expect.objectContaining({
				messages: expect.arrayContaining([
					expect.objectContaining({
						message: "Custom too large message",
					}),
				]),
			}),
		);
	});

	// Dosya silme işlemini kontrol eder
	it("handles file deletion", () => {
		const { childrenMock } = setup({});

		const input = screen.getByTestId("dropzone-input");
		const file = createFile(5, "example.txt", "test/plain");

		fireEvent.change(input, { target: { files: [file] } });

		const { handleFileDelete } = childrenMock.mock.calls[0][0];

		act(() => {
			handleFileDelete([file]);
		});

		expect((input as HTMLInputElement).files).toHaveLength(0);
	});

	it("should upload initial files", () => {
		const initFile = createFile(5, "init-file.txt", "text/plain");

		// initialFiles'i prop olarak geçiyoruz, setFiles kullanılmamalı
		const childrenMock = vi.fn(({ containerProps, inputProps }) => (
			<div {...containerProps} data-testid="dropzone-container">
				<input {...inputProps} data-testid="dropzone-input" />
			</div>
		));

		render(<Dropzone initialFiles={[initFile]}>{childrenMock}</Dropzone>);

		const input = screen.getByTestId("dropzone-input");

		expect((input as HTMLInputElement).files?.length).toBe(1);
	});
});
