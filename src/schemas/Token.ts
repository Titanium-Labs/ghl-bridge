import mongoose, { Schema, Document } from "mongoose";
import { AppUserType, TokenType } from "../types";

export interface IToken extends Document {
  access_token: string;
  token_type: TokenType;
  expires_in: number;
  refresh_token: string;
  scope: string;
  userType: AppUserType;
  companyId?: string;
  locationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TokenSchema = new Schema<IToken>(
  {
    access_token: {
      type: String,
      required: true,
      index: true,
    },
    token_type: {
      type: String,
      enum: Object.values(TokenType),
      default: TokenType.Bearer,
      required: true,
    },
    expires_in: {
      type: Number,
      required: true,
    },
    refresh_token: {
      type: String,
      required: true,
      index: true,
    },
    scope: {
      type: String,
      required: true,
    },
    userType: {
      type: String,
      enum: Object.values(AppUserType),
      required: true,
    },
    companyId: {
      type: String,
      index: true,
      sparse: true,
    },
    locationId: {
      type: String,
      index: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
    collection: "tokens",
  }
);

// Compound index to ensure unique combination of companyId/locationId and userType
TokenSchema.index(
  { companyId: 1, userType: 1 },
  { unique: true, sparse: true }
);
TokenSchema.index(
  { locationId: 1, userType: 1 },
  { unique: true, sparse: true }
);

export const Token = mongoose.model<IToken>("Token", TokenSchema);
