import React, { useState } from 'react';
import ProjectSelector from './components/ProjectSelector';
import Dashboard from './components/Dashboard';

function App() {
  const [currentProject, setCurrentProject] = useState(() => {
    const saved = localStorage.getItem('selected_project');
    return saved ? JSON.parse(saved) : null;
  });

  const handleSelect = (project) => {
    setCurrentProject(project);
    localStorage.setItem('selected_project', JSON.stringify(project));
  };

  const handleLeave = () => {
    setCurrentProject(null);
    localStorage.removeItem('selected_project');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-zinc-900 font-sans antialiased">
      {currentProject ? (
        <Dashboard project={currentProject} onBack={handleLeave} />
      ) : (
        <ProjectSelector onSelectProject={handleSelect} />
      )}
    </div>
  );
}

export default App;