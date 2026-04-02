import { useState } from 'react';
import type { Activity, Milestone } from '../../types';
import { dateToLocalISO, localISOToDate } from '../../utils/dateHelpers';
import ActivityRow from './ActivityRow';
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
      activityType: 'video',
    };
    onUpdate({ ...milestone, activities: [...milestone.activities, newActivity] });
  };

  const updateObjective = (index: number, title: string) => {
    const next = [...(milestone.objectives ?? [])];
    next[index] = { ...next[index], title };
    onUpdate({ ...milestone, objectives: next });
  };

  const deleteObjective = (index: number) => {
    const next = (milestone.objectives ?? []).filter((_, i) => i !== index);
    onUpdate({ ...milestone, objectives: next.length ? next : undefined });
  };

  const addObjective = () => {
    const next = [...(milestone.objectives ?? []), { title: 'New objective statement' }];
    onUpdate({ ...milestone, objectives: next });
  };

  const activityCount = milestone.activities.length;
  const totalSeconds = milestone.activities.reduce(
    (sum, a) => sum + (a.durationSeconds ?? 0),
    0,
  );
  const totalMinutes = Math.round(totalSeconds / 60);

  return (
    <div className="milestone-detail">
      {/* Header */}
      <div className="milestone-detail-header">
        {editingTitle ? (
          <input
            className="milestone-title-input"
            autoFocus
            value={milestone.name}
            onChange={(e) => onUpdate({ ...milestone, name: e.target.value })}
            onBlur={() => setEditingTitle(false)}
            onKeyDown={(e) => e.key === 'Enter' && setEditingTitle(false)}
          />
        ) : (
          <span className="milestone-title-display" onClick={() => setEditingTitle(true)}>
            {milestone.name || 'Untitled milestone'}
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
      {milestone.milestoneType === 'session' && (
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

      {/* Objectives */}
      <h3 className="section-heading">Lesson Objectives</h3>
      {(milestone.objectives?.length ?? 0) > 0 && (
        <div className="objectives-list">
          {milestone.objectives!.map((obj, index) => (
            <div key={index} className="objective-row">
              <span className="objective-number">{index + 1}</span>
              <input
                className="objective-title-input"
                value={obj.title}
                onChange={(e) => updateObjective(index, e.target.value)}
                placeholder="Objective statement"
              />
              <button
                className="objective-delete-btn"
                onClick={() => deleteObjective(index)}
                aria-label="Remove objective"
              >×</button>
            </div>
          ))}
        </div>
      )}
      <button className="add-objective-btn" onClick={addObjective}>
        + Add objective statement
      </button>

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
      {milestone.milestoneType === 'session' && (
        <div className="session-survey-section">
          <span className="session-survey-label">Post-session survey</span>
          <div className="session-survey-meta">
            <span>📋 Assessment</span>
            <span>·</span>
            <span>5 min</span>
          </div>
        </div>
      )}
    </div>
  );
}
