// src/config/validation.schema.ts

import Joi from 'joi';

export const validationSchema = Joi.object({
  // ENV
  SERVER_RUNTIME: Joi.string().valid('local', 'test', 'prod').required(),
  SERVER_PORT: Joi.number().required(),
  SERVER_SERVICE_NAME: Joi.string().required(),

  // DB
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().required(),
  DB_ID: Joi.string().required(),
  DB_PW: Joi.string().required(),
  DB_NAME: Joi.string().required(),

  // AUTH
  JWT_SECRET: Joi.string().required(),
  ACCESS_TOKEN_EXPIRY: Joi.string().required(),
  REFRESH_TOKEN_EXPIRY: Joi.string().required(),

  // Redis
  REDIS_ID: Joi.string().required(),
  REDIS_PW: Joi.string().required(),
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.string().required(),

  // Swagger API
  SERVICE_NAME: Joi.string().required(),
  SWAGGER_ID: Joi.string().required(),
  SWAGGER_PW: Joi.string().required(),
});
