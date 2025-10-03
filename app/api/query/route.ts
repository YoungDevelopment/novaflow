import { NextResponse } from "next/server";
import { turso } from "@/lib/turso";

export async function POST(req: Request) {
  try {
    // ✅ Correct SQL (no `{`)
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT UNIQUE
      )
    `);

    const body = await req.json();
    const { name, email } = body;

    const result = await turso.execute({
      sql: "INSERT INTO users (name, email) VALUES (?, ?)",
      args: [name, email],
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Error inserting user:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// To test this endpoint, you can use the following curl command:
// curl -X POST http://localhost:3000/api/users \
//   -H "Content-Type: application/json" \
//   -d '{"name":"Alice","email":"alice@example.com"}'
