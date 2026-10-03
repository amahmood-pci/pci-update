import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {resolve} from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          products: resolve(__dirname, 'products.html'),
          product: resolve(__dirname, 'product.html'),
          controls: resolve(__dirname, 'controls.html'),
          ai: resolve(__dirname, 'ai.html'),
          education: resolve(__dirname, 'education.html'),
          viewer: resolve(__dirname, 'viewer.html'),
          about: resolve(__dirname, 'about.html'),
          contact: resolve(__dirname, 'contact.html'),
          account: resolve(__dirname, 'account.html'),
          privacy: resolve(__dirname, 'privacy.html'),
          terms: resolve(__dirname, 'terms.html'),
          checkoutSuccess: resolve(__dirname, 'checkout-success.html'),
          checkoutCancel: resolve(__dirname, 'checkout-cancel.html'),
          notFound: resolve(__dirname, '404.html'),
        },
      },
    },
  };
});
