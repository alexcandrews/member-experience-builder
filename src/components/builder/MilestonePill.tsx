import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Milestone, MilestoneType } from '../../types';
import { formatShortDate, dateToLocalISO, localISOToDate } from '../../utils/dateHelpers';

interface MilestonePillProps {
  milestone: Milestone;
  isSelected: boolean;
  isLocked: boolean;
  onClick: () => void;
  onUpdate: (updated: Milestone) => void;
  onDelete: () => void;
}

export default function MilestonePill({
  milestone,
  isSelected,
  isLocked,
  onClick,
  onUpdate,
  onDelete,
}: MilestonePillProps) {
  const [editingDate, setEditingDate] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: milestone.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  let className = 'milestone-pill';
  if (isSelected) className += ' selected';
  if (isLocked) className += ' locked';
  if (isDragging) className += ' dragging';

  const activityCount = milestone.activities.length;
  const totalSeconds = milestone.activities.reduce(
    (sum, a) => sum + (a.durationSeconds ?? 0),
    0,
  );
  const totalMinutes = Math.round(totalSeconds / 60);

  const toggleType = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next: MilestoneType = milestone.milestoneType === 'chapter' ? 'session' : 'chapter';
    onUpdate({ ...milestone, milestoneType: next });
  };

  const toggleOptional = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate({ ...milestone, optional: !milestone.optional });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onUpdate({ ...milestone, unlockAt: localISOToDate(e.target.value) });
  };

  const handleDateBlur = () => {
    setEditingDate(false);
  };

  const handleDateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingDate(true);
  };

  const handleClearDate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate({ ...milestone, unlockAt: undefined });
    setEditingDate(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={className}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      {/* Drag handle — left edge */}
      <span
        className="pill-drag-handle"
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        title="Drag to reorder"
      >
        ⠿
      </span>

      {/* Hover-reveal delete X */}
      <button
        className="pill-delete-btn"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        title="Delete milestone"
      >
        ×
      </button>

      {/* Type label — clickable to toggle */}
      <button
        className={`pill-type-label ${milestone.milestoneType}`}
        onClick={toggleType}
        title="Click to toggle type"
      >
        {milestone.milestoneType === 'chapter' ? 'Lesson' : 'Coaching Circle'}
      </button>

      {/* Lock icon + title */}
      <div className="pill-title-row">
        {isLocked && <span className="pill-lock-icon">🔒</span>}
        {!isLocked && milestone.milestoneType === 'session' && (
          <span className="pill-session-icon">👤</span>
        )}
        <div className="pill-title">{milestone.name}</div>
      </div>

      {/* Activity metadata */}
      {activityCount > 0 && (
        <div className="pill-activity-meta">
          {activityCount} {activityCount === 1 ? 'activity' : 'activities'}
          {totalMinutes > 0 ? ` · ${totalMinutes} min` : ''}
        </div>
      )}

      {/* Unlock date row */}
      <div className="pill-unlock-row" onClick={(e) => e.stopPropagation()}>
        {editingDate ? (
          <input
            ref={(el) => { if (el) setTimeout(() => el.showPicker?.(), 0); }}
            className="pill-date-input"
            type="datetime-local"
            autoFocus
            value={milestone.unlockAt ? dateToLocalISO(milestone.unlockAt) : ''}
            onChange={handleDateChange}
            onBlur={handleDateBlur}
            onClick={(e) => e.stopPropagation()}
          />
        ) : milestone.unlockAt ? (
          <span className="pill-unlock-date" onClick={handleDateClick} title="Click to edit unlock date">
            {isLocked ? '🔒 ' : ''}Unlocks {formatShortDate(milestone.unlockAt)}
            <button className="pill-date-clear" onClick={handleClearDate} title="Clear date">×</button>
          </span>
        ) : (
          <button className="pill-add-date-btn" onClick={handleDateClick}>
            + Set unlock date
          </button>
        )}
      </div>

      {/* Optional badge */}
      <div className="pill-footer">
        <button
          className={`pill-optional-badge ${milestone.optional ? 'active' : ''}`}
          onClick={toggleOptional}
          title="Toggle optional"
        >
          {milestone.optional ? 'Optional' : 'Required'}
        </button>
      </div>
    </div>
  );
}
