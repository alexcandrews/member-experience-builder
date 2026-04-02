/**
 * Import/Export utilities for BetterUp Guided Journey Plan JSON schema (v1.0).
 *
 * exportPlan: converts internal Plan → JSON schema (for pasting into BetterUp Admin)
 * importPlan: converts JSON schema → internal Plan (for previewing in this tool)
 */

import type {
  Plan,
  Milestone,
  Activity,
  CommRule,
  CommRuleType,
  MilestoneType,
  ActivityType,
  UnlockStrategy,
} from '../types';

// ─── JSON Schema Types ───────────────────────────────────────────────────────

interface JsonActivity {
  position: number;
  title: string;
  description: string | null;
  activity_type: string;
  duration: number | null;
  required_for_milestone_completion: boolean;
  associated_record_uuid: string | null;
  associated_record_type: string | null;
  resource_url: string | null;
}

interface JsonObjective {
  title: string;
  description: string | null;
}

interface JsonQuote {
  content: string;
  author_name: string;
  author_image_url: string | null;
}

interface JsonMilestone {
  position: number;
  name: string;
  description: string | null;
  milestone_type: string;
  optional: boolean;
  unlock_at: string | null;
  duration_in_days: number | null;
  member_default_status: string;
  resource_list_uuid: string | null;
  objectives: JsonObjective[];
  quotes: JsonQuote[];
  activities: JsonActivity[];
}

interface JsonCommRule {
  name: string;
  trigger_type: string;
  enabled: boolean;
  trigger_offset_minutes: number | null;
  courier_template_key: string | null;
}

interface JsonPlan {
  internal_name: string;
  name: string;
  description: string | null;
  template: boolean;
  milestone_unlocking_strategy: string;
  starts_at: string | null;
  published_at: string | null;
  due_dates_enabled: boolean;
  completion_certificate_template: string | null;
  calendar_event_mode: string | null;
  calendar_event_scheduled_for: string | null;
  communications_enabled: boolean;
  courier_brand_key: string | null;
  plan_settings: {
    coach_materials_title: string | null;
    coach_materials_url: string | null;
    required_group_specialty: string | null;
    required_coach_qualification_tags: string[];
  };
  banner_uuid: string | null;
  plan_family_uuid: string | null;
  required_psa_features: string[];
  registration_period: {
    opens_at: string | null;
    closes_at: string | null;
    minimum_selection: number;
  };
  communication_rules: JsonCommRule[];
  milestones: JsonMilestone[];
}

export interface GuidedJourneyExport {
  version: '1.0';
  plan: JsonPlan;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toISO(date: Date | undefined): string | null {
  return date ? date.toISOString() : null;
}

function fromISO(iso: string | null | undefined): Date | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? undefined : d;
}

const UNLOCK_STRATEGY_TO_JSON: Record<UnlockStrategy, string> = {
  by_completion: 'by_completion',
  by_unlock_at_time: 'by_unlock_at_time',
  by_completion_and_unlock_at_time: 'by_completion_and_unlock_at_time',
  by_completion_or_unlock_at_time: 'by_completion_or_unlock_at_time',
};

const UNLOCK_STRATEGY_FROM_JSON: Record<string, UnlockStrategy> = {
  by_completion: 'by_completion',
  by_unlock_at_time: 'by_unlock_at_time',
  by_completion_and_unlock_at_time: 'by_completion_and_unlock_at_time',
  by_completion_or_unlock_at_time: 'by_completion_or_unlock_at_time',
};

// ─── Export ──────────────────────────────────────────────────────────────────

function exportActivity(activity: Activity, position: number): JsonActivity {
  return {
    position,
    title: activity.title,
    description: activity.description ?? null,
    activity_type: activity.activityType,
    duration: activity.durationSeconds ?? null,
    required_for_milestone_completion: activity.requiredForMilestoneCompletion ?? false,
    associated_record_uuid: activity.associatedRecordUuid ?? null,
    associated_record_type: activity.associatedRecordType ?? null,
    resource_url: activity.resourceUrl ?? null,
  };
}

function exportMilestone(milestone: Milestone, position: number): JsonMilestone {
  return {
    position,
    name: milestone.name,
    description: milestone.description ?? null,
    milestone_type: milestone.milestoneType,
    optional: milestone.optional,
    unlock_at: toISO(milestone.unlockAt),
    duration_in_days: milestone.durationInDays ?? null,
    member_default_status: milestone.memberDefaultStatus ?? 'locked',
    resource_list_uuid: milestone.resourceListUuid ?? null,
    objectives: (milestone.objectives ?? []).map((o) => ({
      title: o.title,
      description: o.description ?? null,
    })),
    quotes: (milestone.quotes ?? []).map((q) => ({
      content: q.content,
      author_name: q.authorName,
      author_image_url: q.authorImageUrl ?? null,
    })),
    activities: milestone.activities.map((a, i) => exportActivity(a, i + 1)),
  };
}

function exportCommRule(rule: CommRule): JsonCommRule {
  return {
    name: rule.name,
    trigger_type: rule.triggerType,
    enabled: rule.enabled,
    trigger_offset_minutes: rule.triggerOffsetMinutes ?? null,
    courier_template_key: rule.courierTemplateKey ?? null,
  };
}

export function exportPlan(plan: Plan): GuidedJourneyExport {
  const { config } = plan;
  return {
    version: '1.0',
    plan: {
      internal_name: plan.internalName ?? plan.name,
      name: plan.name,
      description: plan.description ?? null,
      template: plan.template ?? false,
      milestone_unlocking_strategy: UNLOCK_STRATEGY_TO_JSON[config.unlockStrategy],
      starts_at: toISO(config.startsAt),
      published_at: toISO(plan.publishedAt),
      due_dates_enabled: plan.dueDatesEnabled ?? false,
      completion_certificate_template: plan.completionCertificateTemplate ?? null,
      calendar_event_mode: plan.calendarEventMode ?? null,
      calendar_event_scheduled_for: toISO(plan.calendarEventScheduledFor),
      communications_enabled: config.communicationsEnabled,
      courier_brand_key: plan.courierBrandKey ?? null,
      plan_settings: {
        coach_materials_title: null,
        coach_materials_url: null,
        required_group_specialty: null,
        required_coach_qualification_tags: [],
      },
      banner_uuid: plan.bannerUuid ?? null,
      plan_family_uuid: plan.planFamilyUuid ?? null,
      required_psa_features: plan.requiredPsaFeatures ?? [],
      registration_period: {
        opens_at: toISO(config.registrationPeriod.opensAt),
        closes_at: toISO(config.registrationPeriod.closesAt),
        minimum_selection: config.registrationPeriod.minimumSelection,
      },
      communication_rules: config.commRules.map(exportCommRule),
      milestones: plan.milestones.map((m, i) => exportMilestone(m, i + 1)),
    },
  };
}

export function downloadPlanJSON(plan: Plan): void {
  const json = exportPlan(plan);
  const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${plan.name.replace(/\s+/g, '-').toLowerCase()}-guided-journey.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Import ──────────────────────────────────────────────────────────────────

function importActivity(json: JsonActivity): Activity {
  return {
    id: crypto.randomUUID(),
    title: json.title,
    activityType: (json.activity_type as ActivityType) ?? 'resource',
    description: json.description ?? undefined,
    durationSeconds: json.duration ?? undefined,
    requiredForMilestoneCompletion: json.required_for_milestone_completion ?? false,
    associatedRecordUuid: json.associated_record_uuid ?? undefined,
    associatedRecordType: json.associated_record_type ?? undefined,
    resourceUrl: json.resource_url ?? undefined,
  };
}

function importMilestone(json: JsonMilestone): Milestone {
  return {
    id: crypto.randomUUID(),
    name: json.name,
    milestoneType: (json.milestone_type as MilestoneType) ?? 'chapter',
    optional: json.optional ?? false,
    unlockAt: fromISO(json.unlock_at),
    description: json.description ?? undefined,
    durationInDays: json.duration_in_days ?? undefined,
    memberDefaultStatus: (json.member_default_status as 'locked' | 'unlocked') ?? 'locked',
    resourceListUuid: json.resource_list_uuid ?? undefined,
    objectives: (json.objectives ?? []).map((o) => ({
      title: o.title,
      description: o.description ?? undefined,
    })),
    quotes: (json.quotes ?? []).map((q) => ({
      content: q.content,
      authorName: q.author_name,
      authorImageUrl: q.author_image_url ?? undefined,
    })),
    activities: (json.activities ?? [])
      .sort((a, b) => a.position - b.position)
      .map(importActivity),
    resources: [],
  };
}

function importCommRule(json: JsonCommRule): CommRule {
  return {
    id: crypto.randomUUID(),
    name: json.name,
    triggerType: json.trigger_type as CommRuleType,
    enabled: json.enabled ?? true,
    triggerOffsetMinutes: json.trigger_offset_minutes ?? undefined,
    courierTemplateKey: json.courier_template_key ?? undefined,
  };
}

export function importPlan(json: GuidedJourneyExport): Plan {
  const p = json.plan;
  return {
    id: crypto.randomUUID(),
    name: p.name,
    internalName: p.internal_name ?? undefined,
    description: p.description ?? undefined,
    template: p.template ?? false,
    publishedAt: fromISO(p.published_at),
    dueDatesEnabled: p.due_dates_enabled ?? false,
    completionCertificateTemplate: p.completion_certificate_template ?? undefined,
    calendarEventMode: p.calendar_event_mode ?? undefined,
    calendarEventScheduledFor: fromISO(p.calendar_event_scheduled_for),
    courierBrandKey: p.courier_brand_key ?? undefined,
    bannerUuid: p.banner_uuid ?? undefined,
    planFamilyUuid: p.plan_family_uuid ?? undefined,
    requiredPsaFeatures: p.required_psa_features ?? [],
    milestones: (p.milestones ?? [])
      .sort((a, b) => a.position - b.position)
      .map(importMilestone),
    config: {
      unlockStrategy:
        UNLOCK_STRATEGY_FROM_JSON[p.milestone_unlocking_strategy] ??
        'by_completion_and_unlock_at_time',
      startsAt: fromISO(p.starts_at),
      communicationsEnabled: p.communications_enabled ?? true,
      registrationPeriod: {
        opensAt: fromISO(p.registration_period?.opens_at),
        closesAt: fromISO(p.registration_period?.closes_at),
        minimumSelection: p.registration_period?.minimum_selection ?? 1,
      },
      commRules: (p.communication_rules ?? []).map(importCommRule),
    },
  };
}

export function parsePlanJSON(jsonString: string): Plan {
  const parsed = JSON.parse(jsonString) as GuidedJourneyExport;
  if (!parsed.version || !parsed.plan) {
    throw new Error('Invalid Guided Journey JSON: missing version or plan fields.');
  }
  return importPlan(parsed);
}
