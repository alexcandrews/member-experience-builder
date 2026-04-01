import { useState } from 'react';
import type { Activity, ActivityType } from '../../types';

const TYPE_ICONS: Record<ActivityType, string> = {
  assessment: '📋',
  video: '▶',
  resource: '📄',
};

interface ActivityRowProps {
  activity: Activity;
  onUpdate: (updated: Activity) => void;
  onDelete: () => void;
}

export default function ActivityRow({ activity, onUpdate, onDelete }: ActivityRowProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingRecord, setEditingRecord] = useState(false);

  return (
    <div className="activity-row">
      <span className="activity-icon">{TYPE_ICONS[activity.type]}</span>

      {editingTitle ? (
        <input
          className="activity-title-input"
          autoFocus
          value={activity.title}
          onChange={(e) => onUpdate({ ...activity, title: e.target.value })}
          onBlur={() => setEditingTitle(false)}
          onKeyDown={(e) => e.key === 'Enter' && setEditingTitle(false)}
        />
      ) : (
        <span className="activity-title-display" onClick={() => setEditingTitle(true)}>
          {activity.title || 'Untitled activity'}
        </span>
      )}

      <select
        className="activity-type-select"
        value={activity.type}
        onChange={(e) => onUpdate({ ...activity, type: e.target.value as ActivityType })}
      >
        <option value="video">Video</option>
        <option value="assessment">Assessment</option>
        <option value="resource">Resource</option>
      </select>

      {editingRecord ? (
        <input
          className="activity-record-input"
          autoFocus
          placeholder="Record ID / URL"
          value={activity.associatedRecord ?? ''}
          onChange={(e) => onUpdate({ ...activity, associatedRecord: e.target.value })}
          onBlur={() => setEditingRecord(false)}
          onKeyDown={(e) => e.key === 'Enter' && setEditingRecord(false)}
        />
      ) : (
        <span
          className="activity-record-display"
          onClick={() => setEditingRecord(true)}
          title={activity.associatedRecord || 'Click to add record'}
        >
          {activity.associatedRecord || '+ record'}
        </span>
      )}

      {activity.durationMinutes != null && (
        <span className="activity-duration">{activity.durationMinutes} min</span>
      )}

      <button className="activity-delete-btn" onClick={onDelete} title="Remove activity">
        ×
      </button>
    </div>
  );
}
