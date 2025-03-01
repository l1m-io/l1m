import { collectDescriptions, minimalSchema, validateResult } from "./schema";
import { Schema } from "jsonschema";

import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI, Part } from "@google/generative-ai";

interface ProviderConfig {
  url: string;
  key: string;
  model: string;
}

type ProviderFunc = (params: StructuredParams, minimal: string, descriptions: string) => Promise<string>;

interface StructuredParams {
  input: string;
  type?: string;
  instruction?: string;
  schema: Schema;
  provider: ProviderConfig | ProviderFunc;
}

/**
 * Process structured data from different providers
 */
export const structured = async (params: StructuredParams) => {
  const { schema, provider } = params;

  const minimal = minimalSchema(schema);
  const descriptions = collectDescriptions(schema);

  let result: {
    raw: string;
    structured: Record<string, any> | null;
  } = {
    raw: "",
    structured: null,
  };

  if (typeof provider === "function") {
    result = await processWithCustomHandler({...params, provider}, minimal, descriptions);
  } else {
    if (provider.url.includes("generativelanguage.googleapis.com")) {
      result = await processWithGoogle({...params, provider}, minimal, descriptions);
    }

    if (provider.url.includes("api.anthropic.com")) {
      result = await processWithAnthropic({...params, provider}, minimal, descriptions);
    }

    // Default to OpenAI if no more-specific provider is inferred
    result = await processWithOpenAI({...params, provider}, minimal, descriptions);
  }


  return {
    raw: result.raw,
    structured: result.structured,
    ...validateResult(schema, result.structured),
  };
};

/**
 * Extracts and parses a JSON object from a string
 */
export const parseJsonSubstring = (raw: string) => {
  const simpleMatch = raw.match(/{.*}/s)?.reverse();
  const standaloneMatches = raw.match(/\{[\s\S]*?\}/g)?.reverse();

  const matches = [...(simpleMatch ?? []), ...(standaloneMatches ?? [])];

  for (const match of matches) {
    if (!match) {
      continue;
    }

    try {
      return {
        raw,
        structured: JSON.parse(match),
      };
    } catch (e) {
      continue;
    }
  }

  return {
    raw,
    structured: null,
  };
};


const processWithCustomHandler = async (
  params: StructuredParams & { provider: ProviderFunc },
  minimal: string,
  descriptions: string
) => {
  const text = await params.provider(params, minimal, descriptions);

  if (!text) {
    throw new Error("Custom Provider returned invalid response");
  }

  return parseJsonSubstring(text);
};

const processWithGoogle = async (
  params: StructuredParams & { provider: ProviderConfig },
  minimal: string,
  descriptions: string
) => {
  const { input, type, instruction, provider } = params;
  const google = new GoogleGenerativeAI(provider.key);
  const model = google.getGenerativeModel({ model: provider.model });

  const parts: Part[] = [];
  const promptText = `Answer in JSON using this schema: ${descriptions} ${minimal}`;

  if (type && type.startsWith("image/")) {
    parts.push({ text: `${instruction} ${promptText}` });
    parts.push({
      inlineData: {
        data: input,
        mimeType: type,
      },
    });
  } else {
    parts.push({ text: `${input} ${instruction} ${promptText}` });
  }

  const result = await model.generateContent(parts);
  const text = result.response.text();

  if (!text) {
    throw new Error("Google API returned invalid response");
  }

  return parseJsonSubstring(text);
};


const processWithAnthropic = async (
  params: StructuredParams & { provider: ProviderConfig },
  minimal: string,
  descriptions: string
) => {
  const { input, type, instruction, provider } = params;
  const anthropic = new Anthropic({
    apiKey: provider.key,
  });

  const messages: Anthropic.MessageParam[] = [];
  const promptText = `Answer in JSON using this schema: ${descriptions} ${minimal}`;

  if (type && type.startsWith("image/")) {
    messages.push({
      role: "user",
      content: [
        { type: "text", text: `${instruction} ${promptText}` },
        {
          type: "image",
          source: {
            type: "base64",
            media_type: type as any,
            data: input,
          },
        },
      ],
    });
  } else {
    messages.push({
      role: "user",
      content: `${input} ${instruction} ${promptText}`,
    });
  }

  const response = await anthropic.messages.create({
    model: provider.model,
    messages,
    max_tokens: 1024,
  });

  if (response.content[0]?.type === "text") {
    return parseJsonSubstring(response.content[0].text);
  } else {
    throw new Error("Anthropic API returned invalid response");
  }
};

const processWithOpenAI = async (
  params: StructuredParams & { provider: ProviderConfig },
  minimal: string,
  descriptions: string
) => {
  const { input, type, instruction, provider } = params;
  const openai = new OpenAI({
    apiKey: provider.key,
    baseURL: provider.url,
  });

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
  const promptText = `Answer in JSON using this schema: ${descriptions} ${minimal}`;

  if (type && type.startsWith("image/")) {
    messages.push({
      role: "user",
      content: `${instruction} ${promptText}`,
    });

    messages.push({
      role: "user",
      content: [
        {
          type: "image_url",
          image_url: {
            url: `data:${type};base64,${input}`,
          },
        },
      ],
    });
  } else {
    messages.push({
      role: "user",
      content: `${input} ${instruction} ${promptText}`,
    });
  }

  const completion = await openai.chat.completions.create({
    model: provider.model,
    messages,
  });

  if (!completion.choices[0].message.content) {
    throw new Error("OpenAI API returned invalid response");
  }

  return parseJsonSubstring(completion.choices[0].message.content);
};
