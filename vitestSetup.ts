import "@testing-library/jest-dom";
import { vi } from "vitest";

afterAll(() => {
	vi.clearAllMocks();
	vi.restoreAllMocks();
});

beforeAll(() => {
	global.DataTransfer = vi.fn().mockImplementation(() => ({
		items: {
			add: vi.fn(),
		},
		files: [],
		setData: vi.fn(),
		getData: vi.fn(),
	}));
});
