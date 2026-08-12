import mongoose from "mongoose";
import { env } from "./env.js";

export const connectDatabase = async (): Promise<void> => {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.MONGODB_URI, { autoIndex: env.NODE_ENV !== "production" });
};

export const disconnectDatabase = async (): Promise<void> => mongoose.disconnect();
