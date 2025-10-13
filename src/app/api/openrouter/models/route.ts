import { NextResponse } from "next/server";
import { env } from "@/lib/config/env";

const FALLBACK_BASE_URL = "https://openrouter.ai/api/v1";

type OpenRouterModelResponse = {
  data?: Array<{
    id: string;
    name?: string;
    description?: string;
    context_length?: number;
    pricing?: {
      prompt?: number;
      completion?: number;
    };
  }>;
};

export const dynamic = "force-dynamic";

/**
 * Retrieve available models from the OpenRouter API.
 */
export async function GET() {
  const apiKey = env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "OpenRouter API key is not configured. Set OPENROUTER_API_KEY on the server.",
      },
      { status: 500 }
    );
  }

  const baseUrl =
    env.OPENROUTER_API_BASE_URL && env.OPENROUTER_API_BASE_URL.length > 0
      ? env.OPENROUTER_API_BASE_URL
      : FALLBACK_BASE_URL;

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/models`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": env.FRONTEND_URL || "https://codecat.dev",
        "X-Title": "CodeCat Dashboard",
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      const message =
        (errorBody && (errorBody.error || errorBody.message)) ||
        `OpenRouter request failed with status ${response.status}`;

      return NextResponse.json(
        { error: message },
        { status: response.status }
      );
    }

    const payload = (await response.json()) as OpenRouterModelResponse;

    const models =
      payload.data?.map((model) => ({
        id: model.id,
        name: model.name ?? model.id,
        description: model.description ?? "",
        contextLength: model.context_length ?? null,
        pricing: {
          prompt: model.pricing?.prompt ?? null,
          completion: model.pricing?.completion ?? null,
        },
      })) ?? [];

    return NextResponse.json({ models });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error contacting OpenRouter";
    return NextResponse.json(
      { error: `Failed to fetch OpenRouter models: ${message}` },
      { status: 502 }
    );
  }
}

