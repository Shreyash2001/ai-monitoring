import { useEffect } from 'react';
import { useObservable } from './hooks/useObservable';
import { selectedModuleSubject, startSensorPolling } from './store/streams';

import TopBar        from './components/TopBar';
import SensorPanel   from './components/SensorPanel';
import CCTVPlayer    from './components/CCTVPlayer';
import ModuleSidebar from './components/ModuleSidebar';

// Lazy-load modules (still renders immediately; React bundles each separately)
import CrowdDensity      from './modules/CrowdDensity';
import IncidentResponse  from './modules/IncidentResponse';
import ResourceOptimizer from './modules/ResourceOptimizer';
import WhatIfSimulator   from './modules/WhatIfSimulator';
import Communicator      from './modules/Communicator';
import PostEventDebrief  from './modules/PostEventDebrief';

function ActiveModule({ moduleId }) {
  switch (moduleId) {
    case 'crowd_density':      return <CrowdDensity />;
    case 'incident_response':  return <IncidentResponse />;
    case 'resource_optimizer': return <ResourceOptimizer />;
    case 'what_if':            return <WhatIfSimulator />;
    case 'communicator':       return <Communicator />;
    case 'debrief':            return <PostEventDebrief />;
    default:                   return <CrowdDensity />;
  }
}

export default function App() {
  const [selectedModule] = useObservable(selectedModuleSubject, 'crowd_density');

  // Start polling sensor.json every 2 s on mount; stop on unmount
  useEffect(() => {
    const subscription = startSensorPolling();
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="app-layout">
      <TopBar />

      <div className="app-body">
        <ModuleSidebar />

        <div className="app-main">
          {/* Left panel: CCTV feed + sensor strip */}
          <div className="left-panel">
            <CCTVPlayer />
            <SensorPanel />
          </div>

          {/* Right panel: active AI module */}
          <div className="right-panel">
            <ActiveModule moduleId={selectedModule} />
          </div>
        </div>
      </div>
    </div>
  );
}
