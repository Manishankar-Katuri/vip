import type { SaveStrategyOptions, StrategyRepository } from "../interfaces";
import type { StrategySnapshotRecord, WeeklyStrategy } from "../types";
import { validateWeeklyStrategy } from "../validation";

export class StrategyPersistenceService {
  constructor(private readonly repository: StrategyRepository) {}

  persistWeeklyStrategy(
    strategy: WeeklyStrategy,
    options: SaveStrategyOptions
  ): Promise<StrategySnapshotRecord> {
    validateWeeklyStrategy(strategy);
    return this.repository.saveWeeklyStrategy(strategy, options);
  }
}
