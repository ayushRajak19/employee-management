import { Schema, model, type Types } from "mongoose";

export interface OneToOneDocument {
  employee: Types.ObjectId;
  manager: Types.ObjectId;
  meetingDate: Date;
  accomplishments?: string;
  challenges?: string;
  supportNeeded?: string;
  careerGoals?: string;
  agreedActions: { text: string; dueDate?: Date; completed: boolean }[];
  nextReviewDate?: Date;
  employeeResponse?: string;
  acknowledgedAt?: Date;
}

const actionSchema = new Schema({
  text: { type: String, required: true, trim: true, maxlength: 1000 },
  dueDate: Date,
  completed: { type: Boolean, default: false }
}, { _id: true });

const schema = new Schema<OneToOneDocument>({
  employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
  manager: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  meetingDate: { type: Date, required: true, index: true },
  accomplishments: { type: String, trim: true, maxlength: 3000 },
  challenges: { type: String, trim: true, maxlength: 3000 },
  supportNeeded: { type: String, trim: true, maxlength: 3000 },
  careerGoals: { type: String, trim: true, maxlength: 3000 },
  agreedActions: { type: [actionSchema], default: [] },
  nextReviewDate: Date,
  employeeResponse: { type: String, trim: true, maxlength: 3000 },
  acknowledgedAt: Date
}, { timestamps: true });

schema.index({ employee: 1, meetingDate: -1 });
export const OneToOne = model<OneToOneDocument>("OneToOne", schema);
