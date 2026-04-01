import { useState } from 'react';
import type { Plan } from '../../types';
import { computeEvents } from '../../utils/simulatorEngine';
import DateControl from './DateControl';
import EventTimeline from './EventTimeline';
import '../../styles/simulator.css';

interface SimulatorPageProps {
  plan: Plan;
}

export default function SimulatorPage({ plan }: SimulatorPageProps) {
  const [simulatedDate, setSimulatedDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 0);
    return d;
  });

  const events = computeEvents(plan, simulatedDate);

  return (
    <div className="simulator-page">
      <div className="simulator-intro">
        <h2>Plan Simulator</h2>
        <p>Advance the date to preview how your plan unfolds for members</p>
      </div>

      {!plan.config.startDate && (
        <div className="simulator-warning">
          ⚠ No plan start date set. Open <strong>Configure</strong> in the Builder to set one.
        </div>
      )}

      <DateControl date={simulatedDate} onChange={setSimulatedDate} />

      <EventTimeline events={events} />
    </div>
  );
}
