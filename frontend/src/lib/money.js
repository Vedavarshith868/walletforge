export function formatAmount(minorUnits) {
  return (minorUnits / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function toMinorUnits(input) {
  const value = Number.parseFloat(input);
  if (!Number.isFinite(value)) return Number.NaN;
  return Math.round(value * 100);
}
