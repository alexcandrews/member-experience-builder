import type { SimulatedEvent, SimEventType } from '../../utils/simulatorEngine';
import { formatDateTime } from '../../utils/dateHelpers';
import '../../styles/simulator.css';

const EVENT_ICONS: Record<SimEventType, string> = {
  plan_enrollment: '🚀',
  milestone_unlock: '🔓',
  comm_start_of_plan: '📧',
  comm_end_of_plan: '🏁',
  comm_milestone_reminder: '🔔',
  comm_session_reminder: '⏰',
  comm_session_followup: '📋',
};

const EVENT_CHIP_CLASS: Record<SimEventType, string> = {
  plan_enrollment: 'chip-enrollment',
  milestone_unlock: 'chip-unlock',
  comm_start_of_plan: 'chip-comm',
  comm_end_of_plan: 'chip-comm',
  comm_milestone_reminder: 'chip-reminder',
  comm_session_reminder: 'chip-reminder',
  comm_session_followup: 'chip-followup',
};

const EVENT_CHIP_LABELS: Record<SimEventType, string> = {
  plan_enrollment: 'Started',
  milestone_unlock: 'Unlocked',
  comm_start_of_plan: 'Comm',
  comm_end_of_plan: 'Comm',
  comm_milestone_reminder: 'Reminder',
  comm_session_reminder: 'Reminder',
  comm_session_followup: 'Follow-up',
};

interface EventTimelineProps {
  events: SimulatedEvent[];
}

export default function EventTimeline({ events }: EventTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="timeline-empty">
        <div className="timeline-empty-icon">📅</div>
        <p>No events yet — advance the date to see your plan unfold</p>
      </div>
    );
  }

  return (
    <div className="event-timeline">
      {events.map((event) => (
        <div key={event.id} className="timeline-event">
          <span className="timeline-event-icon">{EVENT_ICONS[event.type]}</span>
          <div className="timeline-event-content">
            <p className="timeline-event-label">{event.label}</p>
            <p className="timeline-event-date">{formatDateTime(event.date)}</p>
          </div>
          <span className={`timeline-event-chip ${EVENT_CHIP_CLASS[event.type]}`}>
            {EVENT_CHIP_LABELS[event.type]}
          </span>
        </div>
      ))}
    </div>
  );
}
