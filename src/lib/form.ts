/** Parse number input without coercing empty string to 0. */
export function parseOptionalNumber(value: string): number | undefined {
  if (value.trim() === '') return undefined
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}

export function parseRequiredNumber(value: string): number | undefined {
  return parseOptionalNumber(value)
}
