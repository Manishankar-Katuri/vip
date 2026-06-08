import type { MetricName, MetricPoint } from "../dto";

export class MetricsRegistry {
  private readonly points: MetricPoint[] = [];

  counter(name: MetricName, value = 1, labels: Record<string, string> = {}) {
    if (value < 0) throw new Error("Counters cannot decrease.");
    this.add(name, value, "COUNTER", labels);
  }
  gauge(name: MetricName, value: number, labels: Record<string, string> = {}) { this.add(name, value, "GAUGE", labels); }
  histogram(name: MetricName, value: number, labels: Record<string, string> = {}) {
    if (value < 0) throw new Error("Histogram observations cannot be negative.");
    this.add(name, value, "HISTOGRAM", labels);
  }
  list() { return [...this.points]; }

  sum(name: MetricName) {
    return this.points.filter((point) => point.name === name).reduce((total, point) => total + point.value, 0);
  }
  average(name: MetricName) {
    const points = this.points.filter((point) => point.name === name);
    return points.length ? points.reduce((total, point) => total + point.value, 0) / points.length : 0;
  }
  latest(name: MetricName) {
    const points = this.points.filter((point) => point.name === name);
    return points.length ? points[points.length - 1].value : 0;
  }

  private add(name: MetricName, value: number, kind: MetricPoint["kind"], labels: Record<string, string>) {
    if (!Number.isFinite(value)) throw new Error("Metric values must be finite.");
    this.points.push({ name, value, kind, labels, recordedAt: new Date().toISOString() });
  }
}
