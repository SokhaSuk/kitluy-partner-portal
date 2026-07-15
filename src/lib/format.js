/** Khmer riel — integer money, no decimals. */
export function khr(n) {
  return '៛' + Math.round(n).toLocaleString('en-US');
}
