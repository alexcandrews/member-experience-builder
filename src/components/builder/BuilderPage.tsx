import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import type { Plan, PlanUpdater, Milestone } from '../../types';
import PlanHeader from './PlanHeader';
import MilestoneDetail from './MilestoneDetail';
import ConfigPanel from './ConfigPanel';

interface BuilderPageProps {
  plan: Plan;
  updatePlan: PlanUpdater;
  selectedMilestoneId: string;
  onSelectMilestone: (id: string) => void;
}

export default function BuilderPage({
  plan,
  updatePlan,
  selectedMilestoneId,
  onSelectMilestone,
}: BuilderPageProps) {
  const [configOpen, setConfigOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    updatePlan((prev) => {
      const oldIndex = prev.milestones.findIndex((m) => m.id === active.id);
      const newIndex = prev.milestones.findIndex((m) => m.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return { ...prev, milestones: arrayMove(prev.milestones, oldIndex, newIndex) };
    });
  };

  const selectedMilestone =
    plan.milestones.find((m) => m.id === selectedMilestoneId) ?? plan.milestones[0];

  const handleMilestoneUpdate = (updated: Milestone) => {
    updatePlan((prev) => ({
      ...prev,
      milestones: prev.milestones.map((m) => (m.id === updated.id ? updated : m)),
    }));
  };

  const handleMilestoneDelete = () => {
    updatePlan((prev) => {
      const remaining = prev.milestones.filter((m) => m.id !== selectedMilestone?.id);
      return { ...prev, milestones: remaining };
    });
    // Select adjacent milestone after delete
    const currentIndex = plan.milestones.findIndex((m) => m.id === selectedMilestone?.id);
    const next =
      plan.milestones[currentIndex + 1] ?? plan.milestones[currentIndex - 1];
    if (next) onSelectMilestone(next.id);
  };

  return (
    <div className="builder-page">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <PlanHeader
          plan={plan}
          updatePlan={updatePlan}
          selectedMilestoneId={selectedMilestoneId}
          onSelectMilestone={onSelectMilestone}
          onOpenConfig={() => setConfigOpen(true)}
        />
      </DndContext>

      {selectedMilestone ? (
        <MilestoneDetail
          milestone={selectedMilestone}
          onUpdate={handleMilestoneUpdate}
          onDelete={handleMilestoneDelete}
        />
      ) : (
        <div className="empty-milestone">
          <p>No milestones yet</p>
          <span>Click the + button above to add your first milestone</span>
        </div>
      )}

      {configOpen && (
        <ConfigPanel
          config={plan.config}
          onUpdate={(updatedConfig) =>
            updatePlan((prev) => ({ ...prev, config: updatedConfig }))
          }
          onClose={() => setConfigOpen(false)}
        />
      )}
    </div>
  );
}
