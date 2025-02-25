export interface L1MOptions {
    apiKey: string;
    baseUrl?: string;
}
export interface L1MResponse<T> {
    data: T;
    status: number;
}
