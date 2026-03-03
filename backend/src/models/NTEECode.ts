import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * NTEE Code Reference
 * National Taxonomy of Exempt Entities classification system
 * Used for semantic matching and category lookups
 */
export interface INTEECode extends Document {
  code: string; // e.g., "R20"
  majorCategory: string; // e.g., "R"
  majorCategoryName: string; // e.g., "Civil Rights, Social Action & Advocacy"
  description: string; // Full description of the code
  keywords: string[]; // Keywords for semantic matching
  examples?: string[]; // Example organization types
  relatedCodes?: string[]; // Related NTEE codes
  findRelatedCodes(): Promise<INTEECode[]>;
}

// Interface for static methods
export interface INTEECodeModel extends Model<INTEECode> {
  getMajorCategories(): Record<string, string>;
  parseCode(code: string): {
    code: string;
    majorCategory: string;
    majorCategoryName: string;
    subcategory: string;
  } | null;
}

const NTEECodeSchema = new Schema<INTEECode>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      index: true,
      uppercase: true,
    },
    majorCategory: {
      type: String,
      required: true,
      index: true,
      uppercase: true,
      validate: {
        validator: (v: string) => /^[A-Z]$/.test(v),
        message: 'Major category must be a single uppercase letter',
      },
    },
    majorCategoryName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    keywords: {
      type: [String],
      default: [],
      index: true,
    },
    examples: [String],
    relatedCodes: [String],
  },
  {
    timestamps: true,
  }
);

// Text index for semantic search
NTEECodeSchema.index({
  description: 'text',
  keywords: 'text',
  majorCategoryName: 'text',
});

// Static method to get major category info
NTEECodeSchema.statics.getMajorCategories = function () {
  return {
    A: 'Arts, Culture & Humanities',
    B: 'Education',
    C: 'Environment',
    D: 'Animal-Related',
    E: 'Health Care',
    F: 'Mental Health & Crisis Intervention',
    G: 'Diseases, Disorders & Medical Disciplines',
    H: 'Medical Research',
    I: 'Crime & Legal-Related',
    J: 'Employment',
    K: 'Food, Agriculture & Nutrition',
    L: 'Housing & Shelter',
    M: 'Public Safety, Disaster Preparedness & Relief',
    N: 'Recreation & Sports',
    O: 'Youth Development',
    P: 'Human Services',
    Q: 'International, Foreign Affairs & National Security',
    R: 'Civil Rights, Social Action & Advocacy',
    S: 'Community Improvement & Capacity Building',
    T: 'Philanthropy, Voluntarism & Grantmaking Foundations',
    U: 'Science & Technology',
    V: 'Social Science',
    W: 'Public & Societal Benefit',
    X: 'Religion-Related',
    Y: 'Mutual & Membership Benefit',
    Z: 'Unknown',
  };
};

// Static method to parse NTEE code
NTEECodeSchema.statics.parseCode = function (code: string) {
  if (!code || code.length < 1) {
    return null;
  }
  
  const majorCategory = code.charAt(0).toUpperCase();
  const subcategory = code.substring(1);
  const categories = this.getMajorCategories();
  
  return {
    code: code.toUpperCase(),
    majorCategory,
    majorCategoryName: categories[majorCategory] || 'Unknown',
    subcategory,
  };
};

// Instance method to find related organizations
NTEECodeSchema.methods.findRelatedCodes = async function (this: INTEECode) {
  // Find codes with same major category
  return await mongoose.model('NTEECode').find({
    majorCategory: this.majorCategory,
    code: { $ne: this.code },
  }).limit(10);
};

export default mongoose.model<INTEECode, INTEECodeModel>('NTEECode', NTEECodeSchema);