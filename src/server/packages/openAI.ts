import { z } from "zod";
import OpenAi from "openai";
import { env } from "~/env.mjs";
import { TRPCError } from "@trpc/server";
const openAi = new OpenAi({ apiKey: env.OPENAI_API_KEY });

export interface BaseMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

export interface Tool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: {
      input: {
        type: string;
      };
    };
    additionalProperties: boolean;
    $schema: string;
  };
}

export function addSystemMessage(content: string): BaseMessage {
  return {
    role: "system",
    content,
  };
}

export function addUserMessage(content: string): BaseMessage {
  return {
    role: "user",
    content,
  };
}

export function addAIMessage(content: string): BaseMessage {
  return {
    role: "assistant",
    content,
  };
}

export async function createEmbedding(content: string) {
  const embeddingSchema = z.number().array();
  const embeddingResponse = await openAi.embeddings.create({
    input: content,
    model: "text-embedding-ada-002",
  });

  const embedding = embeddingResponse.data[0]?.embedding;
  const parseResult = embeddingSchema.safeParse(embedding);

  if (!parseResult.success)
    throw new TRPCError({
      message: "failed to create embedding",
      code: "INTERNAL_SERVER_ERROR",
    });

  return parseResult.data;
}

export async function createAnswer(
  messages: BaseMessage[],
  tools: Tool[] | null,
  temperature: number,
) {
  console.log(temperature);
  const request: OpenAi.Chat.Completions.CompletionCreateParamsNonStreaming = {
    messages,
    model: "gpt-3.5-turbo-16k-0613",
    temperature: temperature,
  };

  if (tools) {
    request.functions = tools;
  }

  const response = await openAi.chat.completions.create(request);
  return response;
}
