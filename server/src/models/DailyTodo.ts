import { Schema, model, type Types } from "mongoose";

export interface DailyTodoDocument {
  user: Types.ObjectId;
  employee: Types.ObjectId;
  date: string;
  title: string;
  completed: boolean;
  completedAt?: Date;
}

const schema = new Schema<DailyTodoDocument>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
  date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/, index: true },
  title: { type: String, required: true, trim: true, minlength: 2, maxlength: 240 },
  completed: { type: Boolean, default: false, index: true },
  completedAt: Date
}, { timestamps: true, versionKey: false });

schema.index({ user: 1, date: 1, createdAt: 1 });
export const DailyTodo = model<DailyTodoDocument>("DailyTodo", schema);
