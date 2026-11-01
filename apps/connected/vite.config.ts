import { defineConfig, loadEnv } from 'vite';
import type { Plugin } from 'vite';
import type { InlineConfig } from 'vitest/node';
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const runtime: Plugin = {
    name: 'poki-public-runtime',
    transformIndexHtml() {
      const clerk = env.VITE_CLERK_JWT_ISSUER_DOMAIN, convex = env.VITE_CONVEX_URL;
      for (const value of [clerk, convex]) if (value && (new URL(value).origin !== value || !value.startsWith('https://'))) throw new Error('Use exact HTTPS service origins.');
      const connections = clerk && convex ? `${clerk} ${convex} ${convex.replace('https:', 'wss:')}` : "'none'";
      return [{ tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: `default-src 'self'; script-src 'self' ${clerk || ''}; style-src 'self' 'unsafe-inline'; connect-src ${connections}; img-src 'self' data: https://img.clerk.com; font-src 'self' data:; frame-src ${clerk || "'none'"}; base-uri 'none'; object-src 'none'; form-action 'self' ${clerk || ''}` }, injectTo: 'head-prepend' }];
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'runtime-config.json', source: JSON.stringify({ convexUrl: env.VITE_CONVEX_URL || null, clerkPublishableKey: env.VITE_CLERK_PUBLISHABLE_KEY || null, clerkIssuer: env.VITE_CLERK_JWT_ISSUER_DOMAIN || null }) });
    }
  };
  return { base: './', plugins: [runtime], test: { environment: 'edge-runtime', include: ['convex/**/*.test.ts'] } as InlineConfig, server: { port: 5174, strictPort: true }, build: { outDir: 'dist' } };
});
