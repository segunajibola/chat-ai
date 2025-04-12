import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { config } from "dotenv";

// npm i - D drizzle-kit;
// neon to use postgress db
// drizzle is an orm to interact with db, typescrit base. neon db serverless adapter, => npm i drizzle-orm @neondatabase/serverless
// drizzle kit is a cli and we can run migration there => npm i -D drizzle-kitdat
// Load env vars

config({ path: ".env" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is undefined");
}

// Init Neon client
const sql = neon(process.env.DATABASE_URL);

// Init Drizzle
export const db = drizzle(sql);
