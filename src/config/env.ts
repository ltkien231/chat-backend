export const loadConfig = () => ({
  env: process.env.ENV,
  database: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    dbName: process.env.DB_NAME,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
  },
  jwtSecret: process.env.JWT_SECRET,
  redis: {
    url: process.env.REDIS_URL, // Azure Redis connection string
    password: process.env.REDIS_PASSWORD, // Azure Redis access key
  },
});
