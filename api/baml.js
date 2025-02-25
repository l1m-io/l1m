"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.structured = exports.buildClientRegistry = void 0;
const baml_client_1 = require("./baml_client");
const type_builder_1 = __importDefault(require("./baml_client/type_builder"));
const baml_1 = require("@boundaryml/baml");
const addJsonProperty = ({ tb, cb, property, key }) => {
    if (property.type === "string") {
        cb.addProperty(key, tb.string());
    }
    if (property.type === "number") {
        cb.addProperty(key, tb.float());
    }
    if (property.type === "boolean") {
        cb.addProperty(key, tb.bool());
    }
    if (property.type === "object" && property.properties) {
        const nestedCb = tb.addClass(key);
        Object.keys(property.properties).forEach(key => addJsonProperty({
            tb,
            cb: nestedCb,
            property: property.properties[key],
            key
        }));
        cb.addProperty(key, nestedCb.type());
    }
    if (property.type === "array") {
        if (property.items) {
            const nestedCb = tb.addClass(key);
            if (Array.isArray(property.items)) {
                addJsonProperty({
                    tb,
                    cb: nestedCb,
                    property: property.items[0],
                    key: `${key}_item`
                });
            }
            else {
                addJsonProperty({
                    tb,
                    cb: nestedCb,
                    property: property.items,
                    key: `${key}_item`
                });
            }
            cb.addProperty(key, tb.list(nestedCb.type()));
        }
        else {
            // Default to string
            cb.addProperty(key, tb.list(tb.string()));
        }
    }
};
const buildClientRegistry = (provider) => {
    const clientRegistry = new baml_1.ClientRegistry();
    if (!provider.url || !provider.key || !provider.model) {
        clientRegistry.addLlmClient("bedrock", "aws-bedrock", {
            model: process.env.DEFAULT_BEDROCK_MODEL
        });
        clientRegistry.setPrimary("bedrock");
        return clientRegistry;
    }
    if (provider.url.includes("api.openai.com")) {
        clientRegistry.addLlmClient("openai", "openai", {
            api_key: provider.key,
            model: provider.model,
        });
        clientRegistry.setPrimary("openai");
    }
    else if (provider.url.includes("api.anthropic.com")) {
        clientRegistry.addLlmClient("anthropic", "anthropic", {
            api_key: provider.key,
            model: provider.model,
            headers: {
                "x-api-key": provider.key
            }
        });
        clientRegistry.setPrimary("anthropic");
    }
    else {
        clientRegistry.addLlmClient("custom", "openai-generic", {
            base_url: provider.url,
            api_key: provider.key,
            model: provider.model,
        });
        clientRegistry.setPrimary("custom");
    }
    return clientRegistry;
};
exports.buildClientRegistry = buildClientRegistry;
const structured = async ({ raw, type, schema, clientRegistry }) => {
    const tb = new type_builder_1.default();
    if (schema.type === "object" && schema.properties) {
        Object.keys(schema.properties).forEach(key => addJsonProperty({
            tb,
            cb: tb.Dynamic,
            property: schema.properties[key],
            key
        }));
    }
    else {
        throw new Error("Schema must be an object");
    }
    if (type && type.startsWith("image/")) {
        return await baml_client_1.b.ExtractImage(baml_1.Image.fromBase64(type, raw), { tb, clientRegistry });
    }
    return await baml_client_1.b.ExtractString(raw, { tb, clientRegistry });
};
exports.structured = structured;
