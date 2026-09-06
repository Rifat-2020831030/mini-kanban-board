import "dotenv/config";
import { defineConfig, env } from "@prisma/config";
import type { PrismaConfig } from "prisma";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
  migrations: {
    path: "prisma/migrations",
  },
}) satisfies PrismaConfig;
