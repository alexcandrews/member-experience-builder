import type { Plan } from './types';

export function createDefaultPlan(): Plan {
  const apr1 = new Date(2026, 3, 1, 12, 0, 0, 0);
  const apr8 = new Date(2026, 3, 8, 12, 0, 0, 0);
  const apr15 = new Date(2026, 3, 15, 12, 0, 0, 0);
  const apr15session = new Date(2026, 3, 15, 9, 30, 0, 0);
  const apr22 = new Date(2026, 3, 22, 12, 0, 0, 0);

  return {
    id: crypto.randomUUID(),
    name: 'Daring Foundations',
    internalName: 'Daring Foundations - Spring 2026',
    description: "A program based on Brené Brown's Dare to Lead research.",
    milestones: [
      {
        id: crypto.randomUUID(),
        name: 'Lesson 1',
        description: 'Intro to Dare to Lead',
        milestoneType: 'chapter',
        optional: false,
        unlockAt: apr1,
        durationInDays: 7,
        memberDefaultStatus: 'locked',
        objectives: [{ title: 'Understand brave leadership' }],
        quotes: [{ content: 'You can choose courage or comfort, but you cannot have both.', authorName: 'Brené Brown' }],
        activities: [
          {
            id: crypto.randomUUID(),
            title: 'Watch Video 1 – Brave Leaders and Courage Cultures',
            activityType: 'video',
            durationSeconds: 960,
          },
        ],
        resources: [
          { id: crypto.randomUUID(), title: 'Dare to Lead Research Summary', resourceType: 'pdf' },
          { id: crypto.randomUUID(), title: 'The Power of Vulnerability', resourceType: 'video', durationMinutes: 20 },
          { id: crypto.randomUUID(), title: 'Dare to Lead with Brené Brown', resourceType: 'podcast', durationMinutes: 72 },
          { id: crypto.randomUUID(), title: 'Rumbling with Vulnerability Guide', resourceType: 'pdf' },
          { id: crypto.randomUUID(), title: 'Braving Trust Worksheet', resourceType: 'pdf' },
        ],
      },
      {
        id: crypto.randomUUID(),
        name: 'Lesson 2',
        description: 'The Heart of Dare to Lead',
        milestoneType: 'chapter',
        optional: false,
        unlockAt: apr8,
        durationInDays: 7,
        memberDefaultStatus: 'locked',
        activities: [
          {
            id: crypto.randomUUID(),
            title: "Watch Video 2 – It's Not the Critic Who Counts",
            activityType: 'video',
            durationSeconds: 660,
          },
          {
            id: crypto.randomUUID(),
            title: 'Watch Video 3 and complete the Permission Slips exercise',
            activityType: 'video',
            durationSeconds: 420,
          },
          {
            id: crypto.randomUUID(),
            title: 'Complete the lesson assessment',
            activityType: 'assessment',
            durationSeconds: 300,
          },
        ],
        resources: [],
      },
      {
        id: crypto.randomUUID(),
        name: 'Facilitation Session',
        milestoneType: 'session',
        optional: false,
        unlockAt: apr15,
        sessionDate: apr15session,
        memberDefaultStatus: 'locked',
        activities: [
          {
            id: crypto.randomUUID(),
            title: 'Post-session reflection assessment',
            activityType: 'assessment',
            durationSeconds: 300,
          },
        ],
        resources: [],
      },
      {
        id: crypto.randomUUID(),
        name: 'Lesson 3',
        description: 'Rumbling with Vulnerability',
        milestoneType: 'chapter',
        optional: true,
        unlockAt: apr22,
        memberDefaultStatus: 'locked',
        activities: [
          {
            id: crypto.randomUUID(),
            title: 'Read: The anatomy of trust',
            activityType: 'resource',
            durationSeconds: 720,
          },
        ],
        resources: [],
      },
    ],
    config: {
      unlockStrategy: 'by_completion_and_unlock_at_time',
      startsAt: apr1,
      communicationsEnabled: true,
      registrationPeriod: { minimumSelection: 1 },
      commRules: [],
    },
  };
}
