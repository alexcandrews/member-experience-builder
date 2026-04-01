import { useState } from 'react';
import type { Activity, Milestone, Resource } from '../../types';
import { dateToLocalISO, localISOToDate } from '../../utils/dateHelpers';
import ActivityRow from './ActivityRow';
import ResourceStrip from './ResourceStrip';
import '../../styles/builder.css';

interface MilestoneDetailProps {
  milestone: Milestone;
  onUpdate: (updated: Milestone) => void;
}

export default function MilestoneDetail({ milestone, onUpdate }: MilestoneDetailProps) {
  const [editingTitle, setEditingTitle] = useState(false);

  const updateActivity = (index: number, updated: Activity) => {
    const next = [...milestone.activities];
    next[index] = updated;
    onUpdate({ ...milestone, activities: next });
  };

  const deleteActivity = (index: number) => {
    onUpdate({ ...milestone, activities: milestone.activities.filter((_, i) => i !== index) });
  };

  const addActivity = () => {
    const newActivity: Activity = {
      id: crypto.randomUUID(),
      title: 'New activity',
      type: 'video',
    };
    onUpdate({ ...milestone, activities: [...milestone.activities, newActivity] });
  };

  const updateResources = (resources: Resource[]) => {
    onUpdate({ ...milestone, resources });
  };

  const activityCount = milestone.activities.length;
  const totalMinutes = milestone.activities.reduce(
    (sum, a) => sum + (a.durationMinutes ?? 0),
    0,
  );

  return (
    <div className="milestone-detail">
      {/* Header */}
      <div className="milestone-detail-header">
        {editingTitle ? (
          <input
            className="milestone-title-input"
            autoFocus
            value={milestone.title}
            onChange={(e) => onUpdate({ ...milestone, title: e.target.value })}
            onBlur={() => setEditingTitle(false)}
            onKeyDown={(e) => e.key === 'Enter' && setEditingTitle(false)}
          />
        ) : (
          <span className="milestone-title-display" onClick={() => setEditingTitle(true)}>
            {milestone.title || 'Untitled milestone'}
          </span>
        )}

        {activityCount > 0 && (
          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#888', alignSelf: 'center' }}>
            {activityCount} {activityCount === 1 ? 'activity' : 'activities'}
            {totalMinutes > 0 ? ` · ${totalMinutes} min total` : ''}
          </span>
        )}
      </div>

      {/* Session date (session milestones only) */}
      {milestone.type === 'session' && (
        <div className="milestone-meta-row">
          <span className="meta-label">Session date</span>
          <input
            className="meta-datetime"
            type="datetime-local"
            value={milestone.sessionDate ? dateToLocalISO(milestone.sessionDate) : ''}
            onChange={(e) =>
              onUpdate({ ...milestone, sessionDate: localISOToDate(e.target.value) })
            }
            onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
          />
        </div>
      )}

      {/* Activities */}
      <h3 className="section-heading">Activities</h3>
      {milestone.activities.length > 0 && (
        <div className="activities-list">
          {milestone.activities.map((activity, index) => (
            <ActivityRow
              key={activity.id}
              activity={activity}
              onUpdate={(updated) => updateActivity(index, updated)}
              onDelete={() => deleteActivity(index)}
            />
          ))}
        </div>
      )}

      <button className="add-activity-btn" onClick={addActivity}>
        + Add activity
      </button>

      {/* Post-session survey (session milestones only) */}
      {milestone.type === 'session' && (
        <div className="session-survey-section">
          <span className="session-survey-label">Post-session survey</span>
          <div className="session-survey-meta">
            <span>📋 Assessment</span>
            <span>·</span>
            <span>5 min</span>
          </div>
        </div>
      )}

      {/* Resources */}
      <ResourceStrip resources={milestone.resources} onUpdate={updateResources} />
    </div>
  );
}
