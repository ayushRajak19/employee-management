import mongoose from "mongoose";
import { env } from "./env.js";

const migrateAttendanceIndexes = async (): Promise<void> => {
  const attendance = mongoose.connection.collection("attendances");
  let indexes: Awaited<ReturnType<typeof attendance.indexes>> = [];
  try { indexes = await attendance.indexes(); }
  catch (error: unknown) {
    if (!(error instanceof mongoose.mongo.MongoServerError) || error.code !== 26) throw error;
  }
  const legacy = indexes.find((index) => index.unique && index.key.employee === 1 && index.key.date === 1 && index.key.dateKey === undefined);
  if (legacy?.name) await attendance.dropIndex(legacy.name);
  await attendance.createIndex({ employee: 1, dateKey: 1 }, { unique: true, name: "employee_1_dateKey_1" });
};

export const connectDatabase = async (): Promise<void> => {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.MONGODB_URI, {
    autoIndex: env.NODE_ENV !== "production",
    serverSelectionTimeoutMS: 10_000
  });
  await migrateAttendanceIndexes();
};

export const disconnectDatabase = async (): Promise<void> => mongoose.disconnect();
