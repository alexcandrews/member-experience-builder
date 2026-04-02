import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Plan, Milestone, Activity, ActivityType, Resource, ResourceType, MilestoneType, PlanUpdater } from '../../types';
import { dateToLocalISO, localISOToDate, formatShortDate } from '../../utils/dateHelpers';
import PlanSettingsPanel from './PlanSettingsPanel';
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

function WorkbookIcon() {
  return (
    <svg className="design-activity-meta-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 2h9a1 1 0 011 1v10a1 1 0 01-1 1H3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M3 2v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 5.5h4M6 8h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function PdfIcon() {
  return (
    <svg className="design-activity-meta-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 1.5h5l3.5 3.5V14a.5.5 0 01-.5.5H4a.5.5 0 01-.5-.5V2a.5.5 0 01.5-.5z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 1.5V5h3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6 9.5h4M6 11.5h2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function AiExperienceIcon() {
  return (
    <svg className="design-activity-meta-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 1l1.5 4.5L14 7l-4.5 1.5L8 13l-1.5-4.5L2 7l4.5-1.5L8 1z" fill="currentColor" />
      <path d="M12.5 2l.5 1.5L14.5 4l-1.5.5L12.5 6l-.5-1.5L10.5 4l1.5-.5L12.5 2z" fill="currentColor" opacity="0.6" />
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
    case 'workbook':
      return { label: 'Workbook', icon: <WorkbookIcon /> };
    case 'pdf':
      return { label: 'PDF', icon: <PdfIcon /> };
    case 'ai_experience':
      return { label: 'AI Experience', icon: <AiExperienceIcon /> };
    default:
      return { label: 'Activity', icon: <ActivityIcon /> };
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

      {/* Hover-reveal actions: three-dot menu + delete */}
      <div className="design-chip-actions">
        <button
          ref={btnRef}
          className="design-chip-menu-btn"
          type="button"
          aria-label="Milestone options"
          onClick={openMenu}
        >
          ⋯
        </button>
        <button
          type="button"
          className="design-chip-delete-btn"
          aria-label="Delete milestone"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
        >
          ×
        </button>
      </div>

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

        </div>,
        document.body,
      )}
    </div>
  );
}

const ACTIVITY_TYPE_OPTIONS: { value: ActivityType; label: string }[] = [
  { value: 'video', label: 'Video' },
  { value: 'workbook', label: 'Workbook' },
  { value: 'pdf', label: 'PDF' },
  { value: 'ai_experience', label: 'AI Experience' },
  { value: 'assessment', label: 'Assessment' },
  { value: 'resource', label: 'Resource' },
];

function activityButtonLabel(activity: Activity): string {
  switch (activity.activityType) {
    case 'assessment':
      return 'Start';
    case 'pdf':
    case 'workbook':
      return 'Download';
    default:
      return 'Open';
  }
}

function ThreeDotsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="3" r="1.5" fill="currentColor" />
      <circle cx="8" cy="8" r="1.5" fill="currentColor" />
      <circle cx="8" cy="13" r="1.5" fill="currentColor" />
    </svg>
  );
}

function ActivityCard({
  activity,
  isFirst,
  isLast,
  isEditingTitle,
  onStartEditTitle,
  onStopEditTitle,
  onUpdate,
  onDelete,
}: {
  activity: Activity;
  isFirst: boolean;
  isLast: boolean;
  isEditingTitle: boolean;
  onStartEditTitle: () => void;
  onStopEditTitle: () => void;
  onUpdate: (updated: Activity) => void;
  onDelete: () => void;
}) {
  const { label, icon } = activityTypeInfo(activity);
  const btnLabel = activityButtonLabel(activity);
  const duration = activity.durationSeconds ? formatDuration(activity.durationSeconds) : null;

  const [editingType, setEditingType] = useState(false);
  const [editingDuration, setEditingDuration] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) &&
          menuBtnRef.current && !menuBtnRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  let style: React.CSSProperties = {};
  if (isFirst && isLast) style = { borderRadius: '12px' };
  else if (isFirst) style = { borderRadius: '12px 12px 0 0' };
  else if (isLast) style = { borderRadius: '0 0 12px 12px' };

  const durationMin = activity.durationSeconds ? Math.round(activity.durationSeconds / 60) : '';

  return (
    <div className="design-activity-card" style={style}>
      {/* Title */}
      {isEditingTitle ? (
        <input
          className="design-activity-title-input"
          autoFocus
          value={activity.title}
          onChange={(e) => onUpdate({ ...activity, title: e.target.value })}
          onBlur={onStopEditTitle}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === 'Escape') onStopEditTitle();
          }}
        />
      ) : (
        <span
          className="design-activity-title design-activity-title--editable"
          onClick={onStartEditTitle}
          title="Click to edit"
        >
          {activity.title || 'Untitled activity'}
        </span>
      )}

      {/* Actions */}
      <div className="design-activity-actions">
        <div className="design-activity-meta">
          {icon}
          {editingType ? (
            <select
              className="design-activity-type-select"
              autoFocus
              value={activity.activityType}
              onChange={(e) => {
                onUpdate({ ...activity, activityType: e.target.value as ActivityType });
                setEditingType(false);
              }}
              onBlur={() => setEditingType(false)}
            >
              {ACTIVITY_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : (
            <span
              className="design-activity-meta-label design-activity-meta-label--editable"
              onClick={() => setEditingType(true)}
              title="Click to change type"
            >
              {label}
            </span>
          )}
          {(duration || editingDuration) && (
            <>
              <span className="design-activity-meta-sep">&bull;</span>
              {editingDuration ? (
                <>
                  <input
                    className="design-activity-duration-input"
                    type="number"
                    min={0}
                    autoFocus
                    placeholder="—"
                    value={durationMin}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      onUpdate({ ...activity, durationSeconds: Number.isNaN(v) ? undefined : v * 60 });
                    }}
                    onBlur={() => setEditingDuration(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') setEditingDuration(false);
                    }}
                  />
                  <span className="design-activity-duration-suffix">min</span>
                </>
              ) : (
                <span
                  className="design-activity-meta-label design-activity-meta-label--editable"
                  onClick={() => setEditingDuration(true)}
                  title="Click to edit duration"
                >
                  {duration}
                </span>
              )}
            </>
          )}
          {!duration && !editingDuration && (
            <span
              className="design-activity-duration-add"
              onClick={() => setEditingDuration(true)}
              title="Add duration"
            >
              + duration
            </span>
          )}
        </div>
        <button className="design-activity-btn" type="button">{btnLabel}</button>

        {/* Three-dot menu + delete */}
        <div className="design-activity-card-actions">
          <button
            ref={menuBtnRef}
            type="button"
            className="design-activity-menu-btn"
            aria-label="Activity options"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <ThreeDotsIcon />
          </button>
          <button
            type="button"
            className="design-activity-delete-btn"
            aria-label="Remove activity"
            onClick={onDelete}
          >×</button>
        </div>

        {/* Menu popover */}
        {menuOpen && (
          <div ref={menuRef} className="design-activity-menu">
            <label className="design-activity-menu-label">Resource URL</label>
            <input
              className="design-activity-menu-input"
              type="url"
              autoFocus
              placeholder="https://…"
              value={activity.resourceUrl ?? ''}
              onChange={(e) => onUpdate({ ...activity, resourceUrl: e.target.value || undefined })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === 'Escape') setMenuOpen(false);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Resource helpers ────────────────────────────────────────────────────────

const RESOURCE_TYPE_OPTIONS: { value: ResourceType; label: string }[] = [
  { value: 'pdf', label: 'PDF' },
  { value: 'video', label: 'Video' },
  { value: 'podcast', label: 'Podcast' },
];

function resourceTypeIcon(type: ResourceType): string {
  switch (type) {
    case 'video': return '▶';
    case 'podcast': return '🎧';
    case 'pdf': return '📄';
  }
}

function resourceTypeLabel(type: ResourceType): string {
  return RESOURCE_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

function formatResourceDuration(minutes: number): string {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}:${String(m).padStart(2, '0')} hr` : `${h} hr`;
  }
  return `${minutes} min`;
}

function ResourceCard({
  resource,
  isEditingTitle,
  onStartEditTitle,
  onStopEditTitle,
  onUpdate,
  onDelete,
}: {
  resource: Resource;
  isEditingTitle: boolean;
  onStartEditTitle: () => void;
  onStopEditTitle: () => void;
  onUpdate: (updated: Resource) => void;
  onDelete: () => void;
}) {
  const [editingType, setEditingType] = useState(false);
  const [editingDuration, setEditingDuration] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const duration = resource.durationMinutes ? formatResourceDuration(resource.durationMinutes) : null;

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) &&
          menuBtnRef.current && !menuBtnRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  return (
    <div className="design-resource-card">
      <div className="design-resource-image">
        <span className="design-resource-image-placeholder">
          {resourceTypeIcon(resource.resourceType)}
        </span>

        {/* Hover-reveal actions */}
        <div className="design-resource-card-actions">
          <button
            ref={menuBtnRef}
            type="button"
            className="design-resource-menu-btn"
            aria-label="Resource options"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <ThreeDotsIcon />
          </button>
          <button
            type="button"
            className="design-resource-delete-btn"
            aria-label="Remove resource"
            onClick={onDelete}
          >×</button>
        </div>
      </div>

      <div className="design-resource-info">
        {/* Title: click-to-edit */}
        {isEditingTitle ? (
          <input
            className="design-resource-title-input"
            autoFocus
            value={resource.title}
            onChange={(e) => onUpdate({ ...resource, title: e.target.value })}
            onBlur={onStopEditTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === 'Escape') onStopEditTitle();
            }}
          />
        ) : (
          <span
            className="design-resource-title design-resource-title--editable"
            onClick={onStartEditTitle}
            title="Click to edit"
          >
            {resource.title || 'Untitled resource'}
          </span>
        )}

        <div className="design-resource-meta">
          {/* Type: click-to-select */}
          {editingType ? (
            <select
              className="design-resource-type-select"
              autoFocus
              value={resource.resourceType}
              onChange={(e) => {
                onUpdate({ ...resource, resourceType: e.target.value as ResourceType });
                setEditingType(false);
              }}
              onBlur={() => setEditingType(false)}
            >
              {RESOURCE_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : (
            <span
              className="design-resource-meta-label design-resource-meta-label--editable"
              onClick={() => setEditingType(true)}
              title="Click to change type"
            >
              {resourceTypeLabel(resource.resourceType)}
            </span>
          )}

          {/* Duration: click-to-edit */}
          {(duration || editingDuration) && (
            <>
              <span className="design-resource-meta-sep">&bull;</span>
              {editingDuration ? (
                <>
                  <input
                    className="design-resource-duration-input"
                    type="number"
                    min={0}
                    autoFocus
                    placeholder="—"
                    value={resource.durationMinutes ?? ''}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      onUpdate({ ...resource, durationMinutes: Number.isNaN(v) ? undefined : v });
                    }}
                    onBlur={() => setEditingDuration(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') setEditingDuration(false);
                    }}
                  />
                  <span className="design-resource-duration-suffix">min</span>
                </>
              ) : (
                <span
                  className="design-resource-meta-label design-resource-meta-label--editable"
                  onClick={() => setEditingDuration(true)}
                  title="Click to edit duration"
                >
                  {duration}
                </span>
              )}
            </>
          )}
          {!duration && !editingDuration && (
            <span
              className="design-resource-duration-add"
              onClick={() => setEditingDuration(true)}
              title="Add duration"
            >
              + duration
            </span>
          )}
        </div>
      </div>

      {/* URL popover */}
      {menuOpen && (
        <div ref={menuRef} className="design-resource-menu">
          <label className="design-resource-menu-label">Resource URL</label>
          <input
            className="design-resource-menu-input"
            type="url"
            autoFocus
            placeholder="https://…"
            value={resource.url ?? ''}
            onChange={(e) => onUpdate({ ...resource, url: e.target.value || undefined })}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === 'Escape') setMenuOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function DesignPage({ plan, updatePlan }: DesignPageProps) {
  const firstMilestone = plan.milestones[0];
  const [selectedId, setSelectedId] = useState<string>(firstMilestone?.id ?? '');
  const [editingName, setEditingName] = useState(false);
  const [editingMilestoneName, setEditingMilestoneName] = useState(false);
  const [editingObjectiveIndex, setEditingObjectiveIndex] = useState<number | null>(null);
  const [editingActivityIndex, setEditingActivityIndex] = useState<number | null>(null);
  const [editingResourceIndex, setEditingResourceIndex] = useState<number | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

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
  const resources = selectedMilestone.resources ?? [];
  const deadlineStr = formatDate(selectedMilestone.unlockAt);

  const updateActivity = (index: number, updated: Activity) => {
    updatePlan((prev) => ({
      ...prev,
      milestones: prev.milestones.map((m) =>
        m.id === selectedMilestone.id
          ? { ...m, activities: m.activities.map((a, i) => (i === index ? updated : a)) }
          : m
      ),
    }));
  };

  const deleteActivity = (index: number) => {
    updatePlan((prev) => ({
      ...prev,
      milestones: prev.milestones.map((m) =>
        m.id === selectedMilestone.id
          ? { ...m, activities: m.activities.filter((_, i) => i !== index) }
          : m
      ),
    }));
    if (editingActivityIndex === index) setEditingActivityIndex(null);
  };

  const addActivity = () => {
    const newActivity: Activity = {
      id: crypto.randomUUID(),
      title: 'New activity',
      activityType: 'video',
    };
    updatePlan((prev) => ({
      ...prev,
      milestones: prev.milestones.map((m) =>
        m.id === selectedMilestone.id
          ? { ...m, activities: [...m.activities, newActivity] }
          : m
      ),
    }));
    setEditingActivityIndex(activities.length);
  };

  const updateResource = (index: number, updated: Resource) => {
    updatePlan((prev) => ({
      ...prev,
      milestones: prev.milestones.map((m) =>
        m.id === selectedMilestone.id
          ? { ...m, resources: (m.resources ?? []).map((r, i) => (i === index ? updated : r)) }
          : m
      ),
    }));
  };

  const deleteResource = (index: number) => {
    updatePlan((prev) => ({
      ...prev,
      milestones: prev.milestones.map((m) =>
        m.id === selectedMilestone.id
          ? { ...m, resources: (m.resources ?? []).filter((_, i) => i !== index) }
          : m
      ),
    }));
    if (editingResourceIndex === index) setEditingResourceIndex(null);
  };

  const addResource = () => {
    const newResource: Resource = {
      id: crypto.randomUUID(),
      title: 'New resource',
      resourceType: 'pdf',
    };
    updatePlan((prev) => ({
      ...prev,
      milestones: prev.milestones.map((m) =>
        m.id === selectedMilestone.id
          ? { ...m, resources: [...(m.resources ?? []), newResource] }
          : m
      ),
    }));
    setEditingResourceIndex(resources.length);
  };

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
          <button
            className="design-settings-btn"
            onClick={() => setSettingsOpen(true)}
            title="Plan Settings"
          >
            ⚙ Plan Settings
          </button>
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
                  resources: [],
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
          {objectives.length === 0 && (
            <button
              type="button"
              className="design-add-objective-btn"
              onClick={() =>
                updatePlan((prev) => ({
                  ...prev,
                  milestones: prev.milestones.map((m) =>
                    m.id === selectedMilestone.id
                      ? { ...m, objectives: [{ title: 'New objective statement' }] }
                      : m
                  ),
                }))
              }
            >
              + Add Objective
            </button>
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
                      <div className="design-objective-number-row">
                        <div className="design-objective-number">{i + 1}</div>
                        <button
                          type="button"
                          className="design-objective-remove-btn"
                          aria-label="Remove objective"
                          onClick={() =>
                            updatePlan((prev) => ({
                              ...prev,
                              milestones: prev.milestones.map((m) => {
                                if (m.id !== selectedMilestone.id) return m;
                                const next = (m.objectives ?? []).filter((_, idx) => idx !== i);
                                return { ...m, objectives: next.length ? next : undefined };
                              }),
                            }))
                          }
                        >×</button>
                      </div>
                      {editingObjectiveIndex === i ? (
                        <textarea
                          className="design-objective-textarea"
                          autoFocus
                          value={obj.title}
                          onChange={(e) =>
                            updatePlan((prev) => ({
                              ...prev,
                              milestones: prev.milestones.map((m) =>
                                m.id === selectedMilestone.id
                                  ? {
                                      ...m,
                                      objectives: m.objectives!.map((o, idx) =>
                                        idx === i ? { ...o, title: e.target.value } : o
                                      ),
                                    }
                                  : m
                              ),
                            }))
                          }
                          onBlur={() => setEditingObjectiveIndex(null)}
                          onKeyDown={(e) => e.key === 'Escape' && setEditingObjectiveIndex(null)}
                        />
                      ) : (
                        <p
                          className="design-objective-text design-objective-text--editable"
                          onClick={() => setEditingObjectiveIndex(i)}
                          title="Click to edit"
                        >
                          {obj.title}
                        </p>
                      )}
                    </div>
                  ))}
                  {objectives.length < 3 && (
                    <div className="design-objective-col design-objective-col--add">
                      <button
                        type="button"
                        className="design-objective-add-btn"
                        onClick={() =>
                          updatePlan((prev) => ({
                            ...prev,
                            milestones: prev.milestones.map((m) =>
                              m.id === selectedMilestone.id
                                ? { ...m, objectives: [...(m.objectives ?? []), { title: 'New objective statement' }] }
                                : m
                            ),
                          }))
                        }
                      >
                        + Add
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Activities */}
          <div className="design-plan-items">
            {deadlineStr && (
              <div className="design-deadline-row">
                <CalendarIcon />
                <span className="design-deadline-text">
                  Complete lesson activities before&nbsp; {deadlineStr}
                </span>
              </div>
            )}
            {activities.length > 0 && (
              <div className="design-activity-list">
                {activities.map((activity, i) => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    isFirst={i === 0}
                    isLast={i === activities.length - 1}
                    isEditingTitle={editingActivityIndex === i}
                    onStartEditTitle={() => setEditingActivityIndex(i)}
                    onStopEditTitle={() => setEditingActivityIndex(null)}
                    onUpdate={(updated) => updateActivity(i, updated)}
                    onDelete={() => deleteActivity(i)}
                  />
                ))}
              </div>
            )}
            <button
              type="button"
              className={`design-activity-add-btn${activities.length === 0 ? ' design-activity-add-btn--empty' : ''}`}
              onClick={addActivity}
            >
              + Add Activity
            </button>
          </div>
        </div>
      </div>

      {/* ── Resources ── */}
      <div className="design-lesson-resources">
        <div className="design-resources-header">
          <span className="design-resources-heading">Resources and downloads</span>
          <div className="design-resources-nav">
            <span className="design-resources-count">{resources.length} items</span>
            <button className="design-resources-arrow" type="button" aria-label="Previous">‹</button>
            <button className="design-resources-arrow" type="button" aria-label="Next">›</button>
          </div>
        </div>

        <div className="design-resources-carousel">
          {resources.map((resource, i) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              isEditingTitle={editingResourceIndex === i}
              onStartEditTitle={() => setEditingResourceIndex(i)}
              onStopEditTitle={() => setEditingResourceIndex(null)}
              onUpdate={(updated) => updateResource(i, updated)}
              onDelete={() => deleteResource(i)}
            />
          ))}
          <button
            type="button"
            className="design-resource-add-btn"
            onClick={addResource}
          >
            +<span>Add Resource</span>
          </button>
        </div>
      </div>

      {settingsOpen && (
        <PlanSettingsPanel
          config={plan.config}
          onUpdate={(updatedConfig) =>
            updatePlan((prev) => ({ ...prev, config: updatedConfig }))
          }
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}
