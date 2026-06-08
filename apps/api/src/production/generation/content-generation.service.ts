import { Injectable } from "@nestjs/common";

import type {
  AIContentProvider,
  ScriptGenerationInput
} from "./ai-content-provider";
import { MockContentProvider } from "./mock-content-provider";

@Injectable()
export class ContentGenerationService {
  constructor(
    private readonly provider:MockContentProvider
  ) {}

  generateScript(
    input:ScriptGenerationInput
  ) {
    return this.activeProvider().generateScript(input);
  }

  generateCaption(
    input:ScriptGenerationInput
  ) {
    return this.activeProvider().generateCaption(input);
  }

  generateHooks(
    input:ScriptGenerationInput
  ) {
    return this.activeProvider().generateHooks(input);
  }

  generateCTAs(
    input:ScriptGenerationInput
  ) {
    return this.activeProvider().generateCTAs(input);
  }

  private activeProvider():AIContentProvider {
    return this.provider;
  }
}
