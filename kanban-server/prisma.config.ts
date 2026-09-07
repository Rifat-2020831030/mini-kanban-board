import { defineConfig, env } from "@prisma/config";
import "dotenv/config";
import type { PrismaConfig } from "prisma";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DIRECT_URL"),
  },
  migrations: {
    path: "prisma/migrations",
  },
}) satisfies PrismaConfig;
