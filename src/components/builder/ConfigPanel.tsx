import type { CommRule, CommRuleType, PlanConfig } from '../../types';
import { dateToLocalISO, localISOToDate } from '../../utils/dateHelpers';
import '../../styles/config.css';

interface ConfigPanelProps {
  config: PlanConfig;
  onUpdate: (updated: PlanConfig) => void;
  onClose: () => void;
}

const STRATEGY_LABELS: Record<PlanConfig['unlockStrategy'], string> = {
  by_completion: 'By Completion — all preceding required milestones completed',
  by_time: 'By Time — milestone Unlock At time has passed',
  by_both: 'By Both — completion AND Unlock At time (default)',
  by_either: 'By Either — completion OR Unlock At time',
};

const COMM_RULE_LABELS: Record<CommRuleType, string> = {
  start_of_plan: 'Start of plan',
  end_of_plan: 'End of plan',
  milestone_reminder: 'Milestone reminder',
  session_reminder: 'Session reminder',
  session_followup: 'Session follow-up',
};

const COMM_RULE_HINTS: Record<CommRuleType, string> = {
  start_of_plan: 'Sent when a member enrolls into the plan',
  end_of_plan: 'Sent when a member completes the plan',
  milestone_reminder: 'Sent X minutes after milestone unlocks (e.g. 1440 = 24h after)',
  session_reminder: 'Sent X minutes before session (e.g. −1440 = 24h before)',
  session_followup: 'Sent X minutes after session ends (e.g. 60 = 1h after)',
};

const OFFSET_TYPES: CommRuleType[] = ['milestone_reminder', 'session_reminder', 'session_followup'];
const TOGGLE_TYPES: CommRuleType[] = ['start_of_plan', 'end_of_plan'];

export default function ConfigPanel({ config, onUpdate, onClose }: ConfigPanelProps) {
  const hasRule = (type: CommRuleType) => config.commRules.some((r) => r.type === type);

  const toggleRule = (type: CommRuleType) => {
    if (hasRule(type)) {
      onUpdate({ ...config, commRules: config.commRules.filter((r) => r.type !== type) });
    } else {
      const newRule: CommRule = { id: crypto.randomUUID(), type };
      onUpdate({ ...config, commRules: [...config.commRules, newRule] });
    }
  };

  const addOffsetRule = (type: CommRuleType) => {
    const defaultOffset =
      type === 'session_reminder' ? -1440 : type === 'session_followup' ? 60 : 1440;
    const newRule: CommRule = { id: crypto.randomUUID(), type, minuteOffset: defaultOffset };
    onUpdate({ ...config, commRules: [...config.commRules, newRule] });
  };

  const updateRuleOffset = (id: string, minuteOffset: number) => {
    onUpdate({
      ...config,
      commRules: config.commRules.map((r) => (r.id === id ? { ...r, minuteOffset } : r)),
    });
  };

  const deleteRule = (id: string) => {
    onUpdate({ ...config, commRules: config.commRules.filter((r) => r.id !== id) });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">⚙ Plan Configuration</h2>
          <button className="modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {/* Unlock Strategy */}
          <div className="config-section">
            <p className="config-section-title">Milestone Unlock Strategy</p>
            <div className="config-field">
              <label className="config-label">Unlock milestones</label>
              <select
                className="config-select"
                value={config.unlockStrategy}
                onChange={(e) =>
                  onUpdate({
                    ...config,
                    unlockStrategy: e.target.value as PlanConfig['unlockStrategy'],
                  })
                }
              >
                {(Object.keys(STRATEGY_LABELS) as PlanConfig['unlockStrategy'][]).map((key) => (
                  <option key={key} value={key}>
                    {STRATEGY_LABELS[key]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="config-divider" />

          {/* Dates */}
          <div className="config-section">
            <p className="config-section-title">Plan Dates</p>
            <div className="config-field">
              <label className="config-label">Plan start date</label>
              <input
                className="config-datetime"
                type="datetime-local"
                value={config.startDate ? dateToLocalISO(config.startDate) : ''}
                onChange={(e) =>
                  onUpdate({ ...config, startDate: localISOToDate(e.target.value) })
                }
              />
            </div>
            <div className="config-field">
              <label className="config-label">Registration opens</label>
              <input
                className="config-datetime"
                type="datetime-local"
                value={
                  config.registrationStartDate ? dateToLocalISO(config.registrationStartDate) : ''
                }
                onChange={(e) =>
                  onUpdate({
                    ...config,
                    registrationStartDate: localISOToDate(e.target.value),
                  })
                }
              />
            </div>
            <div className="config-field">
              <label className="config-label">Registration closes</label>
              <input
                className="config-datetime"
                type="datetime-local"
                value={
                  config.registrationEndDate ? dateToLocalISO(config.registrationEndDate) : ''
                }
                onChange={(e) =>
                  onUpdate({
                    ...config,
                    registrationEndDate: localISOToDate(e.target.value),
                  })
                }
              />
            </div>
          </div>

          <div className="config-divider" />

          {/* Comm Rules */}
          <div className="config-section">
            <p className="config-section-title">Communication Rules</p>

            {/* Toggle-type rules */}
            {TOGGLE_TYPES.map((type) => (
              <div key={type} className="comm-rule-group">
                <div className="comm-toggle-row">
                  <input
                    type="checkbox"
                    id={`toggle-${type}`}
                    checked={hasRule(type)}
                    onChange={() => toggleRule(type)}
                  />
                  <label htmlFor={`toggle-${type}`}>
                    <strong>{COMM_RULE_LABELS[type]}</strong> — {COMM_RULE_HINTS[type]}
                  </label>
                </div>
              </div>
            ))}

            {/* Offset-type rules */}
            {OFFSET_TYPES.map((type) => {
              const rules = config.commRules.filter((r) => r.type === type);
              return (
                <div key={type} className="comm-rule-group">
                  <div className="comm-rule-group-label">
                    <strong>{COMM_RULE_LABELS[type]}</strong>
                  </div>
                  <p
                    style={{ fontSize: 12, color: '#999', margin: '0 0 6px' }}
                  >
                    {COMM_RULE_HINTS[type]}
                  </p>
                  {rules.map((rule) => (
                    <div key={rule.id} className="comm-rule-item">
                      <label>Offset (minutes)</label>
                      <input
                        className="comm-offset-input"
                        type="number"
                        value={rule.minuteOffset ?? 0}
                        onChange={(e) => updateRuleOffset(rule.id, Number(e.target.value))}
                      />
                      <span className="comm-offset-hint">
                        {rule.minuteOffset != null && rule.minuteOffset !== 0
                          ? rule.minuteOffset > 0
                            ? `+${rule.minuteOffset / 60}h after`
                            : `${Math.abs(rule.minuteOffset) / 60}h before`
                          : 'at the moment'}
                      </span>
                      <button className="comm-rule-delete" onClick={() => deleteRule(rule.id)}>
                        ×
                      </button>
                    </div>
                  ))}
                  <button className="add-comm-rule-btn" onClick={() => addOffsetRule(type)}>
                    + Add {COMM_RULE_LABELS[type].toLowerCase()} rule
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
