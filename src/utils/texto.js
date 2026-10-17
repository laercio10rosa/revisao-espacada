/** Minúsculas e sem acento, para buscas. */
export function normalizar(s) {
  return (s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}
