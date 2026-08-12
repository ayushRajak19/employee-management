import { randomUUID } from "node:crypto"; import { Readable } from "node:stream"; import mongoose from "mongoose"; import { v2 as cloudinary } from "cloudinary"; import { env } from "../config/env.js"; import { AppError } from "../utils/AppError.js";
export interface StoredObject { provider: "CLOUDINARY" | "MONGODB"; key: string; format?: string; size: number }
const configured = () => { if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) throw new AppError("Private document storage is not configured", 503, "STORAGE_UNAVAILABLE"); cloudinary.config({ cloud_name: env.CLOUDINARY_CLOUD_NAME, api_key: env.CLOUDINARY_API_KEY, api_secret: env.CLOUDINARY_API_SECRET, secure: true }); };
export const uploadPrivate = async (buffer: Buffer, folder: string): Promise<StoredObject> => { configured(); return new Promise((resolve, reject) => { const stream = cloudinary.uploader.upload_stream({ resource_type: "raw", type: "authenticated", folder, public_id: randomUUID(), overwrite: false }, (error, result) => { if (error || !result) reject(new AppError("Document upload failed", 502, "STORAGE_UPLOAD_FAILED")); else resolve({ provider: "CLOUDINARY", key: result.public_id, format: result.format, size: result.bytes }); }); stream.end(buffer); }); };
export const signedPrivateUrl = (key: string): string => { configured(); return cloudinary.url(key, { resource_type: "raw", type: "authenticated", sign_url: true, secure: true }); };
export const uploadProfilePhoto = async (buffer: Buffer, employeeId: string): Promise<string> => { configured(); return new Promise((resolve, reject) => { const stream = cloudinary.uploader.upload_stream({ resource_type: "image", type: "upload", folder: `mobiusbloom-employee/${employeeId}/profile`, public_id: "avatar", overwrite: true, invalidate: true, transformation: [{ width: 600, height: 600, crop: "fill", gravity: "face", quality: "auto", fetch_format: "auto" }] }, (error, result) => { if (error || !result) reject(new AppError("Profile photo upload failed", 502, "PROFILE_PHOTO_UPLOAD_FAILED")); else resolve(result.public_id); }); stream.end(buffer); }); };
export const profilePhotoUrl = (key?: string): string | undefined => { if (!key) return undefined; configured(); return cloudinary.url(key, { resource_type: "image", type: "upload", secure: true, transformation: [{ width: 240, height: 240, crop: "fill", gravity: "face", quality: "auto", fetch_format: "auto" }] }); };
const mongoBucket = () => { if (!mongoose.connection.db) throw new AppError("Database document storage is unavailable", 503, "STORAGE_UNAVAILABLE"); return new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: "privateDocuments" }); };
export const uploadApplicantPrivate = async (buffer: Buffer, originalName: string, mimeType: string): Promise<StoredObject> => {
  if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) return uploadPrivate(buffer, "mobiusbloom-employee/applicants");
  return new Promise((resolve, reject) => {
    const stream = mongoBucket().openUploadStream(`${randomUUID()}.pdf`, { metadata: { originalName, mimeType, category: "APPLICANT_CV" } });
    stream.on("error", () => reject(new AppError("Document upload failed", 502, "STORAGE_UPLOAD_FAILED")));
    stream.on("finish", () => resolve({ provider: "MONGODB", key: stream.id.toString(), format: "pdf", size: buffer.length }));
    Readable.from(buffer).pipe(stream);
  });
};
export const openMongoPrivate = (key: string) => {
  if (!mongoose.isValidObjectId(key)) throw new AppError("Document not found", 404, "DOCUMENT_NOT_FOUND");
  return mongoBucket().openDownloadStream(new mongoose.mongo.ObjectId(key));
};
