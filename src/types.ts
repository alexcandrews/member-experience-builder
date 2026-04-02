export type ActivityType = 'assessment' | 'video' | 'resource' | 'workbook' | 'pdf' | 'ai_experience';

export interface Activity {
  id: string;
  title: string;
  activityType: ActivityType;
  description?: string;
  associatedRecordUuid?: string;
  associatedRecordType?: string;
  durationSeconds?: number;
  resourceUrl?: string;
  requiredForMilestoneCompletion?: boolean;
}

export interface MilestoneObjective {
  title: string;
  description?: string;
}

export interface MilestoneQuote {
  content: string;
  authorName: string;
  authorImageUrl?: string;
}

export type ResourceType = 'pdf' | 'video' | 'podcast';

export interface Resource {
  id: string;
  title: string;
  resourceType: ResourceType;
  durationMinutes?: number;
  url?: string;
}

export type MilestoneType = 'chapter' | 'session';

export interface Milestone {
  id: string;
  name: string;
  milestoneType: MilestoneType;
  optional: boolean;
  unlockAt?: Date;
  sessionDate?: Date; // internal-only for simulator; not in export schema
  description?: string;
  durationInDays?: number;
  memberDefaultStatus?: 'locked' | 'unlocked';
  resourceListUuid?: string;
  objectives?: MilestoneObjective[];
  quotes?: MilestoneQuote[];
  activities: Activity[];
  resources: Resource[];
}

export type CommRuleType =
  | 'start_of_plan'
  | 'end_of_plan'
  | 'milestone_reminder'
  | 'session_reminder'
  | 'session_followup';

export interface CommRule {
  id: string;
  name: string;
  triggerType: CommRuleType;
  enabled: boolean;
  triggerOffsetMinutes?: number;
  courierTemplateKey?: string;
}

export type UnlockStrategy =
  | 'by_completion'
  | 'by_unlock_at_time'
  | 'by_completion_and_unlock_at_time'
  | 'by_completion_or_unlock_at_time';

export interface RegistrationPeriod {
  opensAt?: Date;
  closesAt?: Date;
  minimumSelection: number;
}

export interface PlanConfig {
  unlockStrategy: UnlockStrategy;
  startsAt?: Date;
  communicationsEnabled: boolean;
  registrationPeriod: RegistrationPeriod;
  commRules: CommRule[];
}

export interface Plan {
  id: string;
  name: string;
  internalName?: string;
  description?: string;
  template?: boolean;
  // Stub fields for future UI coverage (round-tripped via import/export)
  publishedAt?: Date;
  dueDatesEnabled?: boolean;
  completionCertificateTemplate?: string;
  calendarEventMode?: string;
  calendarEventScheduledFor?: Date;
  courierBrandKey?: string;
  bannerUuid?: string;
  planFamilyUuid?: string;
  requiredPsaFeatures?: string[];
  milestones: Milestone[];
  config: PlanConfig;
}

export type PlanUpdater = (updater: (prev: Plan) => Plan) => void;
