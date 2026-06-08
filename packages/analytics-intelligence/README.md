# VIP Analytics Intelligence

`@vip/analytics-intelligence` converts validated analytics snapshots into predictive signals, forecasts, scored intelligence, reports, and event contracts.

## Architecture

- `analyzers/` detects viral spikes, anomalies, audience shifts, decline, acceleration, and stagnation from metric series.
- `predictors/` projects engagement trajectory, follower growth, campaign performance, decay, and opportunity windows.
- `competitors/` compares posting frequency, engagement, trend adoption, and category leadership.
- `scoring/` computes growth, content health, opportunity, audience momentum, and risk scores.
- `intelligence/` generates daily, weekly, executive, actionable, risk, and opportunity insight records.
- `services/` orchestrates a complete analysis run and persists snapshots, predictions, insights, and emitted events through repository ports.

## Intelligence Flow

An `AnalyticsSeries` is strictly validated before analysis. Signals and predictions feed scoring; scores and evidence feed insight generation. A completed run emits transport-safe event payloads for anomaly, trend, prediction, and risk consumers.

## Automation Integration

Consumers may map `analytics.anomaly.detected` and `analytics.trend.detected` into automation rules using the event `idempotencyKey` as the source operation key. `analytics.risk.detected` should require an explicit rule and approval policy before triggering execution. The analytics package does not import the automation engine, preserving an event-driven boundary.

## Future Dashboard Widgets

Dashboard projections can read persisted predictions and insights to render trajectory charts, risk banners, competitor comparison panels, and opportunity queues. Widgets should display `generatedAt`, forecast horizon, confidence, and evidence identifiers so operators can inspect the reasoning source.

## Events

- `analytics.anomaly.detected`
- `analytics.trend.detected`
- `analytics.prediction.generated`
- `analytics.risk.detected`
