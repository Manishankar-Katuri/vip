import { Injectable } from "@nestjs/common";

import type {
  AIContentProvider,
  ScriptGenerationInput,
  ScriptGenerationOutput
} from "./ai-content-provider";

@Injectable()
export class MockContentProvider implements AIContentProvider {
  async generateScript(
    input:ScriptGenerationInput
  ):Promise<ScriptGenerationOutput> {
    const hooks = await this.generateHooks(input);
    const ctas = await this.generateCTAs(input);
    const caption = await this.generateCaption(input);
    const specialty = input.hospital.specialty ?? "healthcare";
    const audience = input.targetAudience || input.brandVoice?.audience || "patients";
    const tone = input.tone || input.brandVoice?.tone || "clear and reassuring";

    return {
      hook:hooks[0],
      script:[
        `Open with a direct patient problem around ${input.title}.`,
        `Explain why ${specialty} patients should care, using a ${tone} tone.`,
        `Show one practical example connected to ${input.hospital.name}.`,
        `Close with a simple next step for ${audience}.`
      ].join("\n\n"),
      caption,
      cta:ctas[0],
      hashtags:this.hashtagsFor(input),
      metadata:{
        provider:"mock",
        goal:input.goal,
        contentCategory:input.contentCategory,
        brandVoiceIncluded:Boolean(input.brandVoice)
      }
    };
  }

  async generateCaption(
    input:ScriptGenerationInput
  ) {
    const specialty = input.hospital.specialty ?? "healthcare";

    return `${input.title}: a ${specialty} reminder from ${input.hospital.name}. ${input.brandVoice?.messaging ?? "Small decisions can create better outcomes."}`;
  }

  async generateHooks(
    input:ScriptGenerationInput
  ) {
    return [
      `Most people miss this ${input.hospital.specialty ?? "health"} signal.`,
      `If you are planning ${input.title.toLowerCase()}, start here.`,
      `One simple habit can change how patients approach ${input.contentCategory.toLowerCase()}.`
    ];
  }

  async generateCTAs(
    input:ScriptGenerationInput
  ) {
    return [
      `Book a consultation with ${input.hospital.name}.`,
      "Save this before your next appointment.",
      "Share this with someone who needs a clearer next step."
    ];
  }

  private hashtagsFor(
    input:ScriptGenerationInput
  ) {
    const specialty = (input.hospital.specialty ?? "healthcare")
      .replace(/\s+/g, "");
    const city = (input.hospital.city ?? "India").replace(/\s+/g, "");

    return [
      `#${specialty}`,
      `#${city}Doctors`,
      "#PatientEducation",
      "#HealthcareMarketing",
      "#VIPContent"
    ];
  }
}
