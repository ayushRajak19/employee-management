import { Notification } from "../models/Notification.js";
import { emailChannel } from "./messageChannelService.js";
export const notify = async (input: { recipient: string; type: string; title: string; body: string; entityType?: string; entityId?: string; email?: string }): Promise<void> => { await Notification.create({ ...input, channels: ["IN_APP"] }); if (input.email) await emailChannel.send({ recipient: input.email, subject: input.title, body: input.body }); };
export const listNotifications = async (userId: string) => Notification.find({ recipient: userId }).sort({ createdAt: -1 }).limit(100).lean();
export const markRead = async (id: string, userId: string) => Notification.findOneAndUpdate({ _id: id, recipient: userId }, { $set: { readAt: new Date() } }, { new: true });
