import glsl from 'vite-plugin-glsl';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), glsl()],
  server: {
    host: '0.0.0.0', // Để truy cập từ các thiết bị khác trong mạng nội bộ (LAN)
    port: 3001, // Đặt cổng bạn muốn, ví dụ: 3000
  },
});
