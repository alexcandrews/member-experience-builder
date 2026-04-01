import { useRef, useState } from 'react';
import type { Plan } from './types';
import { createDefaultPlan } from './data';
import { downloadPlanJSON, parsePlanJSON } from './utils/importExport';
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
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validSelectedId =
    plan.milestones.find((m) => m.id === selectedMilestoneId)?.id ??
    plan.milestones[0]?.id ??
    '';

  const handleExport = () => {
    downloadPlanJSON(plan);
  };

  const handleImportClick = () => {
    setImportError(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = parsePlanJSON(event.target?.result as string);
        setPlan(imported);
        setSelectedMilestoneId(imported.milestones[0]?.id ?? '');
        setImportError(null);
      } catch (err) {
        setImportError(err instanceof Error ? err.message : 'Invalid JSON file.');
      }
    };
    reader.readAsText(file);
    // Reset so the same file can be re-imported
    e.target.value = '';
  };

  return (
    <div className="app">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="app-toolbar">
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <button className="toolbar-btn" onClick={handleImportClick} title="Import a Guided Journey JSON file">
          ↑ Import JSON
        </button>
        <button className="toolbar-btn" onClick={handleExport} title="Export plan as Guided Journey JSON">
          ↓ Export JSON
        </button>
        {importError && (
          <span className="toolbar-error">{importError}</span>
        )}
      </div>

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
