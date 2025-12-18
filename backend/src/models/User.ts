import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  monthlyCapEnabled: boolean;
  monthlyCap: number;
  totalDonations: number;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    monthlyCapEnabled: {
      type: Boolean,
      default: false,
    },
    monthlyCap: {
      type: Number,
      default: 50,
      min: 0,
    },
    totalDonations: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IUser>('User', UserSchema);