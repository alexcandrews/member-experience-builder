import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Milestone } from '../../types';
import { formatShortDate } from '../../utils/dateHelpers';

interface MilestonePillProps {
  milestone: Milestone;
  isSelected: boolean;
  isLocked: boolean;
  onClick: () => void;
}

export default function MilestonePill({
  milestone,
  isSelected,
  isLocked,
  onClick,
}: MilestonePillProps) {
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
      {/* Drag handle */}
      <span
        className="pill-drag-handle"
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        title="Drag to reorder"
      >
        ⠿
      </span>

      {isLocked && (
        <div className="pill-status">
          🔒 UNLOCKS {milestone.unlocksAt ? formatShortDate(milestone.unlocksAt) : ''}
        </div>
      )}

      <div className="pill-title">{milestone.title}</div>

      <div className="pill-meta">
        <span className={`pill-type-badge ${milestone.type}`}>
          {milestone.type === 'chapter' ? '📖 Chapter' : '👥 Session'}
        </span>
        {milestone.optional && <span className="pill-optional">Optional</span>}
      </div>

      {milestone.unlocksAt && !isLocked && (
        <div className="pill-meta" style={{ fontSize: 10, color: '#aaa' }}>
          {formatShortDate(milestone.unlocksAt)}
        </div>
      )}
    </div>
  );
}
