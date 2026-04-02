import type { CommRule, CommRuleType, PlanConfig, UnlockStrategy } from '../../types';
import { dateToLocalISO, localISOToDate } from '../../utils/dateHelpers';
import '../../styles/plan-settings.css';

interface PlanSettingsPanelProps {
  config: PlanConfig;
  onUpdate: (updated: PlanConfig) => void;
  onClose: () => void;
}

const STRATEGY_LABELS: Record<UnlockStrategy, string> = {
  by_completion: 'By Completion — all preceding required milestones completed',
  by_unlock_at_time: 'By Time — milestone Unlock At time has passed',
  by_completion_and_unlock_at_time: 'By Both — completion AND Unlock At time (default)',
  by_completion_or_unlock_at_time: 'By Either — completion OR Unlock At time',
};

const COMM_TYPE_LABELS: Record<CommRuleType, string> = {
  start_of_plan: 'Start of plan',
  end_of_plan: 'End of plan',
  milestone_reminder: 'Milestone reminder',
  session_reminder: 'Session reminder',
  session_followup: 'Session follow-up',
};

const OFFSET_TYPES: CommRuleType[] = ['milestone_reminder', 'session_reminder', 'session_followup'];

function defaultOffset(type: CommRuleType): number | undefined {
  if (type === 'session_reminder') return -1440;
  if (type === 'session_followup') return 60;
  if (type === 'milestone_reminder') return 1440;
  return undefined;
}

export default function PlanSettingsPanel({ config, onUpdate, onClose }: PlanSettingsPanelProps) {
  const addRule = () => {
    const newRule: CommRule = {
      id: crypto.randomUUID(),
      name: 'New rule',
      triggerType: 'milestone_reminder',
      enabled: true,
      triggerOffsetMinutes: 1440,
      courierTemplateKey: '',
    };
    onUpdate({ ...config, commRules: [...config.commRules, newRule] });
  };

  const updateRule = (id: string, patch: Partial<CommRule>) => {
    onUpdate({
      ...config,
      commRules: config.commRules.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, ...patch };
        // When switching trigger type, set sensible default offset
        if (patch.triggerType && patch.triggerType !== r.triggerType) {
          updated.triggerOffsetMinutes = defaultOffset(patch.triggerType);
        }
        return updated;
      }),
    });
  };

  const deleteRule = (id: string) => {
    onUpdate({ ...config, commRules: config.commRules.filter((r) => r.id !== id) });
  };

  const needsOffset = (type: CommRuleType) => OFFSET_TYPES.includes(type);

  const formatOffsetHint = (minutes: number | undefined) => {
    if (minutes == null || minutes === 0) return 'at the moment';
    return minutes > 0
      ? `+${minutes / 60}h after`
      : `${Math.abs(minutes) / 60}h before`;
  };

  return (
    <>
      <div className="plan-settings-overlay" onClick={onClose} />
      <div className="plan-settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="plan-settings-header">
          <h2 className="plan-settings-title">Plan Settings</h2>
          <button className="plan-settings-close" onClick={onClose}>×</button>
        </div>

        <div className="plan-settings-body">
          {/* ── Dates ── */}
          <div className="ps-section">
            <p className="ps-section-title">Plan Dates</p>
            <div className="ps-field">
              <label className="ps-label">Plan start date</label>
              <input
                className="ps-datetime"
                type="datetime-local"
                value={config.startsAt ? dateToLocalISO(config.startsAt) : ''}
                onFocus={(e) => e.currentTarget.showPicker?.()}
                onChange={(e) =>
                  onUpdate({ ...config, startsAt: localISOToDate(e.target.value) })
                }
              />
            </div>
            <div className="ps-field">
              <label className="ps-label">Registration start date</label>
              <input
                className="ps-datetime"
                type="datetime-local"
                value={
                  config.registrationPeriod.opensAt
                    ? dateToLocalISO(config.registrationPeriod.opensAt)
                    : ''
                }
                onFocus={(e) => e.currentTarget.showPicker?.()}
                onChange={(e) =>
                  onUpdate({
                    ...config,
                    registrationPeriod: {
                      ...config.registrationPeriod,
                      opensAt: localISOToDate(e.target.value),
                    },
                  })
                }
              />
            </div>
            <div className="ps-field">
              <label className="ps-label">Registration end date</label>
              <input
                className="ps-datetime"
                type="datetime-local"
                value={
                  config.registrationPeriod.closesAt
                    ? dateToLocalISO(config.registrationPeriod.closesAt)
                    : ''
                }
                onFocus={(e) => e.currentTarget.showPicker?.()}
                onChange={(e) =>
                  onUpdate({
                    ...config,
                    registrationPeriod: {
                      ...config.registrationPeriod,
                      closesAt: localISOToDate(e.target.value),
                    },
                  })
                }
              />
            </div>
          </div>

          <div className="ps-divider" />

          {/* ── Unlock Strategy ── */}
          <div className="ps-section">
            <p className="ps-section-title">Milestone Unlocking Strategy</p>
            <div className="ps-field">
              <select
                className="ps-select"
                value={config.unlockStrategy}
                onChange={(e) =>
                  onUpdate({ ...config, unlockStrategy: e.target.value as UnlockStrategy })
                }
              >
                {(Object.keys(STRATEGY_LABELS) as UnlockStrategy[]).map((key) => (
                  <option key={key} value={key}>
                    {STRATEGY_LABELS[key]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="ps-divider" />

          {/* ── Communication Rules ── */}
          <div className="ps-section">
            <p className="ps-section-title">Communication Rules</p>

            {config.commRules.map((rule) => (
              <div key={rule.id} className="ps-comm-rule">
                <div className="ps-comm-rule-header">
                  <select
                    className="ps-comm-rule-type"
                    value={rule.triggerType}
                    onChange={(e) =>
                      updateRule(rule.id, { triggerType: e.target.value as CommRuleType })
                    }
                  >
                    {(Object.keys(COMM_TYPE_LABELS) as CommRuleType[]).map((type) => (
                      <option key={type} value={type}>
                        {COMM_TYPE_LABELS[type]}
                      </option>
                    ))}
                  </select>
                  <button
                    className="ps-comm-rule-delete"
                    onClick={() => deleteRule(rule.id)}
                    title="Remove rule"
                  >
                    ×
                  </button>
                </div>

                <div className="ps-comm-rule-fields">
                  {needsOffset(rule.triggerType) && (
                    <div className="ps-comm-rule-row">
                      <label>Offset (min)</label>
                      <input
                        type="number"
                        value={rule.triggerOffsetMinutes ?? 0}
                        onChange={(e) =>
                          updateRule(rule.id, { triggerOffsetMinutes: Number(e.target.value) })
                        }
                      />
                      <span className="ps-offset-hint">
                        {formatOffsetHint(rule.triggerOffsetMinutes)}
                      </span>
                    </div>
                  )}
                  <div className="ps-comm-rule-row">
                    <label>Template key</label>
                    <input
                      type="text"
                      placeholder="courier-template-key"
                      value={rule.courierTemplateKey ?? ''}
                      onChange={(e) =>
                        updateRule(rule.id, { courierTemplateKey: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
            ))}

            <button className="ps-add-rule-btn" onClick={addRule}>
              + Add communication rule
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
