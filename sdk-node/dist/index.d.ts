type L1MClientOptions = {
    baseUrl?: string;
};
type StructuredRequestInput = {
    raw?: string;
    url?: string;
    schema?: unknown;
};
type RequestOptions = {
    provider?: {
        model: string;
        url: string;
        key: string;
    };
    cacheKey?: string;
};
export declare class L1MClient {
    private baseUrl;
    private client;
    constructor(options?: L1MClientOptions);
    structured(input: StructuredRequestInput, options?: RequestOptions): Promise<unknown>;
}
export default L1MClient;
