interface JSONSchema {
  type?: string;
  properties?: Record<string, JSONSchema>;
  enum?: any[];
  items?: JSONSchema;
  description?: string;
  [key: string]: any;
}

/**
 * Converts a JSON Schema to a minimal DSL representation
 * @param schema The JSON Schema to convert
 * @returns A string representation in the minimal DSL format
 */
function convertJsonSchemaToDSL(schema: JSONSchema): string {
  if (!schema) return '';

  // Handle enum types
  if (schema.enum && Array.isArray(schema.enum)) {
    return schema.enum.map(value =>
      typeof value === 'string' ? `'${value}'` : value
    ).join(' or ');
  }

  // Handle different types
  switch (schema.type) {
    case 'string':
      return 'string';
    case 'number':
    case 'integer':
      return 'float';
    case 'boolean':
      return 'boolean';
    case 'null':
      return 'null';
    case 'array':
      // If items is defined, process the items schema
      if (schema.items) {
        const itemsType = convertJsonSchemaToDSL(schema.items);

        // If items is an object with properties, we need to represent it as an array of objects
        if (schema.items.type === 'object' && schema.items.properties) {
          return `[ ${itemsType} ]`;
        }

        return `${itemsType}[]`;
      }
      return 'string[]'; // Default to string[] if items not specified
    case 'object':
      if (!schema.properties) return '{}';

      const properties = Object.entries(schema.properties)
        .map(([key, propSchema]) => {
          const propValue = convertJsonSchemaToDSL(propSchema as JSONSchema);
          return `${key}: ${propValue}`;
        })
        .join(', ');

      return `{ ${properties} }`;
    default:
      return 'any';
  }
}

/**
 * Main function to convert JSON Schema to formatted DSL
 * @param schema The JSON Schema object
 * @returns Formatted DSL string
 */
function jsonSchemaToDSL(schema: JSONSchema): string {
  const dsl = convertJsonSchemaToDSL(schema);
  return dsl;
}
