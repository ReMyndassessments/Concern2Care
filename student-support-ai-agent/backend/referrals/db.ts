import { SQLDatabase } from 'encore.dev/storage/sqldb';

export const referralDB = new SQLDatabase("referrals", {
  migrations: "./migrations",
});
