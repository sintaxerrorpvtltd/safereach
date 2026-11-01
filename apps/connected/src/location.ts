export function appHome(href: string) {
  const url = new URL(href);
  return `${url.origin}${url.pathname}`;
}
