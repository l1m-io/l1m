import axios, { AxiosInstance, AxiosError } from "axios";
import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";

type ClientOptions = {
  baseUrl?: string;
  /**
   * Optional default provider details. This can be overridden per request
   */
  provider?: {
    model: string;
    url: string;
    key: string;
  };
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
    model: string;
    url: string;
    key: string;
  };
  /**
   * Optional cache TTL in seconds
   */
  cacheTTL?: number;
};

class L1MError extends Error {
  statusCode?: number;
  body?: any;

  constructor(message: string, statusCode?: number, body?: any) {
    super(message);
    this.name = "L1MError";
    this.statusCode = statusCode;
    this.body = body;
  }
}

/**
 * L1M API Client
 */
export class L1M {
  private baseUrl: string;
  private client: AxiosInstance;
  private provider?: RequestOptions["provider"];

  constructor(options?: ClientOptions) {
    this.baseUrl = options?.baseUrl || "https://api.l1m.io";

    this.provider = options?.provider;

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   *
   * Generate a structured response from the L1M API.
   */
  async structured<T extends z.ZodObject<any>, TOutput = z.infer<T>>(
    { input, schema }: StructuredRequestInput<T>,
    options?: RequestOptions
  ): Promise<TOutput> {

    const provider = this.provider ?? options?.provider;

    if (!provider) {
      throw new L1MError("No provider specified");
    }

    try {
      const result = await this.client.post(
        "/structured",
        {
          input,
          schema: zodToJsonSchema(schema),
        },
        {
          headers: {
            "x-provider-model": provider.model,
            "x-provider-url": provider.url,
            "x-provider-key": provider.key,
            ...(options?.cacheTTL
              ? {
                  "x-cache-ttl": options.cacheTTL,
                }
              : {}),
          },
        }
      );

      return result.data?.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        const statusCode = axiosError.response?.status;
        const errorMessage =
          (axiosError.response?.data as any).message ||
          axiosError.message ||
          "An error occurred with the L1M API";
        const body = axiosError.response?.data;

        throw new L1MError(errorMessage, statusCode, body);
      }

      throw error;
    }
  }
}

export default L1M;
