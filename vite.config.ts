import { defineConfig, loadEnv } from 'vite';
import mkcert from 'vite-plugin-mkcert';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), 'PUBLIC'));

  let host = process.env.PUBLIC_DOMAIN;

  if (host) {
    host = host.split(':')[0];
  }

  return {
    server: {
      https: process.env.PUBLIC_HTTPS?.toLocaleLowerCase() === 'true',
      proxy: {
        '/api/jobs/': 'http://localhost:3000',
      },
    },
    plugins: [
      sveltekit(),
      mkcert({
        hosts: host ? [host] : undefined,
      }),
    ],
  };
});
