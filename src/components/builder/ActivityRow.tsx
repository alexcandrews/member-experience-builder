import { useState } from 'react';
import type { Activity, ActivityType } from '../../types';

const TYPE_ICONS: Record<ActivityType, string> = {
  assessment: '📋',
  video: '▶',
  resource: '📄',
  workbook: '📓',
  pdf: '📑',
  ai_experience: '✨',
  ink: '✏️',
};

interface ActivityRowProps {
  activity: Activity;
  onUpdate: (updated: Activity) => void;
  onDelete: () => void;
}

export default function ActivityRow({ activity, onUpdate, onDelete }: ActivityRowProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingRecord, setEditingRecord] = useState(false);

  const durationMinutes =
    activity.durationSeconds != null ? Math.round(activity.durationSeconds / 60) : null;

  return (
    <div className="activity-row">
      <span className="activity-icon">{TYPE_ICONS[activity.activityType]}</span>

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
        value={activity.activityType}
        onChange={(e) => onUpdate({ ...activity, activityType: e.target.value as ActivityType })}
      >
        <option value="video">Video</option>
        <option value="workbook">Workbook</option>
        <option value="pdf">PDF</option>
        <option value="ai_experience">AI Experience</option>
        <option value="assessment">Assessment</option>
        <option value="resource">Resource</option>
        <option value="ink">Ink / Reflection</option>
      </select>

      {editingRecord ? (
        <input
          className="activity-record-input"
          autoFocus
          placeholder="Record UUID"
          value={activity.associatedRecordUuid ?? ''}
          onChange={(e) => onUpdate({ ...activity, associatedRecordUuid: e.target.value })}
          onBlur={() => setEditingRecord(false)}
          onKeyDown={(e) => e.key === 'Enter' && setEditingRecord(false)}
        />
      ) : (
        <span
          className="activity-record-display"
          onClick={() => setEditingRecord(true)}
          title={activity.associatedRecordUuid || 'Click to add record UUID'}
        >
          {activity.associatedRecordUuid || '+ record'}
        </span>
      )}

      {durationMinutes != null && (
        <span className="activity-duration">{durationMinutes} min</span>
      )}

      <button className="activity-delete-btn" onClick={onDelete} title="Remove activity">
        ×
      </button>
    </div>
  );
}
