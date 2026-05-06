import "dotenv/config"
import { drizzle } from "drizzle-orm/node-postgres"
import { migrate } from "drizzle-orm/node-postgres/migrator"
import pg from "pg"

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set")

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const db = drizzle(pool)

console.log("Applying migrations...")
await migrate(db, { migrationsFolder: "./src/lib/db/migrations" })
console.log("Migrations applied.")

await pool.end()
