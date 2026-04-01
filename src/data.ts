import type { Plan } from './types';

export function createDefaultPlan(): Plan {
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const apr1 = new Date(2026, 3, 1, 12, 0, 0, 0);
  const apr8 = new Date(2026, 3, 8, 12, 0, 0, 0);
  const apr15 = new Date(2026, 3, 15, 12, 0, 0, 0);
  const apr15session = new Date(2026, 3, 15, 9, 30, 0, 0);
  const apr22 = new Date(2026, 3, 22, 12, 0, 0, 0);

  return {
    id: crypto.randomUUID(),
    title: 'Daring Foundations',
    milestones: [
      {
        id: crypto.randomUUID(),
        title: 'Intro to Dare to Lead',
        type: 'chapter',
        optional: false,
        unlocksAt: apr1,
        activities: [
          {
            id: crypto.randomUUID(),
            title: 'Watch Video 1 – Brave Leaders and Courage Cultures',
            type: 'video',
            durationMinutes: 16,
          },
        ],
        resources: [
          {
            id: crypto.randomUUID(),
            title: 'Toxic Culture Is Driving the Great Resignation',
            type: 'resource',
          },
          {
            id: crypto.randomUUID(),
            title: 'The power of vulnerability',
            type: 'video',
          },
        ],
      },
      {
        id: crypto.randomUUID(),
        title: 'The Heart of Dare to Lead',
        type: 'chapter',
        optional: false,
        unlocksAt: apr8,
        activities: [
          {
            id: crypto.randomUUID(),
            title: 'Watch Video 2 – It\'s Not the Critic Who Counts',
            type: 'video',
            durationMinutes: 11,
          },
          {
            id: crypto.randomUUID(),
            title: 'Watch Video 3 and complete the Permission Slips exercise',
            type: 'video',
            durationMinutes: 7,
          },
          {
            id: crypto.randomUUID(),
            title: 'Complete the lesson assessment',
            type: 'assessment',
            durationMinutes: 5,
          },
        ],
        resources: [
          {
            id: crypto.randomUUID(),
            title: 'Toxic Culture Poster',
            type: 'resource',
          },
          {
            id: crypto.randomUUID(),
            title: 'Dare to Lead with Brené Brown',
            type: 'resource',
          },
        ],
      },
      {
        id: crypto.randomUUID(),
        title: 'Facilitation Session',
        type: 'session',
        optional: false,
        unlocksAt: apr15,
        sessionDate: apr15session,
        activities: [
          {
            id: crypto.randomUUID(),
            title: 'Post-session reflection assessment',
            type: 'assessment',
            durationMinutes: 5,
          },
        ],
        resources: [
          {
            id: crypto.randomUUID(),
            title: 'Session facilitation guide',
            type: 'resource',
          },
        ],
      },
      {
        id: crypto.randomUUID(),
        title: 'Rumbling with Vulnerability',
        type: 'chapter',
        optional: true,
        unlocksAt: apr22,
        activities: [
          {
            id: crypto.randomUUID(),
            title: 'Read: The anatomy of trust',
            type: 'resource',
            durationMinutes: 12,
          },
        ],
        resources: [
          {
            id: crypto.randomUUID(),
            title: 'Vulnerability worksheet',
            type: 'resource',
          },
        ],
      },
    ],
    config: {
      unlockStrategy: 'by_both',
      startDate: apr1,
      commRules: [
        { id: crypto.randomUUID(), type: 'start_of_plan' },
        { id: crypto.randomUUID(), type: 'end_of_plan' },
        { id: crypto.randomUUID(), type: 'milestone_reminder', minuteOffset: 1440 },
        { id: crypto.randomUUID(), type: 'session_reminder', minuteOffset: -1440 },
        { id: crypto.randomUUID(), type: 'session_followup', minuteOffset: 60 },
      ],
    },
  };
}
