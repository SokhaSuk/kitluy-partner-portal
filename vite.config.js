import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// The app splits itself into async chunks through React.lazy — App.jsx defers the
// signed-in Shell, Dashboard.jsx defers Recharts — so no manualChunks config is
// needed.
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
