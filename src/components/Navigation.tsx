interface NavigationProps {
  activeTab: 'builder' | 'simulator';
  onTabChange: (tab: 'builder' | 'simulator') => void;
}

export default function Navigation({ activeTab, onTabChange }: NavigationProps) {
  return (
    <nav className="app-nav">
      <div className="nav-brand">
        <span className="nav-brand-icon">✦</span>
        Journey Builder
      </div>
      <div className="nav-tabs">
        <button
          className={`nav-tab${activeTab === 'builder' ? ' active' : ''}`}
          onClick={() => onTabChange('builder')}
        >
          Builder
        </button>
        <button
          className={`nav-tab${activeTab === 'simulator' ? ' active' : ''}`}
          onClick={() => onTabChange('simulator')}
        >
          Simulator
        </button>
      </div>
    </nav>
  );
}
