export interface AiProvider {
  generateJson(params: {
    systemPrompt?: string;
    userPrompt: string;
    // for observability
    providerHint?: string;
  }): Promise<{ json: any }>;
}

