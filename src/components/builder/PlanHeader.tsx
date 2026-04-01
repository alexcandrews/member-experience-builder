import { useState } from 'react';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import type { Plan, Milestone, PlanUpdater } from '../../types';
import MilestonePill from './MilestonePill';
import '../../styles/builder.css';

interface PlanHeaderProps {
  plan: Plan;
  updatePlan: PlanUpdater;
  selectedMilestoneId: string;
  onSelectMilestone: (id: string) => void;
  onOpenConfig: () => void;
  onUpdateMilestone: (updated: Milestone) => void;
  onDeleteMilestone: (id: string) => void;
}

export default function PlanHeader({
  plan,
  updatePlan,
  selectedMilestoneId,
  onSelectMilestone,
  onOpenConfig,
  onUpdateMilestone,
  onDeleteMilestone,
}: PlanHeaderProps) {
  const [editingTitle, setEditingTitle] = useState(false);

  const handleTitleChange = (value: string) => {
    updatePlan((prev) => ({ ...prev, name: value }));
  };

  const handleAddMilestone = () => {
    const newMilestone: Milestone = {
      id: crypto.randomUUID(),
      name: 'New Milestone',
      milestoneType: 'chapter',
      optional: false,
      activities: [],
    };
    updatePlan((prev) => ({ ...prev, milestones: [...prev.milestones, newMilestone] }));
    onSelectMilestone(newMilestone.id);
  };

  const now = new Date();
  const isLocked = (m: Milestone) =>
    m.unlockAt != null && m.unlockAt.getTime() > now.getTime();

  return (
    <div className="plan-header">
      <div className="plan-header-top">
        <div>
          <p className="plan-header-label">Your program in progress</p>
          <div className="plan-title-wrap">
            {editingTitle ? (
              <input
                className="plan-title-input"
                autoFocus
                value={plan.name}
                onChange={(e) => handleTitleChange(e.target.value)}
                onBlur={() => setEditingTitle(false)}
                onKeyDown={(e) => e.key === 'Enter' && setEditingTitle(false)}
              />
            ) : (
              <h1 className="plan-title" onClick={() => setEditingTitle(true)} title="Click to edit">
                {plan.name || 'Untitled Plan'}
              </h1>
            )}
          </div>
        </div>

        <button className="config-btn" onClick={onOpenConfig} title="Plan configuration">
          ⚙ Configure
        </button>
      </div>

      {/* Milestone strip */}
      <div className="milestone-strip">
        <SortableContext
          items={plan.milestones.map((m) => m.id)}
          strategy={horizontalListSortingStrategy}
        >
          {plan.milestones.map((milestone) => (
            <MilestonePill
              key={milestone.id}
              milestone={milestone}
              isSelected={milestone.id === selectedMilestoneId}
              isLocked={isLocked(milestone)}
              onClick={() => onSelectMilestone(milestone.id)}
              onUpdate={onUpdateMilestone}
              onDelete={() => onDeleteMilestone(milestone.id)}
            />
          ))}
        </SortableContext>

        <button
          className="milestone-pill-add"
          onClick={handleAddMilestone}
          title="Add milestone"
        >
          +
        </button>
      </div>
    </div>
  );
}
