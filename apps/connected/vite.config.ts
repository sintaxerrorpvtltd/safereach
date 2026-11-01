import { defineConfig, loadEnv } from 'vite';
import type { Plugin } from 'vite';
import type { InlineConfig } from 'vitest/node';
import { connectedContentPolicy } from '../../src/connected-policy.js';
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const runtime: Plugin = {
    name: 'poki-public-runtime',
    transformIndexHtml() {
      const clerk = env.VITE_CLERK_JWT_ISSUER_DOMAIN, convex = env.VITE_CONVEX_URL;
      for (const value of [clerk, convex]) if (value && (new URL(value).origin !== value || !value.startsWith('https://'))) throw new Error('Use exact HTTPS service origins.');
      const policy = clerk && convex ? connectedContentPolicy(clerk, convex) : "default-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'";
      return [{ tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: policy }, injectTo: 'head-prepend' }];
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'runtime-config.json', source: JSON.stringify({ convexUrl: env.VITE_CONVEX_URL || null, clerkPublishableKey: env.VITE_CLERK_PUBLISHABLE_KEY || null, clerkIssuer: env.VITE_CLERK_JWT_ISSUER_DOMAIN || null }) });
    }
  };
  return { base: './', plugins: [runtime], test: { environment: 'edge-runtime', include: ['convex/**/*.test.ts', 'src/**/*.test.ts'] } as InlineConfig, server: { port: 5174, strictPort: true }, build: { outDir: 'dist' } };
});
