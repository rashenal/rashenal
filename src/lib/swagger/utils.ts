export interface SwaggerSchema {
  openapi?: string;
  info?: {
    title: string;
    version: string;
    description?: string;
  };
  paths: Record<string, any>;
  components?: {
    schemas?: Record<string, any>;
    securitySchemes?: Record<string, any>;
  };
}

export function createSwaggerSchema(schema: Partial<SwaggerSchema>): SwaggerSchema {
  return {
    openapi: '3.0.0',
    info: {
      title: 'Rashenal API',
      version: '1.0.0',
      description: 'AI-powered personal transformation platform API'
    },
    ...schema
  };
}

export function mergeSwaggerSchemas(schemas: SwaggerSchema[]): SwaggerSchema {
  const merged: SwaggerSchema = {
    openapi: '3.0.0',
    info: {
      title: 'Rashenal API',
      version: '1.0.0',
      description: 'AI-powered personal transformation platform API'
    },
    paths: {},
    components: {
      schemas: {},
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key'
        },
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  };

  schemas.forEach(schema => {
    // Merge paths
    Object.assign(merged.paths, schema.paths);
    
    // Merge schemas
    if (schema.components?.schemas) {
      Object.assign(merged.components!.schemas!, schema.components.schemas);
    }
  });

  return merged;
}