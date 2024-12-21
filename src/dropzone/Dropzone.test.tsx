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
				<input {...inputProps} />
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

		const input = screen.getByRole("textbox");

		const file = createFile(4, "example.txt", "text/plain");

		fireEvent.change(input, { target: { files: [file] } });

		expect(onDropMock).toHaveBeenCalledWith([file], []);
		expect(onDropAcceptedMock).toHaveBeenCalledWith([file]);
	});

	// Sürükle bırak işlevselliğini kontrol eder
	it("handles drag-and-drop functionality", () => {
		setup({ onDrop: onDropMock });

		const container = screen.getByTestId("dropzone-container");

		const file = createFile(4, "example.txt", "text/plain");

		fireEvent.dragOver(container);
		fireEvent.drop(container, {
			dataTransfer: { files: [file] },
		});

		expect(onDropMock).toHaveBeenCalledWith([file], []);
	});

	it("should not upload file when multiple false and one file uploaded", () => {
		setup({ onDrop: onDropMock, multiple: false });

		const input = screen.getByRole("textbox");
		const file1 = createFile(4, "example.txt", "text/plain");
		const file2 = createFile(4, "examplee.txt", "text/plain");

		fireEvent.change(input, { target: { files: [file1] } });
		fireEvent.change(input, { target: { files: [file2] } });

		expect(onDropMock).toHaveBeenCalledWith([file1], []);
	});

	// Dosya kısıtlamalarını kontrol eder ve reddetme geri çağrısını tetikler
	it("validates file constraints and triggers rejection callbacks", () => {
		const onDropRejectedMock = vi.fn();

		setup({ onDropRejected: onDropRejectedMock, maxFiles: 1 });

		const container = screen.getByTestId("dropzone-container");

		const file1 = new File(["content"], "file1.txt", { type: "text/plain" });
		const file2 = new File(["content"], "file2.txt", { type: "text/plain" });

		fireEvent.drop(container, {
			dataTransfer: { files: [file1, file2] },
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

		const container = screen.getByTestId("dropzone-container");

		const file = new File(["content"], "duplicate.txt", { type: "text/plain" });

		fireEvent.drop(container, {
			dataTransfer: { files: [file] },
		});

		fireEvent.drop(container, {
			dataTransfer: { files: [file] },
		});

		expect(onDropMock).toHaveBeenCalledWith([file], []);
	});

	// Özel doğrulama mesajlarını uygular
	it("applies custom validation messages", () => {
		const validationMessages = [{ code: DropzoneErrorCode.FileTooLarge, message: "Custom too large message" }];

		setup({ validationMessages });

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

		const input = screen.getByRole("textbox");
		const file = new File(["content"], "example.txt", { type: "text/plain" });

		fireEvent.change(input, { target: { files: [file] } });

		const { handleFileDelete } = childrenMock.mock.calls[0][0];

		act(() => {
			handleFileDelete(file);
		});

		expect((input as HTMLInputElement).files).toHaveLength(0);
	});
});
