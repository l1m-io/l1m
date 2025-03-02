import { collectDescriptions, minimalSchema, validateResult } from "./schema";
import { Schema } from "jsonschema";
import retry from "async-retry";

import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI, Part } from "@google/generative-ai";

interface ProviderConfig {
  url: string;
  key: string;
  model: string;
}

type ProviderFunc = (params: StructuredParams, initialPrompt: string, previousAttempts: {raw: string, errors?: string}[]) => Promise<string>;

interface StructuredParams {
  input: string;
  type?: string;
  instruction?: string;
  schema: Schema;
  provider: ProviderConfig | ProviderFunc;
  maxAttempts?: number;
}

/**
 * Process structured data from different providers
 */
export const structured = async (params: StructuredParams) => {
  const { schema, provider, maxAttempts = 1 } = params;

  const prompt = `Answer in JSON using this schema:\n${minimalSchema(schema)}\n${collectDescriptions(schema)}`;

  const previousAttempts: {raw: string, errors?: string}[] = [];

  return await retry(async (_, attempts) => {
    let processingResult: {
      raw: string;
      structured: Record<string, any> | null;
    } = {
      raw: "",
      structured: null,
    };

    const last2Attempts = previousAttempts.slice(-2);

    if (typeof provider === "function") {
      processingResult = await processWithCustomHandler({...params, provider}, prompt, last2Attempts);
    } else {
      if (provider.url.includes("generativelanguage.googleapis.com")) {
        processingResult = await processWithGoogle({...params, provider}, prompt, last2Attempts);
      } else if (provider.url.includes("api.anthropic.com")) {
        processingResult = await processWithAnthropic({...params, provider}, prompt, last2Attempts);
      } else {
        // Default to OpenAI if no more-specific provider is inferred
        processingResult = await processWithOpenAI({...params, provider}, prompt, previousAttempts);
      }
    }

    const validationResult = validateResult(schema, processingResult.structured);

    if (!validationResult.valid) {
      previousAttempts.push({
        raw: processingResult.raw,
        errors: validationResult.errors ? JSON.stringify(validationResult.errors, null, 2) : undefined,
      });
      if (attempts <= maxAttempts) {
        throw new Error("Failed to validate result");
      }
    }

    return {
      raw: processingResult.raw,
      structured: processingResult.structured,
      attempts,
      ...validationResult,
    };
  }, {
    retries: maxAttempts - 1
  });
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
  initialPrompt: string,
  previousAttempts: {raw: string, errors?: string}[]
) => {
  const text = await params.provider(params, initialPrompt, previousAttempts);

  if (!text) {
    throw new Error("Custom Provider returned invalid response");
  }

  return parseJsonSubstring(text);
};

const processWithGoogle = async (
  params: StructuredParams & { provider: ProviderConfig },
  initialPrompt: string,
  previousAttempts: {raw: string, errors?: string}[]
) => {
  const { input, type, instruction, provider } = params;
  const google = new GoogleGenerativeAI(provider.key);
  const model = google.getGenerativeModel({ model: provider.model });

  const parts: Part[] = [];

  if (type && type.startsWith("image/")) {
    parts.push({ text: `${instruction} ${initialPrompt}` });
    parts.push({
      inlineData: {
        data: input,
        mimeType: type,
      },
    });
  } else {
    parts.push({ text: `${input} ${instruction} ${initialPrompt}` });
  }

  previousAttempts.forEach((attempt) => {
    parts.push({ text: "You previously responded: " + attempt.raw + " which produced validation errors: " + attempt.errors });
  });

  const result = await model.generateContent(parts);
  const text = result.response.text();

  if (!text) {
    throw new Error("Google API returned invalid response");
  }

  return parseJsonSubstring(text);
};


const processWithAnthropic = async (
  params: StructuredParams & { provider: ProviderConfig },
  initialPrompt: string,
  previousAttempts: {raw: string, errors?: string}[]
) => {
  const { input, type, instruction, provider } = params;
  const anthropic = new Anthropic({
    apiKey: provider.key,
  });

  const messages: Anthropic.MessageParam[] = [];

  if (type && type.startsWith("image/")) {
    messages.push({
      role: "user",
      content: [
        { type: "text", text: `${instruction} ${initialPrompt}` },
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
      content: `${input} ${instruction} ${initialPrompt}`,
    });
  }

  if (previousAttempts.length > 0) {
    previousAttempts.forEach((attempt) => {
      messages.push({
        role: "user",
        content: "You previously responded: " + attempt.raw + " which produced validation errors: " + attempt.errors,
      });
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
  initialPrompt: string,
  previousAttempts: {raw: string, errors?: string}[]
) => {
  const { input, type, instruction, provider } = params;
  const openai = new OpenAI({
    apiKey: provider.key,
    baseURL: provider.url,
  });

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

  if (type && type.startsWith("image/")) {
    messages.push({
      role: "user",
      content: `${instruction} ${initialPrompt}`,
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
      content: `${input} ${instruction} ${initialPrompt}`,
    });
  }

  if (previousAttempts.length > 0) {
    previousAttempts.forEach((attempt) => {
      messages.push({
        role: "user",
        content: "You previously responded: " + attempt.raw + " which produced validation errors: " + attempt.errors,
      });
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
