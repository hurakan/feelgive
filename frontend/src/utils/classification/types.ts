import { CauseCategory, CrisisType, RootCause } from '@/types';

export interface SemanticPattern {
  cause: CauseCategory;
  coreIndicators: string[];
  supportingContext: string[];
  actionIndicators: string[];
  negativeIndicators: string[];
  minScore: number;
  geoKeywords?: { [key: string]: string[] };
  crisisType: CrisisType;
  typicalRootCauses: RootCause[];
}

export interface AnalysisResult {
  cause: CauseCategory;
  score: number;
  matchedKeywords: string[];
  contextScore: number;
  actionScore: number;
  negativeScore: number;
  geo: string;
  geoName: string;
  detectedThemes: string[];
  crisisType: CrisisType;
  rootCause: RootCause;
}

export interface SeverityIndicators {
  deathToll?: number;
  peopleAffected?: number;
  systemStatus: 'collapsed' | 'overwhelmed' | 'strained' | 'coping' | 'normal';
  imminentRisk: boolean;
}