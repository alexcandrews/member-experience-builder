import { useState } from 'react';
import type { Plan } from './types';
import { createDefaultPlan } from './data';
import Navigation from './components/Navigation';
import BuilderPage from './components/builder/BuilderPage';
import SimulatorPage from './components/simulator/SimulatorPage';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState<'builder' | 'simulator'>('builder');
  const [plan, setPlan] = useState<Plan>(createDefaultPlan);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>(
    () => createDefaultPlan().milestones[0].id,
  );

  // Keep selectedMilestoneId in sync if it becomes invalid (e.g. after delete)
  const validSelectedId =
    plan.milestones.find((m) => m.id === selectedMilestoneId)?.id ??
    plan.milestones[0]?.id ??
    '';

  return (
    <div className="app">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'builder' ? (
        <BuilderPage
          plan={plan}
          updatePlan={setPlan}
          selectedMilestoneId={validSelectedId}
          onSelectMilestone={setSelectedMilestoneId}
        />
      ) : (
        <SimulatorPage plan={plan} />
      )}
    </div>
  );
}

export default App;
