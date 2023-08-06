import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import mkcert from 'vite-plugin-mkcert';

export default defineConfig({
	server: {
		https: true,
		proxy: {
			'/api/jobs/': 'http://localhost:3000'
		}
	},
	plugins: [
		sveltekit(),
		mkcert({
			hosts: ['opensongsync.dev']
		})
	]
});
