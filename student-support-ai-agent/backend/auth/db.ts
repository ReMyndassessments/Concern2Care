import { SQLDatabase } from 'encore.dev/storage/sqldb';

// The auth database contains user session information.
export const authDB = new SQLDatabase("auth", {
  migrations: "./migrations",
});
