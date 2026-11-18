import pg from "pg";

const connectionString = process.env.DATABASE_URL || "postgresql://leasing:leasing@postgres:5432/leasing";

for (let attempt = 1; attempt <= 60; attempt += 1) {
  const client = new pg.Client({ connectionString, connectionTimeoutMillis: 2000 });
  try {
    await client.connect();
    await client.query("SELECT 1");
    await client.end();
    process.stdout.write("database is ready\n");
    process.exit(0);
  } catch (error) {
    try {
      await client.end();
    } catch {
      // The server was never reached.
    }
    process.stderr.write(`waiting for database (${attempt}/60)\n`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

process.stderr.write("database did not become ready\n");
process.exit(1);
