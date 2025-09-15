import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle/sqlite",
  schema: "./src/db/sqlite-schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: Deno.env.get("SQLITE_DB_PATH") || "./data/trendfinder.db"
  },
});