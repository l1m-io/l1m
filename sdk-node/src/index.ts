import axios, { AxiosInstance } from 'axios';
import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

type ClientOptions = {
  baseUrl?: string;
  /**
   * Optional default provider details. This can be overridden per request
   */
  provider?: {
    model: string,
    url: string,
    key: string,
  }
};

type StructuredRequestInput<T extends z.ZodObject<any> | unknown> = {
  /**
   * String input (Base64 encoded if image data)
   */
  input: string;
  /**
   * Json Schema (or Zod) to be returned
   */
  schema: T;
};

type RequestOptions = {
  /**
   * Provider details, optional if the client is initialized with a provider
   */
  provider: {
    model: string,
    url: string,
    key: string,
  },
  /**
   * Optional cache key
   */
  cacheKey?: string
};

export class L1M {
  private baseUrl: string;
  private client: AxiosInstance;
  private provider?: RequestOptions['provider'];

  constructor(options?: ClientOptions) {
    this.baseUrl = options?.baseUrl || 'https://api.l1m.io';

    this.provider = options?.provider;

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async structured<T extends z.ZodObject<any>, TOutput = z.infer<T>>({ input, schema }: StructuredRequestInput<T>, options?: RequestOptions): Promise<TOutput> {
    const cacheKey = options?.cacheKey;

    const provider = this.provider ?? options?.provider;

    if (!provider) {
      throw new Error('No provider specified');
    }

    const result = await this.client.post('/structured', {
      input,
      schema: zodToJsonSchema(schema)
    }, {
        headers: {
          "x-provider-model": provider.model,
          "x-provider-url": provider.url,
          "x-provider-key": provider.key,
          ...(cacheKey ? {
            "x-cache-key": cacheKey
          } : {})
        }
      });

    return result.data;
  }
}

export default L1M;
