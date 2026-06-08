export function average(values: readonly number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

export function percentChange(current: number, baseline: number) {
  return baseline === 0 ? (current === 0 ? 0 : 100) : ((current - baseline) / Math.abs(baseline)) * 100;
}

export function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value * 100) / 100));
}

export function trend(values: readonly number[]) {
  if (values.length < 2) return 0;
  const midpoint = (values.length - 1) / 2;
  const mean = average(values);
  const numerator = values.reduce((sum, value, index) => sum + (index - midpoint) * (value - mean), 0);
  const denominator = values.reduce((sum, _value, index) => sum + (index - midpoint) ** 2, 0);
  return denominator === 0 ? 0 : numerator / denominator;
}
