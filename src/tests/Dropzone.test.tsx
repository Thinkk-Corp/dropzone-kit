import { render, screen, fireEvent } from "@testing-library/react";
import { Dropzone } from "@/dropzone"; // Dosya yolunu projenize göre ayarlayın
import { DropzoneErrorCode } from "@/enums";
import { act } from "react";

// Validator fonksiyonunu mocklama
jest.mock("@/utils", () => ({
	validator: jest.fn(({ files, maxFiles }) => {
		const errors = [];
		if (maxFiles && files.length > maxFiles) {
			errors.push({ code: DropzoneErrorCode.TooManyFiles, file: files[0] });
		}
		return errors;
	}),
}));

const mockValidator = require("@/utils").validator;

describe("Dropzone Component", () => {
	// Test bileşeni kurulum fonksiyonu
	const setup = (props: object) => {
		const childrenMock = jest.fn(({ containerProps, inputProps }) => (
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
		const onDropMock = jest.fn();
		const onDropAcceptedMock = jest.fn();
		const onDropRejectedMock = jest.fn();

		setup({ onDrop: onDropMock, onDropAccepted: onDropAcceptedMock, onDropRejected: onDropRejectedMock });

		const input = screen.getByRole("textbox");

		const file = new File(["content"], "example.txt", { type: "text/plain" });

		fireEvent.change(input, { target: { files: [file] } });

		expect(onDropMock).toHaveBeenCalledWith([file], []);
		expect(onDropAcceptedMock).toHaveBeenCalledWith([file]);
	});

	// Sürükle bırak işlevselliğini kontrol eder
	it("handles drag-and-drop functionality", () => {
		const onDropMock = jest.fn();

		setup({ onDrop: onDropMock });

		const container = screen.getByTestId("dropzone-container");

		const file = new File(["content"], "example.txt", { type: "text/plain" });

		fireEvent.dragOver(container);
		fireEvent.drop(container, {
			dataTransfer: { files: [file] },
		});

		expect(onDropMock).toHaveBeenCalledWith([file], []);
	});

	// Dosya kısıtlamalarını kontrol eder ve reddetme geri çağrısını tetikler
	it("validates file constraints and triggers rejection callbacks", () => {
		const onDropRejectedMock = jest.fn();

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
		const onDropMock = jest.fn();

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

		expect(mockValidator).toHaveBeenCalledWith(
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
