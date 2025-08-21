import { SQLDatabase } from 'encore.dev/storage/sqldb';

export const userDB = new SQLDatabase("users", {
  migrations: "./migrations",
});
