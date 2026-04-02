interface NavigationProps {
  activeTab: 'simulator' | 'design';
  onTabChange: (tab: 'simulator' | 'design') => void;
  onImport: () => void;
  onExport: () => void;
  importError?: string | null;
}

export default function Navigation({ activeTab, onTabChange, onImport, onExport, importError }: NavigationProps) {
  return (
    <nav className="app-nav">
      <div className="nav-tabs">
        <button
          className={`nav-tab${activeTab === 'design' ? ' active' : ''}`}
          onClick={() => onTabChange('design')}
        >
          Design
        </button>
        <button
          className={`nav-tab${activeTab === 'simulator' ? ' active' : ''}`}
          onClick={() => onTabChange('simulator')}
        >
          Simulator
        </button>
      </div>
      <div className="nav-actions">
        <button className="toolbar-btn" onClick={onImport} title="Import a Guided Journey JSON file">
          ↑ Import JSON
        </button>
        <button className="toolbar-btn" onClick={onExport} title="Export plan as Guided Journey JSON">
          ↓ Export JSON
        </button>
        {importError && (
          <span className="toolbar-error">{importError}</span>
        )}
      </div>
    </nav>
  );
}
