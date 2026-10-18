/** Números en formato español, con 3 cifras significativas por defecto. */
export function formatNumber(value: number, significantDigits = 3): string {
  return value.toLocaleString("es-ES", { maximumSignificantDigits: significantDigits });
}
