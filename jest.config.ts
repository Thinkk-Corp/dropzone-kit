// jest.config.js
import path from "node:path";

export default {
	preset: "ts-jest",
	testEnvironment: "jest-environment-jsdom",
	moduleNameMapper: {
		"^@/(.*)$": path.resolve(__dirname, "src/$1"),
	},
	setupFilesAfterEnv: [
		"@testing-library/jest-dom", // @testing-library/jest-dom'u yükle
		"<rootDir>/jest-setup.ts", // Jest setup dosyasını yükle
	],
};
