import { AxiosInstance } from 'axios';
import { L1MResponse } from './types';
export declare class ApiService {
    private client;
    constructor(client: AxiosInstance);
    get<T>(path: string, params?: Record<string, any>): Promise<L1MResponse<T>>;
    post<T>(path: string, data?: any): Promise<L1MResponse<T>>;
    put<T>(path: string, data?: any): Promise<L1MResponse<T>>;
    delete<T>(path: string): Promise<L1MResponse<T>>;
}
