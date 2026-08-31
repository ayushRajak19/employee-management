import { randomUUID } from "node:crypto"; import path from "node:path"; import { Readable } from "node:stream"; import mongoose from "mongoose"; import { v2 as cloudinary } from "cloudinary"; import { env } from "../config/env.js"; import { AppError } from "../utils/AppError.js";
export interface StoredObject { provider: "CLOUDINARY" | "MONGODB"; key: string; format?: string; size: number }
const configured = () => { if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) throw new AppError("Private document storage is not configured", 503, "STORAGE_UNAVAILABLE"); cloudinary.config({ cloud_name: env.CLOUDINARY_CLOUD_NAME, api_key: env.CLOUDINARY_API_KEY, api_secret: env.CLOUDINARY_API_SECRET, secure: true }); };
const uploadCloudinaryPrivate = async (buffer: Buffer, folder: string): Promise<StoredObject> => { configured(); return new Promise((resolve, reject) => { const stream = cloudinary.uploader.upload_stream({ resource_type: "raw", type: "authenticated", folder, public_id: randomUUID(), overwrite: false }, (error, result) => { if (error || !result) reject(new AppError("Document upload failed", 502, "STORAGE_UPLOAD_FAILED")); else resolve({ provider: "CLOUDINARY", key: result.public_id, format: result.format, size: result.bytes }); }); stream.end(buffer); }); };
export const signedPrivateUrl = (key: string): string => { configured(); return cloudinary.url(key, { resource_type: "raw", type: "authenticated", sign_url: true, secure: true }); };
const mongoBucket = () => { if (!mongoose.connection.db) throw new AppError("Database document storage is unavailable", 503, "STORAGE_UNAVAILABLE"); return new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: "privateDocuments" }); };
const cloudinaryConfigured = () => Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);
const uploadMongoPrivate = async (buffer: Buffer, metadata: Record<string, string>): Promise<StoredObject> => new Promise((resolve, reject) => {
  const stream = mongoBucket().openUploadStream(`${randomUUID()}`, { metadata });
  stream.on("error", () => reject(new AppError("Document upload failed", 502, "STORAGE_UPLOAD_FAILED")));
  stream.on("finish", () => resolve({ provider: "MONGODB", key: stream.id.toString(), size: buffer.length }));
  Readable.from(buffer).pipe(stream);
});
export const uploadPrivate = async (buffer: Buffer, folder: string, metadata: Record<string, string> = {}): Promise<StoredObject> => {
  if (cloudinaryConfigured()) {
    try { return await uploadCloudinaryPrivate(buffer, folder); }
    catch (error) { if (!(error instanceof AppError) || error.code !== "STORAGE_UPLOAD_FAILED") throw error; }
  }
  return uploadMongoPrivate(buffer, { ...metadata, folder, category: metadata.category ?? "EMPLOYEE_DOCUMENT" });
};
export const uploadProfilePhoto = async (buffer: Buffer, employeeId: string, mimeType: string): Promise<string> => {
  if (cloudinaryConfigured()) { configured(); return new Promise((resolve, reject) => { const stream = cloudinary.uploader.upload_stream({ resource_type: "image", type: "upload", folder: `mobiusbloom-employee/${employeeId}/profile`, public_id: "avatar", overwrite: true, invalidate: true, transformation: [{ width: 600, height: 600, crop: "fill", gravity: "face", quality: "auto", fetch_format: "auto" }] }, (error, result) => { if (error || !result) reject(new AppError("Profile photo upload failed", 502, "PROFILE_PHOTO_UPLOAD_FAILED")); else resolve(result.public_id); }); stream.end(buffer); }); }
  return new Promise((resolve, reject) => { const stream = mongoBucket().openUploadStream(`${employeeId}-${randomUUID()}`, { metadata: { mimeType, category: "PROFILE_PHOTO", employeeId } }); stream.on("error", () => reject(new AppError("Profile photo upload failed", 502, "PROFILE_PHOTO_UPLOAD_FAILED"))); stream.on("finish", () => resolve(`mongo:${stream.id.toString()}`)); Readable.from(buffer).pipe(stream); });
};
export const profilePhotoUrl = (key?: string): string | undefined => { if (!key) return undefined; if (key.startsWith("mongo:")) return `/api/v1/employees/profile-photos/${key.slice(6)}`; if (!cloudinaryConfigured()) return undefined; configured(); return cloudinary.url(key, { resource_type: "image", type: "upload", secure: true, transformation: [{ width: 240, height: 240, crop: "fill", gravity: "face", quality: "auto", fetch_format: "auto" }] }); };
export const deleteProfilePhoto = async (key?: string): Promise<void> => {
  if (!key) return;
  if (key.startsWith("mongo:")) {
    const id = key.slice(6);
    if (mongoose.isValidObjectId(id)) await mongoBucket().delete(new mongoose.mongo.ObjectId(id));
    return;
  }
  configured();
  const result = await cloudinary.uploader.destroy(key, { resource_type: "image", type: "upload", invalidate: true });
  if (!["ok", "not found"].includes(result.result)) throw new AppError("Profile photo could not be deleted", 502, "STORAGE_DELETE_FAILED");
};
export const uploadApplicantPrivate = async (buffer: Buffer, originalName: string, mimeType: string): Promise<StoredObject> => {
  const stored = await uploadPrivate(buffer, "mobiusbloom-employee/applicants", { originalName, mimeType, category: "APPLICANT_CV" });
  return stored.provider === "MONGODB" ? { ...stored, format: path.extname(originalName).slice(1).toLowerCase() || undefined } : stored;
};
export const openMongoPrivate = (key: string) => {
  if (!mongoose.isValidObjectId(key)) throw new AppError("Document not found", 404, "DOCUMENT_NOT_FOUND");
  return mongoBucket().openDownloadStream(new mongoose.mongo.ObjectId(key));
};
export const deletePrivateObject = async (stored: Pick<StoredObject, "provider" | "key">): Promise<void> => {
  if (stored.provider === "MONGODB") {
    if (!mongoose.isValidObjectId(stored.key)) throw new AppError("Document not found", 404, "DOCUMENT_NOT_FOUND");
    await mongoBucket().delete(new mongoose.mongo.ObjectId(stored.key));
    return;
  }
  configured();
  const result = await cloudinary.uploader.destroy(stored.key, { resource_type: "raw", type: "authenticated", invalidate: true });
  if (!['ok', 'not found'].includes(result.result)) throw new AppError("Document could not be deleted from private storage", 502, "STORAGE_DELETE_FAILED");
};
export const openMongoProfilePhoto = async (key: string) => {
  if (!mongoose.isValidObjectId(key)) throw new AppError("Profile photo not found", 404, "PROFILE_PHOTO_NOT_FOUND");
  const id = new mongoose.mongo.ObjectId(key); const bucket = mongoBucket();
  const file = await bucket.find({ _id: id, "metadata.category": "PROFILE_PHOTO" }).next();
  if (!file) throw new AppError("Profile photo not found", 404, "PROFILE_PHOTO_NOT_FOUND");
  return { stream: bucket.openDownloadStream(id), mimeType: typeof file.metadata?.mimeType === "string" ? file.metadata.mimeType : "image/jpeg" };
};
