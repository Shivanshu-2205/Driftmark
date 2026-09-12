import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "8000", 10),
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017",
  mongoDb: process.env.MONGO_DB || "driftwatch_db",
  mlServiceUrl: process.env.ML_SERVICE_URL || "http://localhost:8001",
  dataDir: process.env.DATA_DIR || "./data",
  modelsDir: process.env.MODELS_DIR || "./models",
  jwtSecret: process.env.JWT_SECRET || "change_this_secret",
  jwtExpirationSeconds: parseInt(process.env.JWT_EXPIRATION_SECONDS || "86400", 10),
};
