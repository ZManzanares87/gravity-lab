/** Números en formato español, con 3 cifras significativas por defecto. */
export function formatNumber(value: number, significantDigits = 3): string {
  return value.toLocaleString("es-ES", { maximumSignificantDigits: significantDigits });
}

const SUPERSCRIPT: Record<string, string> = {
  "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
};

/** Notación científica legible: 5,97·10²⁴. */
export function formatScientific(value: number, significantDigits = 3): string {
  if (value === 0) return "0";
  const exponent = Math.floor(Math.log10(Math.abs(value)));
  const mantissa = value / 10 ** exponent;
  const power = String(exponent)
    .split("")
    .map((char) => SUPERSCRIPT[char] ?? char)
    .join("");
  return `${formatNumber(mantissa, significantDigits)}·10${power}`;
}

/** Notación normal para valores corrientes; científica para los enormes o diminutos. */
export function formatQuantity(value: number, significantDigits = 3): string {
  const size = Math.abs(value);
  return size !== 0 && (size >= 1e6 || size < 1e-3)
    ? formatScientific(value, significantDigits)
    : formatNumber(value, significantDigits);
}

/** Distancias en metros o kilómetros, según su tamaño. */
export function formatDistance(meters: number): string {
  return Math.abs(meters) >= 10_000
    ? `${formatNumber(meters / 1000, 4)} km`
    : `${formatNumber(meters, 3)} m`;
}
