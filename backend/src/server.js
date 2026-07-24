import app from './app.js';
import config from './config/env.js';
import connectDB from './config/db.js';

const startServer = async () => {
  await connectDB();

  const server = app.listen(config.port, () => {
    console.log(
      `Server running in ${config.nodeEnv} mode on port ${config.port}`
    );
  });

  const shutdown = (signal) => {
    console.log(`${signal} received. Shutting down gracefully...`);
    server.close(() => {
      console.log('Server closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

startServer();
