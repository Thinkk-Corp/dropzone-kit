import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true, // Jest gibi global değişkenlere ihtiyaç yoksa false olabilir.
		environment: "jsdom", // DOM simülasyonu için jsdom kullanılır.
		include: ["src/**/*.{test,spec}.{ts,tsx}"], // Test dosyalarının bulunduğu yol.
		setupFiles: "./vitestSetup.ts", // Test öncesi ayarlar.
	},
	resolve: {
		alias: {
			"@": "/src",
			react: path.resolve(__dirname, "./node_modules/react"), // React'ı doğru konumda çözümleyin
			"react-dom": path.resolve(__dirname, "./node_modules/react-dom"), // ReactDOM'u doğru konumda çözümleyin
		},
	},
});
