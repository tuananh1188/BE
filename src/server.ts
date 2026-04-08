import { app } from './app';
import { connectDb } from './config/db';
import { env } from './config/env';

const start = async () => {
  await connectDb();
  app.listen(env.port, () => {
    console.log(`Backend running at http://localhost:${env.port}`);
  });
};

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
