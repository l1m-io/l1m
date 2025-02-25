import axios, { AxiosInstance } from 'axios';

type ClientOptions = {
  baseUrl?: string;
};

type StructuredRequestInput = {
  raw?: string;
  url?: string;
  schema?: unknown;
};

type RequestOptions = {
  provider?: {
    model: string,
    url: string,
    key: string,
  },
  cacheKey?: string
};

export class L1M {
  private baseUrl: string;
  private client: AxiosInstance;

  constructor(options?: ClientOptions) {
    this.baseUrl = options?.baseUrl || 'http://localhost:3000';

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async structured(input: StructuredRequestInput, options?: RequestOptions): Promise<unknown> {
    const { raw, url, schema } = input;
    const { provider, cacheKey } = options || {};

    const result = await this.client.post('/structured', {
      raw,
      url,
      schema,
    }, {
      headers: {
        ...(provider ? {
          "x-provider-model": provider.model,
          "x-provider-url": provider.url,
          "x-provider-key": provider.key
        } : {}),
        ...(cacheKey ? {
          "x-cache-key": cacheKey
        } : {})

      }
    });

    return result.data;
  }
}

export default L1M;
