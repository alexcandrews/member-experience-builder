import { useState } from 'react';
import type { Plan, Milestone, Activity } from '../../types';
import '../../styles/design.css';

interface DesignPageProps {
  plan: Plan;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}:${String(m).padStart(2, '0')} hr` : `${h} hr`;
  }
  return `${mins} min`;
}

function formatDate(date: Date | undefined): string {
  if (!date) return '';
  return `${date.getMonth() + 1}/${String(date.getDate()).padStart(2, '0')}`;
}

function totalDuration(activities: Activity[]): number {
  return activities.reduce((sum, a) => sum + (a.durationSeconds ?? 0), 0);
}

type ChipVariant = 'completed' | 'active' | 'upcoming' | 'session' | 'locked';

function getChipVariant(milestone: Milestone, isSelected: boolean): ChipVariant {
  if (isSelected) return 'active';
  if (milestone.milestoneType === 'session') return 'session';
  if (milestone.memberDefaultStatus === 'locked') return 'locked';
  return 'upcoming';
}

function chipLabel(milestone: Milestone, index: number): string {
  if (milestone.milestoneType === 'session') {
    if (milestone.sessionDate) {
      return milestone.sessionDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    }
    return 'Session';
  }
  return `Lesson ${index + 1}`;
}

// ── Icons (inline SVG) ────────────────────────────────────────────────────────

function VideoIcon() {
  return (
    <svg className="design-activity-meta-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 2.5L13 8L3 13.5V2.5Z" fill="currentColor" />
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg className="design-activity-meta-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="12" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 8h6M5 5.5h6M5 10.5h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function AssessmentIcon() {
  return (
    <svg className="design-activity-meta-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 8.5L7 10.5L11 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="design-chip-lock-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="7" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="design-deadline-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M8 2a1 1 0 011 1v1h6V3a1 1 0 112 0v1h1a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h1V3a1 1 0 011-1zm-2 6a1 1 0 000 2h12a1 1 0 100-2H6z" />
    </svg>
  );
}

function activityTypeInfo(activity: Activity): { label: string; icon: JSX.Element } {
  switch (activity.activityType) {
    case 'video':
      return { label: 'Video', icon: <VideoIcon /> };
    case 'assessment':
      return { label: 'Assessment', icon: <AssessmentIcon /> };
    default:
      return { label: 'Activity', icon: <ActivityIcon /> };
  }
}

function activityButtonLabel(activity: Activity): string {
  switch (activity.activityType) {
    case 'assessment':
      return 'Start';
    default:
      return 'Open';
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MilestoneChip({
  milestone,
  index,
  variant,
  onClick,
}: {
  milestone: Milestone;
  index: number;
  variant: ChipVariant;
  onClick: () => void;
}) {
  const label = chipLabel(milestone, index);
  const activityCount = milestone.activities.length;
  const duration = totalDuration(milestone.activities);
  const unlockStr = formatDate(milestone.unlockAt);

  return (
    <button
      className={`design-chip design-chip--${variant}`}
      onClick={onClick}
      type="button"
    >
      <span className="design-chip-label">{label}</span>
      <div className="design-chip-value">
        {variant === 'locked' && <LockIcon />}
        <span className="design-chip-title">{milestone.name}</span>
      </div>
      {variant === 'active' && (
        <div className="design-chip-meta">
          {activityCount > 0 && (
            <span className="design-chip-meta-text">{activityCount} {activityCount === 1 ? 'activity' : 'activities'}</span>
          )}
          {activityCount > 0 && duration > 0 && <span className="design-chip-dot" />}
          {duration > 0 && (
            <span className="design-chip-meta-text">{formatDuration(duration)}</span>
          )}
          {unlockStr && duration > 0 && <span className="design-chip-dot" />}
          {unlockStr && (
            <span className="design-chip-meta-text">Complete before {unlockStr}</span>
          )}
        </div>
      )}
    </button>
  );
}

function ActivityCard({
  activity,
  isFirst,
  isLast,
}: {
  activity: Activity;
  isFirst: boolean;
  isLast: boolean;
}) {
  const { label, icon } = activityTypeInfo(activity);
  const btnLabel = activityButtonLabel(activity);
  const duration = activity.durationSeconds ? formatDuration(activity.durationSeconds) : null;

  let style: React.CSSProperties = {};
  if (isFirst && isLast) style = { borderRadius: '12px' };
  else if (isFirst) style = { borderRadius: '12px 12px 0 0' };
  else if (isLast) style = { borderRadius: '0 0 12px 12px' };

  return (
    <div className="design-activity-card" style={style}>
      <span className="design-activity-title">{activity.title}</span>
      <div className="design-activity-actions">
        <div className="design-activity-meta">
          {icon}
          <span className="design-activity-meta-label">{label}</span>
          {duration && (
            <>
              <span className="design-activity-meta-sep">•</span>
              <span className="design-activity-meta-label">{duration}</span>
            </>
          )}
        </div>
        <button className="design-activity-btn" type="button">{btnLabel}</button>
      </div>
    </div>
  );
}

const PLACEHOLDER_RESOURCES = [
  { title: 'Dare to Lead Research Summary', type: 'PDF' },
  { title: 'The Power of Vulnerability', type: 'Video', duration: '20 min' },
  { title: 'Dare to Lead with Brené Brown', type: 'Podcast', duration: '1:11:50' },
  { title: 'Rumbling with Vulnerability Guide', type: 'PDF' },
  { title: 'Braving Trust Worksheet', type: 'PDF' },
];

// ── Main component ─────────────────────────────────────────────────────────────

export default function DesignPage({ plan }: DesignPageProps) {
  const firstMilestone = plan.milestones[0];
  const [selectedId, setSelectedId] = useState<string>(firstMilestone?.id ?? '');

  const selectedMilestone = plan.milestones.find((m) => m.id === selectedId) ?? firstMilestone;

  if (!selectedMilestone) {
    return (
      <div className="design-page" style={{ padding: '40px 90px', color: '#888' }}>
        No milestones defined.
      </div>
    );
  }

  const objectives = selectedMilestone.objectives?.slice(0, 3) ?? [];
  const activities = selectedMilestone.activities;
  const deadlineStr = formatDate(selectedMilestone.unlockAt);

  return (
    <div className="design-page">
      {/* ── Active Program Header ── */}
      <div className="design-active-program">
        <div className="design-program-heading-row">
          <div className="design-program-heading">
            <span className="design-program-label">Your program in progress</span>
            <span className="design-program-name">{plan.name}</span>
          </div>
          <div className="design-facilitator">
            <div className="design-facilitator-avatar">
              {plan.name.charAt(0).toUpperCase()}
            </div>
            <div className="design-facilitator-info">
              <span className="design-facilitator-label">Your Facilitator</span>
              <span className="design-facilitator-name">Facilitator</span>
            </div>
          </div>
        </div>

        <div className="design-plan-map">
          <div className="design-milestones">
            {plan.milestones.map((milestone, index) => {
              const isSelected = milestone.id === selectedId;
              const variant = getChipVariant(milestone, isSelected);
              return (
                <MilestoneChip
                  key={milestone.id}
                  milestone={milestone}
                  index={index}
                  variant={variant}
                  onClick={() => setSelectedId(milestone.id)}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Lesson Content ── */}
      <div className="design-lesson-content">
        <div className="design-plan-header">
          <h1 className="design-plan-title">{selectedMilestone.name}</h1>
        </div>

        <div className="design-plan-body">
          {/* Lesson Objectives */}
          {objectives.length > 0 && (
            <div className="design-objectives">
              <span className="design-objectives-heading">Lesson Objectives</span>
              <div className="design-objectives-grid">
                {objectives.map((obj, i) => (
                  <div key={i} className="design-objective-col">
                    <div className="design-objective-number">{i + 1}</div>
                    <p className="design-objective-text">{obj.title}{obj.description ? ` ${obj.description}` : ''}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activities */}
          {activities.length > 0 && (
            <div className="design-plan-items">
              {deadlineStr && (
                <div className="design-deadline-row">
                  <CalendarIcon />
                  <span className="design-deadline-text">
                    Complete lesson activities before&nbsp; {deadlineStr}
                  </span>
                </div>
              )}
              <div className="design-activity-list">
                {activities.map((activity, i) => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    isFirst={i === 0}
                    isLast={i === activities.length - 1}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Resources ── */}
      <div className="design-lesson-resources">
        <div className="design-resources-header">
          <span className="design-resources-heading">Resources and downloads</span>
          <div className="design-resources-nav">
            <span className="design-resources-count">{PLACEHOLDER_RESOURCES.length} items</span>
            <button className="design-resources-arrow" type="button" aria-label="Previous">‹</button>
            <button className="design-resources-arrow" type="button" aria-label="Next">›</button>
          </div>
        </div>

        <div className="design-resources-carousel">
          {PLACEHOLDER_RESOURCES.map((resource, i) => (
            <div key={i} className="design-resource-card">
              <div className="design-resource-image">
                <span className="design-resource-image-placeholder">
                  {resource.type === 'Video' ? '▶' : resource.type === 'Podcast' ? '🎧' : '📄'}
                </span>
              </div>
              <div className="design-resource-info">
                <span className="design-resource-title">{resource.title}</span>
                <div className="design-resource-meta">
                  <span className="design-resource-meta-label">{resource.type}</span>
                  {resource.duration && (
                    <>
                      <span className="design-resource-meta-sep">•</span>
                      <span className="design-resource-meta-label">{resource.duration}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
