import "@testing-library/jest-dom";

beforeEach(() => {
	jest.clearAllMocks();
	jest.restoreAllMocks();

	global.DataTransfer = jest.fn().mockImplementation(() => ({
		items: {
			add: jest.fn(),
		},
		files: [],
		setData: jest.fn(),
		getData: jest.fn(),
	}));
});
