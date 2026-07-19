import { useObservable } from '../hooks/useObservable';
import { selectedModuleSubject, selectModule } from '../store/streams';
import { MODULES } from '../config/modules';

export default function ModuleSidebar() {
  const [selected] = useObservable(selectedModuleSubject, 'crowd_density');

  return (
    <nav className="module-sidebar" aria-label="AI Module selector" role="navigation">
      {MODULES.map((mod, idx) => (
        <button
          key={mod.id}
          id={`module-btn-${mod.id}`}
          className={`sidebar-btn ${selected === mod.id ? 'active' : ''}`}
          onClick={() => selectModule(mod.id)}
          title={mod.label}
          aria-label={mod.label}
          aria-pressed={selected === mod.id}
        >
          <span className="sidebar-btn-icon" aria-hidden="true">{mod.icon}</span>
          <span className="sidebar-btn-label">{mod.short}</span>
        </button>
      ))}
    </nav>
  );
}
