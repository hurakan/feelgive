import mongoose, { Schema, Document } from 'mongoose';

/**
 * IRS Business Master File Record
 * Stores the complete IRS BMF dataset locally for fast lookups
 * Data source: https://www.irs.gov/charities-non-profits/exempt-organizations-business-master-file-extract-eo-bmf
 */
export interface IIrsBmfRecord extends Document {
  // Primary identifier
  ein: string; // Normalized (no hyphens): "123456789"
  
  // Organization info
  name: string;
  ico?: string; // In care of name
  
  // Address
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  
  // Classification
  nteeCode?: string; // e.g., "R20"
  subsectionCode?: string; // e.g., "03" for 501(c)(3)
  classification?: string;
  affiliation?: string;
  
  // Status and dates
  rulingDate?: string; // YYYYMM format
  deductibilityCode?: string;
  foundationCode?: string;
  activityCodes?: string;
  organizationCode?: string;
  exemptOrgStatusCode?: string;
  
  // Financial data
  taxPeriod?: string; // YYYYMM format
  assetCode?: string;
  incomeCode?: string;
  filingRequirementCode?: string;
  pfFilingRequirementCode?: string;
  accountingPeriod?: string;
  assetAmount?: number;
  incomeAmount?: number;
  revenueAmount?: number;
  
  // Metadata
  groupExemptionNumber?: string;
  sortName?: string;
  
  // Import tracking
  importedAt: Date;
  importSource: string; // e.g., "IRS_BMF_2024_01"
}

const IrsBmfRecordSchema = new Schema<IIrsBmfRecord>(
  {
    ein: {
      type: String,
      required: true,
      unique: true,
      index: true,
      validate: {
        validator: (v: string) => /^\d{9}$/.test(v),
        message: 'EIN must be exactly 9 digits',
      },
    },
    name: { type: String, required: true, index: true },
    ico: String,
    
    street: String,
    city: { type: String, index: true },
    state: { type: String, index: true },
    zip: String,
    
    nteeCode: { type: String, index: true },
    subsectionCode: String,
    classification: String,
    affiliation: String,
    
    rulingDate: String,
    deductibilityCode: String,
    foundationCode: String,
    activityCodes: String,
    organizationCode: String,
    exemptOrgStatusCode: String,
    
    taxPeriod: String,
    assetCode: String,
    incomeCode: String,
    filingRequirementCode: String,
    pfFilingRequirementCode: String,
    accountingPeriod: String,
    assetAmount: Number,
    incomeAmount: Number,
    revenueAmount: Number,
    
    groupExemptionNumber: String,
    sortName: String,
    
    importedAt: { type: Date, default: Date.now },
    importSource: { type: String, required: true },
  },
  {
    timestamps: false, // We use importedAt instead
  }
);

// Compound indexes for common queries
IrsBmfRecordSchema.index({ nteeCode: 1, state: 1 });
IrsBmfRecordSchema.index({ city: 1, state: 1 });
IrsBmfRecordSchema.index({ name: 'text' }); // Text search on name

export default mongoose.model<IIrsBmfRecord>('IrsBmfRecord', IrsBmfRecordSchema);