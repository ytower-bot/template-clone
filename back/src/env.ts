import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

export const env = schema.parse({
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
});
