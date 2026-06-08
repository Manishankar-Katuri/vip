export type ScriptGenerationInput = {
  hospital:{
    name:string;
    specialty:string | null;
    city:string | null;
  };
  brandVoice:{
    tone:string;
    style:string;
    audience:string;
    messaging:string;
  } | null;
  doctorName?:string | null;
  targetAudience:string;
  contentCategory:string;
  contentType:string;
  goal:string;
  tone:string;
  title:string;
  description:string;
};

export type ScriptGenerationOutput = {
  hook:string;
  script:string;
  caption:string;
  cta:string;
  hashtags:string[];
  metadata:Record<string, unknown>;
};

export interface AIContentProvider {
  generateScript(input:ScriptGenerationInput):Promise<ScriptGenerationOutput>;
  generateCaption(input:ScriptGenerationInput):Promise<string>;
  generateHooks(input:ScriptGenerationInput):Promise<string[]>;
  generateCTAs(input:ScriptGenerationInput):Promise<string[]>;
}
