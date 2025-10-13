/**
 * Normalized OpenRouter model definition returned by the API route.
 */
export type OpenRouterModel = {
  /** Unique model identifier (e.g., anthropic/claude-3.5-sonnet) */
  id: string;
  /** Human readable model name */
  name: string;
  /** Optional description provided by OpenRouter */
  description?: string;
  /** Maximum context length if supplied */
  contextLength: number | null;
  pricing: {
    prompt: number | null;
    completion: number | null;
  };
};

export type OpenRouterModelsResponse = {
  models: OpenRouterModel[];
};
