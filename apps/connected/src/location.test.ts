import { expect, test } from 'vitest';
import { appHome } from './location';
test('auth returns to the deployed project path, never a domain root or supplied redirect', () => {
  expect(appHome('https://example.github.io/safereach/app/#/sign-in')).toBe('https://example.github.io/safereach/app/?poki=auth2');
  expect(appHome('http://127.0.0.1:4317/connected/?redirect_url=https://unrelated.example#route')).toBe('http://127.0.0.1:4317/connected/?poki=auth2');
  expect(appHome('http://127.0.0.1:5174/')).toBe('http://127.0.0.1:5174/?poki=auth2');
});
