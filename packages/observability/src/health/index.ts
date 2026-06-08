import type { ComponentHealth, HealthStatus } from "../dto";
import { ComponentHealthSchema } from "../dto";

export interface HealthProbe {
  component: ComponentHealth["component"];
  check(): Promise<Record<string, unknown>>;
}

export interface HealthReport {
  status: HealthStatus;
  checkedAt: string;
  components: ComponentHealth[];
}

export class HealthMonitoringService {
  constructor(private readonly probes: HealthProbe[], private readonly degradedLatencyMs = 1000) {}

  async check(): Promise<HealthReport> {
    const components = await Promise.all(this.probes.map((probe) => this.evaluate(probe)));
    const status = components.some((component) => component.status === "UNHEALTHY")
      ? "UNHEALTHY"
      : components.some((component) => component.status === "DEGRADED") ? "DEGRADED" : "HEALTHY";
    return { status, checkedAt: new Date().toISOString(), components };
  }

  private async evaluate(probe: HealthProbe) {
    const started = Date.now();
    try {
      const details = await probe.check();
      const latencyMs = Date.now() - started;
      return ComponentHealthSchema.parse({
        component: probe.component,
        status: latencyMs >= this.degradedLatencyMs ? "DEGRADED" : "HEALTHY",
        checkedAt: new Date().toISOString(),
        latencyMs,
        details,
      }) as ComponentHealth;
    } catch (error) {
      return ComponentHealthSchema.parse({
        component: probe.component, status: "UNHEALTHY", checkedAt: new Date().toISOString(),
        latencyMs: Date.now() - started,
        details: { error: error instanceof Error ? error.message : "Health probe failed." },
      }) as ComponentHealth;
    }
  }
}

export function createHealthProbe(component: HealthProbe["component"], check: HealthProbe["check"]): HealthProbe {
  return { component, check };
}
