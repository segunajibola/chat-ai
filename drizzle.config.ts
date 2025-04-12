import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env" });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./migrations", // migrationsfolder
  dialect: "postgresql", //db we are using, wecanusedrizzlewithother dbs
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
// config file for dizzle or drizzle kit for them to know where the schema are and where the migration will go;
