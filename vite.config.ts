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
      https: process.env.PUBLIC_HTTPS?.toLowerCase() === 'true',
      proxy: {
        '/socket.io/': {
          ws: true,
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
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
