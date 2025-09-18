import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  
  // Server configuration
  server: {
    port: 5173,
    host: true
  },
  
  // Build configuration
  build: {
    target: 'node20'
  },
  
  // Define global constants
  define: {
    // Add any global constants here if needed
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: ['@supabase/supabase-js']
  }
});