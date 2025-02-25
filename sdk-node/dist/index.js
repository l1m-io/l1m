"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.L1MClient = void 0;
const axios_1 = __importDefault(require("axios"));
class L1MClient {
    constructor(options) {
        this.baseUrl = (options === null || options === void 0 ? void 0 : options.baseUrl) || 'https://api.l1m.com';
        this.client = axios_1.default.create({
            baseURL: this.baseUrl,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
    structured(input, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const { raw, url, schema } = input;
            const { provider, cacheKey } = options || {};
            const result = yield this.client.post('/structured', {
                raw,
                url,
                schema,
            }, {
                headers: Object.assign(Object.assign({}, (provider ? {
                    "x-provider-model": provider.model,
                    "x-provider-url": provider.url,
                    "x-provider-key": provider.key
                } : {})), (cacheKey ? {
                    "x-cache-key": cacheKey
                } : {}))
            });
            if (result.status !== 200) {
                throw new Error(`Request failed with status ${result.status}`);
            }
            return result.data;
        });
    }
}
exports.L1MClient = L1MClient;
exports.default = L1MClient;
//# sourceMappingURL=index.js.map