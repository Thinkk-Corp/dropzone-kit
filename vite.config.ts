import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { peerDependencies } from "./package.json";

// Vite yapılandırması
export default defineConfig({
	build: {
		lib: {
			entry: "./src/index.ts", // Kütüphanenin giriş noktası.
			name: "react-dropzone-kit", // Kütüphanenin adı.
			fileName: (format) => `index.${format}.js`, // Çıktı dosyasının adı.
			formats: ["cjs", "es"], // Çıktı formatları (CommonJS ve ES modülleri).
		},
		rollupOptions: {
			external: [
				...Object.keys(peerDependencies), // Rollup için dış bağımlılıklar.
			],
		},
		sourcemap: true, // Debugging için kaynak haritaları oluşturulacak.
		emptyOutDir: true, // Çıktı dizinini temizle.
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"), // Aliasing src dizinine.
		},
	},
	plugins: [react(), dts()],
});
