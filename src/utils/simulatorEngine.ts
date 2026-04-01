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
 * For completion-based strategies, we approximate with sequential +7 day offsets from startDate,
 * skipping optional milestones in the chain.
 */
function computeUnlockDate(
  milestone: Milestone,
  index: number,
  milestones: Milestone[],
  startDate: Date,
  strategy: Plan['config']['unlockStrategy'],
): Date | undefined {
  const unlocksAt = milestone.unlocksAt;

  // Completion-based unlock: milestone 0 on startDate, each required subsequent
  // milestone unlocks 7 days after the prior required milestone's unlock.
  function completionDate(): Date {
    // Find the chain of required milestones up to (not including) this one
    const requiredBefore = milestones.slice(0, index).filter((m) => !m.optional);
    let base = startDate;
    for (const _m of requiredBefore) {
      base = addDays(base, 7);
    }
    return base;
  }

  switch (strategy) {
    case 'by_time':
      return unlocksAt ?? completionDate();

    case 'by_completion':
      return completionDate();

    case 'by_both': {
      const comp = completionDate();
      if (!unlocksAt) return comp;
      // Both must pass: use the later date
      return new Date(Math.max(comp.getTime(), unlocksAt.getTime()));
    }

    case 'by_either': {
      const comp = completionDate();
      if (!unlocksAt) return comp;
      // Either: use the earlier date
      return new Date(Math.min(comp.getTime(), unlocksAt.getTime()));
    }
  }
}

export function computeEvents(plan: Plan, upToDate: Date): SimulatedEvent[] {
  const events: SimulatedEvent[] = [];
  const { config, milestones } = plan;
  const startDate = config.startDate;

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

    const startRule = config.commRules.find((r) => r.type === 'start_of_plan');
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
        label: `Milestone unlocked: ${milestone.title}`,
        milestoneId: milestone.id,
      });

      // Milestone reminders (fired after unlock)
      config.commRules
        .filter((r) => r.type === 'milestone_reminder' && r.minuteOffset !== undefined)
        .forEach((rule) => {
          const commDate = addMinutes(unlockDate, rule.minuteOffset!);
          if (dateLE(commDate, upToDate)) {
            events.push({
              id: nextId(),
              type: 'comm_milestone_reminder',
              date: commDate,
              label: `Milestone reminder: ${milestone.title}`,
              milestoneId: milestone.id,
              commRuleId: rule.id,
            });
          }
        });
    }

    // Session-specific comms
    if (milestone.type === 'session' && milestone.sessionDate) {
      const sessionDate = milestone.sessionDate;

      config.commRules
        .filter((r) => r.type === 'session_reminder' && r.minuteOffset !== undefined)
        .forEach((rule) => {
          const commDate = addMinutes(sessionDate, rule.minuteOffset!);
          if (dateLE(commDate, upToDate)) {
            events.push({
              id: nextId(),
              type: 'comm_session_reminder',
              date: commDate,
              label: `Session reminder: ${milestone.title}`,
              milestoneId: milestone.id,
              commRuleId: rule.id,
            });
          }
        });

      config.commRules
        .filter((r) => r.type === 'session_followup' && r.minuteOffset !== undefined)
        .forEach((rule) => {
          const commDate = addMinutes(sessionDate, rule.minuteOffset!);
          if (dateLE(commDate, upToDate)) {
            events.push({
              id: nextId(),
              type: 'comm_session_followup',
              date: commDate,
              label: `Session follow-up: ${milestone.title}`,
              milestoneId: milestone.id,
              commRuleId: rule.id,
            });
          }
        });
    }
  });

  // End of plan: fire on last milestone's unlock date
  const endRule = config.commRules.find((r) => r.type === 'end_of_plan');
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
