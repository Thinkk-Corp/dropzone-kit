import { render, fireEvent, screen } from "@testing-library/react";
import { Dropzone } from "@/dropzone"; // Dropzone bileşeninizin doğru yolu burada olmalı
import { DropzoneErrorCode } from "@/enums";

// Mock veriler
const mockOnDrop = jest.fn();
const mockOnDropAccepted = jest.fn();
const mockOnDropRejected = jest.fn();

describe("Dropzone component", () => {
	test("renders children correctly", () => {
		render(
			<Dropzone
				onDrop={mockOnDrop}
				onDropAccepted={mockOnDropAccepted}
				onDropRejected={mockOnDropRejected}
				acceptedFormats={["image/png", "image/jpeg"]}
			>
				{({ containerProps, inputProps }) => (
					<div {...containerProps}>
						<input {...inputProps} />
						<p>Drag and drop files here</p>
					</div>
				)}
			</Dropzone>,
		);

		expect(screen.getByText("Drag and drop files here")).toBeInTheDocument();
	});

	test("accepts valid files and calls onDropAccepted", () => {
		const validFile = new File(["file content"], "image.png", { type: "image/png" });

		render(
			<Dropzone
				onDrop={mockOnDrop}
				onDropAccepted={mockOnDropAccepted}
				onDropRejected={mockOnDropRejected}
				acceptedFormats={["image/png", "image/jpeg"]}
			>
				{({ containerProps, inputProps }) => (
					<div {...containerProps}>
						<input {...inputProps} />
					</div>
				)}
			</Dropzone>,
		);

		const input = screen.getByRole("textbox", { hidden: true });

		fireEvent.change(input, { target: { files: [validFile] } });

		expect(mockOnDropAccepted).toHaveBeenCalledWith([validFile]);
		expect(mockOnDrop).toHaveBeenCalled();
	});

	test("rejects invalid files and calls onDropRejected", () => {
		const invalidFile = new File(["file content"], "document.pdf", { type: "application/pdf" });

		render(
			<Dropzone
				onDrop={mockOnDrop}
				onDropAccepted={mockOnDropAccepted}
				onDropRejected={mockOnDropRejected}
				acceptedFormats={["image/png", "image/jpeg"]}
			>
				{({ containerProps, inputProps }) => (
					<div {...containerProps}>
						<input {...inputProps} />
					</div>
				)}
			</Dropzone>,
		);

		const input = screen.getByRole("textbox", { hidden: true });

		fireEvent.change(input, { target: { files: [invalidFile] } });

		expect(mockOnDropRejected).toHaveBeenCalledWith([
			{
				file: invalidFile,
				error: [
					{
						code: DropzoneErrorCode.FileInvalidType,
						message: "Geçersiz dosya türü. Sadece şu türler destekleniyor: image/png, image/jpeg.",
					},
				],
			},
		]);
		expect(mockOnDrop).toHaveBeenCalled();
	});

	test("handles max file size validation", () => {
		const largeFile = new File(["a".repeat(10 * 1024 * 1024)], "large-file.png", { type: "image/png" });

		render(
			<Dropzone
				onDrop={mockOnDrop}
				onDropAccepted={mockOnDropAccepted}
				onDropRejected={mockOnDropRejected}
				acceptedFormats={["image/png"]}
				maxSize={5 * 1024 * 1024} // 5 MB
			>
				{({ containerProps, inputProps }) => (
					<div {...containerProps}>
						<input {...inputProps} />
					</div>
				)}
			</Dropzone>,
		);

		const input = screen.getByRole("textbox", { hidden: true });

		fireEvent.change(input, { target: { files: [largeFile] } });

		expect(mockOnDropRejected).toHaveBeenCalled();
		expect(mockOnDropAccepted).not.toHaveBeenCalled();
	});

	test("handles drag and drop events", () => {
		const validFile = new File(["file content"], "image.png", { type: "image/png" });

		render(
			<Dropzone
				onDrop={mockOnDrop}
				onDropAccepted={mockOnDropAccepted}
				onDropRejected={mockOnDropRejected}
				acceptedFormats={["image/png"]}
			>
				{({ containerProps, inputProps }) => (
					<div {...containerProps}>
						<input {...inputProps} />
					</div>
				)}
			</Dropzone>,
		);

		const dropzone = screen.getByText("Drag and drop files here");

		fireEvent.dragEnter(dropzone);
		expect(screen.getByText("Drag and drop files here")).toHaveClass("drag-active");

		fireEvent.dragLeave(dropzone);
		expect(screen.getByText("Drag and drop files here")).not.toHaveClass("drag-active");

		fireEvent.drop(dropzone, {
			dataTransfer: {
				files: [validFile],
			},
		});

		expect(mockOnDrop).toHaveBeenCalledWith([validFile], [], expect.anything());
	});
});
