interface NavigationProps {
  activeTab: 'builder' | 'simulator' | 'design';
  onTabChange: (tab: 'builder' | 'simulator' | 'design') => void;
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
        <button
          className={`nav-tab${activeTab === 'design' ? ' active' : ''}`}
          onClick={() => onTabChange('design')}
        >
          Design
        </button>
      </div>
    </nav>
  );
}
