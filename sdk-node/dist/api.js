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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiService = void 0;
class ApiService {
    constructor(client) {
        this.client = client;
    }
    get(path, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.client.get(path, { params });
            return {
                data: response.data,
                status: response.status
            };
        });
    }
    post(path, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.client.post(path, data);
            return {
                data: response.data,
                status: response.status
            };
        });
    }
    put(path, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.client.put(path, data);
            return {
                data: response.data,
                status: response.status
            };
        });
    }
    delete(path) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.client.delete(path);
            return {
                data: response.data,
                status: response.status
            };
        });
    }
}
exports.ApiService = ApiService;
//# sourceMappingURL=api.js.map