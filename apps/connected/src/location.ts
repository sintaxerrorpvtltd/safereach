export function appHome(href: string) {
  const url = new URL(href);
  // Keep auth returns off a previously cached GitHub Pages entry document.
  return `${url.origin}${url.pathname}?poki=auth2`;
}
