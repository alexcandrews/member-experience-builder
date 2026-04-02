import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Plan, Milestone, Activity, MilestoneType, PlanUpdater } from '../../types';
import { dateToLocalISO, localISOToDate, formatShortDate } from '../../utils/dateHelpers';
import '../../styles/design.css';

interface DesignPageProps {
  plan: Plan;
  updatePlan: PlanUpdater;
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

function chipLabel(milestone: Milestone): string {
  if (milestone.milestoneType === 'session' && milestone.sessionDate) {
    return milestone.sessionDate.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }
  return milestone.name;
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
  onUpdate,
  onDelete,
}: {
  milestone: Milestone;
  index: number;
  variant: ChipVariant;
  onClick: () => void;
  onUpdate: (updated: Milestone) => void;
  onDelete: () => void;
}) {
  const label = chipLabel(milestone);
  const activityCount = milestone.activities.length;
  const duration = totalDuration(milestone.activities);
  const unlockStr = formatDate(milestone.unlockAt);

  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [editingDate, setEditingDate] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!showMenu) return;
    const handleDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
        setEditingDate(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowMenu(false);
        setEditingDate(false);
      }
    };
    document.addEventListener('mousedown', handleDown);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleDown);
      document.removeEventListener('keydown', handleKey);
    };
  }, [showMenu]);

  const openMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = btnRef.current!.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 6, left: Math.max(8, rect.right - 228) });
    setShowMenu((v) => !v);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className={`design-chip design-chip--${variant}`}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      <span className="design-chip-label">{label}</span>
      <div className="design-chip-value">
        {variant === 'locked' && <LockIcon />}
        <span className="design-chip-title">{milestone.description ?? milestone.name}</span>
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

      {/* Three-dot menu button — revealed on hover */}
      <button
        ref={btnRef}
        className="design-chip-menu-btn"
        type="button"
        aria-label="Milestone options"
        onClick={openMenu}
      >
        ⋯
      </button>

      {/* Floating context menu — portaled to body to escape backdrop-filter containing block */}
      {showMenu && menuPos && createPortal(
        <div
          ref={menuRef}
          className="design-chip-menu"
          style={{ top: menuPos.top, left: menuPos.left }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 1. Name (e.g. "Lesson 1") */}
          <div className="design-chip-menu-row">
            <span className="design-chip-menu-lbl">Name</span>
            <input
              className="design-chip-menu-input"
              value={milestone.name}
              onChange={(e) => onUpdate({ ...milestone, name: e.target.value })}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* 2. Description (e.g. "Intro to Dare to Lead") */}
          <div className="design-chip-menu-row">
            <span className="design-chip-menu-lbl">Description</span>
            <input
              className="design-chip-menu-input"
              value={milestone.description ?? ''}
              placeholder="Milestone description"
              onChange={(e) => onUpdate({ ...milestone, description: e.target.value || undefined })}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* 2. Type */}
          <div className="design-chip-menu-row">
            <span className="design-chip-menu-lbl">Type</span>
            <div className="design-chip-menu-seg">
              {(['chapter', 'session'] as MilestoneType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`design-chip-menu-seg-btn${milestone.milestoneType === t ? ' active' : ''}`}
                  onClick={() => onUpdate({ ...milestone, milestoneType: t })}
                >
                  {t === 'chapter' ? 'Chapter' : 'Session'}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Default status */}
          <div className="design-chip-menu-row">
            <span className="design-chip-menu-lbl">Default Status</span>
            <div className="design-chip-menu-seg">
              {(['unlocked', 'locked'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`design-chip-menu-seg-btn${(milestone.memberDefaultStatus ?? 'unlocked') === s ? ' active' : ''}`}
                  onClick={() => onUpdate({ ...milestone, memberDefaultStatus: s })}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Unlocks at */}
          <div className="design-chip-menu-row">
            <span className="design-chip-menu-lbl">Unlocks At</span>
            <div className="design-chip-menu-date-row">
              {editingDate ? (
                <input
                  className="design-chip-menu-date-input"
                  type="datetime-local"
                  autoFocus
                  value={milestone.unlockAt ? dateToLocalISO(milestone.unlockAt) : ''}
                  onChange={(e) => onUpdate({ ...milestone, unlockAt: localISOToDate(e.target.value) })}
                  onBlur={() => setEditingDate(false)}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : milestone.unlockAt ? (
                <>
                  <span
                    style={{ flex: 1, cursor: 'pointer', fontSize: 12 }}
                    onClick={() => setEditingDate(true)}
                    title="Click to edit"
                  >
                    {formatShortDate(milestone.unlockAt)}
                  </span>
                  <button
                    type="button"
                    className="design-chip-menu-date-clear"
                    onClick={() => onUpdate({ ...milestone, unlockAt: undefined })}
                    title="Clear date"
                  >
                    ×
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="design-chip-menu-date-btn"
                  onClick={() => setEditingDate(true)}
                >
                  Set date
                </button>
              )}
            </div>
          </div>

          {/* 5. Optional */}
          <div className="design-chip-menu-row">
            <label className="design-chip-menu-check-row">
              <input
                type="checkbox"
                checked={milestone.optional}
                onChange={() => onUpdate({ ...milestone, optional: !milestone.optional })}
              />
              Optional
            </label>
          </div>

          {/* 6. Delete */}
          <div className="design-chip-menu-row design-chip-menu-row--danger">
            <button
              type="button"
              className="design-chip-menu-delete-btn"
              onClick={() => { onDelete(); setShowMenu(false); }}
            >
              Delete milestone
            </button>
          </div>
        </div>,
        document.body,
      )}
    </div>
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

export default function DesignPage({ plan, updatePlan }: DesignPageProps) {
  const firstMilestone = plan.milestones[0];
  const [selectedId, setSelectedId] = useState<string>(firstMilestone?.id ?? '');
  const [editingName, setEditingName] = useState(false);
  const [editingMilestoneName, setEditingMilestoneName] = useState(false);

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
            {editingName ? (
                <input
                  className="design-program-name-input"
                  autoFocus
                  value={plan.name}
                  onChange={(e) => updatePlan((prev) => ({ ...prev, name: e.target.value }))}
                  onBlur={() => setEditingName(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setEditingName(false)}
                />
              ) : (
                <span
                  className="design-program-name"
                  onClick={() => setEditingName(true)}
                  title="Click to edit"
                >
                  {plan.name || 'Untitled Plan'}
                </span>
              )}
          </div>
          <div className="design-facilitator">
            <div className="design-facilitator-avatar" />
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
                  onUpdate={(updated) =>
                    updatePlan((prev) => ({
                      ...prev,
                      milestones: prev.milestones.map((m) => (m.id === updated.id ? updated : m)),
                    }))
                  }
                  onDelete={() =>
                    updatePlan((prev) => {
                      const remaining = prev.milestones.filter((m) => m.id !== milestone.id);
                      if (selectedId === milestone.id) setSelectedId(remaining[0]?.id ?? '');
                      return { ...prev, milestones: remaining };
                    })
                  }
                />
              );
            })}
            <button
              className="design-chip design-chip--add"
              type="button"
              aria-label="Add milestone"
              onClick={() => {
                const newMilestone: Milestone = {
                  id: crypto.randomUUID(),
                  name: `Lesson ${plan.milestones.length + 1}`,
                  milestoneType: 'chapter',
                  optional: false,
                  activities: [],
                };
                updatePlan((prev) => ({ ...prev, milestones: [...prev.milestones, newMilestone] }));
                setSelectedId(newMilestone.id);
              }}
            >
              <span className="design-chip-add-icon">+</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Lesson Content ── */}
      <div className="design-lesson-content">
        <div className="design-plan-header">
          {editingMilestoneName ? (
            <input
              className="design-plan-title-input"
              autoFocus
              value={selectedMilestone.description ?? ''}
              onChange={(e) => updatePlan((prev) => ({
                ...prev,
                milestones: prev.milestones.map((m) =>
                  m.id === selectedMilestone.id ? { ...m, description: e.target.value || undefined } : m
                ),
              }))}
              onBlur={() => setEditingMilestoneName(false)}
              onKeyDown={(e) => e.key === 'Enter' && setEditingMilestoneName(false)}
            />
          ) : (
            <h1
              className="design-plan-title"
              onClick={() => setEditingMilestoneName(true)}
              title="Click to edit"
            >
              {selectedMilestone.description ?? selectedMilestone.name}
            </h1>
          )}
        </div>

        <div className="design-plan-body">
          {/* Lesson Objectives */}
          {objectives.length > 0 && (
            <div className="design-objectives-wrapper">
              <button
                type="button"
                className="design-objectives-dismiss"
                aria-label="Remove lesson objectives"
                onClick={() =>
                  updatePlan((prev) => ({
                    ...prev,
                    milestones: prev.milestones.map((m) =>
                      m.id === selectedMilestone.id ? { ...m, objectives: [] } : m
                    ),
                  }))
                }
              >
                ×
              </button>
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
