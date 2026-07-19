export const MODULES = [
  {
    id: 'crowd_density',
    label: 'Crowd Density Analyst',
    short: 'Crowd',
    icon: '👥',
    description: 'Monitor gate & zone crowding levels',
    color: '#3b82f6',
  },
  {
    id: 'incident_response',
    label: 'Incident Response Co-Pilot',
    short: 'Incident',
    icon: '🚨',
    description: 'Handle medical, security & safety incidents',
    color: '#ef4444',
  },
  {
    id: 'resource_optimizer',
    label: 'Resource Optimizer',
    short: 'Resource',
    icon: '⚡',
    description: 'Optimal allocation of staff & facilities',
    color: '#f59e0b',
  },
  {
    id: 'what_if',
    label: 'What-If Simulator',
    short: 'Sim',
    icon: '🔮',
    description: 'Predict outcomes of hypothetical actions',
    color: '#a855f7',
  },
  {
    id: 'communicator',
    label: 'Multi-Stakeholder Communicator',
    short: 'Comms',
    icon: '📡',
    description: 'Generate audience-tailored messages',
    color: '#22c55e',
  },
  {
    id: 'debrief',
    label: 'Post-Event Debrief Generator',
    short: 'Debrief',
    icon: '📋',
    description: 'After-action review from operational history',
    color: '#c8a84b',
  },
];

export const getModule = (id) => MODULES.find((m) => m.id === id);
