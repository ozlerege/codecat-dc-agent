"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type {
  OpenRouterModel,
  OpenRouterModelsResponse,
} from "@/features/openrouter/types";
import { getErrorMessage } from "@/lib/api/types";

const QUERY_KEY = ["openrouter", "models"] as const;

/**
 * Fetch available OpenRouter models.
 */
const fetchOpenRouterModels = async (): Promise<OpenRouterModel[]> => {
  try {
    const response = await apiClient.get<OpenRouterModelsResponse>(
      "/api/openrouter/models"
    );
    return response.models;
  } catch (error) {
    throw new Error(getErrorMessage(error) ?? "Failed to load OpenRouter models");
  }
};

export const useOpenRouterModelsQuery = () =>
  useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchOpenRouterModels,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

export const openRouterModelsQueryKey = QUERY_KEY;

