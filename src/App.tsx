import { useRef, useState } from 'react';
import type { Plan } from './types';
import { createDefaultPlan } from './data';
import { downloadPlanJSON, parsePlanJSON } from './utils/importExport';
import Navigation from './components/Navigation';
import SimulatorPage from './components/simulator/SimulatorPage';
import DesignPage from './components/design/DesignPage';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'design'>('design');
  const [plan, setPlan] = useState<Plan>(createDefaultPlan);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        setImportError(null);
      } catch (err) {
        setImportError(err instanceof Error ? err.message : 'Invalid JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="app">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onImport={handleImportClick}
        onExport={handleExport}
        importError={importError}
      />

      {activeTab === 'simulator' ? (
        <SimulatorPage plan={plan} />
      ) : (
        <DesignPage plan={plan} updatePlan={setPlan} />
      )}
    </div>
  );
}

export default App;
