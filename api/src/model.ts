import { Schema } from "jsonschema";

import OpenAI from "openai";
import { collectDescriptions, minimalSchema } from "./schema";

export const structured = async ({
  input,
  type,
  instruction = "",
  schema,
  provider,
}: {
    input: string;
    type?: string;
    instruction?: string;
    schema: Schema;
    provider: {
      url: string;
      key: string;
      model: string;
    };
  }) => {


  const minimal = minimalSchema(schema);
  let descriptions = collectDescriptions(schema);

  const openai = new OpenAI({
    apiKey: provider.key,
    baseURL: provider.url,
  });

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

  if (type && type.startsWith("image/")) {
    messages.push({
      role: "system", content: `${instruction} Answer in JSON using this schema: ${descriptions} ${minimal}`
    });

    messages.push({
      role: 'user',
      content: [
        {
          type: 'image_url',
          image_url: {
            url: `data:${type};base64,${input}`,
          },
        },
      ],
    });
  } else {
    messages.push({
      role: "system", content: `${input} ${instruction} Answer in JSON using this schema: ${descriptions} ${minimal}`
    });
  }

  const completion = await openai.chat.completions.create({
    model: provider.model,
    messages,
  });

  return parseJsonSubstring(completion.choices[0].message.content ?? "");
};

// Attempt to parse a JSON object substring from a string
export const parseJsonSubstring = (raw: string): unknown | undefined => {
  const jsonMatch = raw.match(/{.*}/s); // Match JSON-like content
  if (!jsonMatch) return null;

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {}
};
