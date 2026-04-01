export type ActivityType = 'assessment' | 'video' | 'resource';

export interface Activity {
  id: string;
  title: string;
  type: ActivityType;
  associatedRecord?: string;
  durationMinutes?: number;
}

export interface Resource {
  id: string;
  title: string;
  type: ActivityType;
  thumbnailUrl?: string;
}

export type MilestoneType = 'chapter' | 'session';

export interface Milestone {
  id: string;
  title: string;
  type: MilestoneType;
  optional: boolean;
  unlocksAt?: Date;
  sessionDate?: Date;
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
  type: CommRuleType;
  minuteOffset?: number;
}

export interface PlanConfig {
  unlockStrategy: 'by_completion' | 'by_time' | 'by_both' | 'by_either';
  startDate?: Date;
  registrationStartDate?: Date;
  registrationEndDate?: Date;
  commRules: CommRule[];
}

export interface Plan {
  id: string;
  title: string;
  milestones: Milestone[];
  config: PlanConfig;
}

export type PlanUpdater = (updater: (prev: Plan) => Plan) => void;
