import type { Plan, Milestone } from '../types';
import { addMinutes, addDays, dateLE } from './dateHelpers';

export type SimEventType =
  | 'plan_enrollment'
  | 'milestone_unlock'
  | 'comm_start_of_plan'
  | 'comm_end_of_plan'
  | 'comm_milestone_reminder'
  | 'comm_session_reminder'
  | 'comm_session_followup';

export interface SimulatedEvent {
  id: string;
  type: SimEventType;
  date: Date;
  label: string;
  milestoneId?: string;
  commRuleId?: string;
}

/**
 * Computes the simulated unlock date for a milestone given the plan's unlock strategy.
 * For completion-based strategies, we approximate with sequential +7 day offsets from startsAt,
 * skipping optional milestones in the chain.
 */
function computeUnlockDate(
  milestone: Milestone,
  index: number,
  milestones: Milestone[],
  startDate: Date,
  strategy: Plan['config']['unlockStrategy'],
): Date | undefined {
  const unlockAt = milestone.unlockAt;

  // Completion-based unlock: milestone 0 on startDate, each required subsequent
  // milestone unlocks 7 days after the prior required milestone's unlock.
  function completionDate(): Date {
    const requiredBefore = milestones.slice(0, index).filter((m) => !m.optional);
    let base = startDate;
    for (const _m of requiredBefore) {
      base = addDays(base, 7);
    }
    return base;
  }

  switch (strategy) {
    case 'by_unlock_at_time':
      return unlockAt ?? completionDate();

    case 'by_completion':
      return completionDate();

    case 'by_completion_and_unlock_at_time': {
      const comp = completionDate();
      if (!unlockAt) return comp;
      return new Date(Math.max(comp.getTime(), unlockAt.getTime()));
    }

    case 'by_completion_or_unlock_at_time': {
      const comp = completionDate();
      if (!unlockAt) return comp;
      return new Date(Math.min(comp.getTime(), unlockAt.getTime()));
    }
  }
}

export function computeEvents(plan: Plan, upToDate: Date): SimulatedEvent[] {
  const events: SimulatedEvent[] = [];
  const { config, milestones } = plan;
  const startDate = config.startsAt;

  if (!startDate) return [];

  let counter = 0;
  const nextId = () => String(counter++);

  // Plan start
  if (dateLE(startDate, upToDate)) {
    events.push({
      id: nextId(),
      type: 'plan_enrollment',
      date: startDate,
      label: 'Plan started',
    });

    const startRule = config.commRules.find((r) => r.triggerType === 'start_of_plan' && r.enabled);
    if (startRule) {
      events.push({
        id: nextId(),
        type: 'comm_start_of_plan',
        date: startDate,
        label: 'Comm sent: Start of plan',
        commRuleId: startRule.id,
      });
    }
  }

  // Track computed unlock dates for end-of-plan calc
  const unlockDates: Date[] = [];

  milestones.forEach((milestone, index) => {
    const unlockDate = computeUnlockDate(
      milestone,
      index,
      milestones,
      startDate,
      config.unlockStrategy,
    );

    if (!unlockDate) return;
    unlockDates.push(unlockDate);

    // Milestone unlock event
    if (dateLE(unlockDate, upToDate)) {
      events.push({
        id: nextId(),
        type: 'milestone_unlock',
        date: unlockDate,
        label: `Milestone unlocked: ${milestone.name}`,
        milestoneId: milestone.id,
      });

      // Milestone reminders (fired after unlock)
      config.commRules
        .filter((r) => r.triggerType === 'milestone_reminder' && r.enabled && r.triggerOffsetMinutes !== undefined)
        .forEach((rule) => {
          const commDate = addMinutes(unlockDate, rule.triggerOffsetMinutes!);
          if (dateLE(commDate, upToDate)) {
            events.push({
              id: nextId(),
              type: 'comm_milestone_reminder',
              date: commDate,
              label: `Milestone reminder: ${milestone.name}`,
              milestoneId: milestone.id,
              commRuleId: rule.id,
            });
          }
        });
    }

    // Session-specific comms
    if (milestone.milestoneType === 'session' && milestone.sessionDate) {
      const sessionDate = milestone.sessionDate;

      config.commRules
        .filter((r) => r.triggerType === 'session_reminder' && r.enabled && r.triggerOffsetMinutes !== undefined)
        .forEach((rule) => {
          const commDate = addMinutes(sessionDate, rule.triggerOffsetMinutes!);
          if (dateLE(commDate, upToDate)) {
            events.push({
              id: nextId(),
              type: 'comm_session_reminder',
              date: commDate,
              label: `Session reminder: ${milestone.name}`,
              milestoneId: milestone.id,
              commRuleId: rule.id,
            });
          }
        });

      config.commRules
        .filter((r) => r.triggerType === 'session_followup' && r.enabled && r.triggerOffsetMinutes !== undefined)
        .forEach((rule) => {
          const commDate = addMinutes(sessionDate, rule.triggerOffsetMinutes!);
          if (dateLE(commDate, upToDate)) {
            events.push({
              id: nextId(),
              type: 'comm_session_followup',
              date: commDate,
              label: `Session follow-up: ${milestone.name}`,
              milestoneId: milestone.id,
              commRuleId: rule.id,
            });
          }
        });
    }
  });

  // End of plan: fire on last milestone's unlock date
  const endRule = config.commRules.find((r) => r.triggerType === 'end_of_plan' && r.enabled);
  if (endRule && unlockDates.length > 0) {
    const lastUnlock = unlockDates.reduce((a, b) => (a.getTime() > b.getTime() ? a : b));
    if (dateLE(lastUnlock, upToDate)) {
      events.push({
        id: nextId(),
        type: 'comm_end_of_plan',
        date: lastUnlock,
        label: 'Comm sent: End of plan',
        commRuleId: endRule.id,
      });
    }
  }

  // Sort by date ascending
  events.sort((a, b) => a.date.getTime() - b.date.getTime());

  return events;
}
