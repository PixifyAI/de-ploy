import React, { useState } from 'react';

    function App() {
      const [repoUrl, setRepoUrl] = useState('');
      const [status, setStatus] = useState('');
      const [projects, setProjects] = useState([]);

      const handleInstall = async () => {
        setStatus('Installing...');
        try {
          const response = await fetch('http://localhost:3000/install', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ repoUrl }),
          });
          const data = await response.json();
          if (data.success) {
            setStatus('Installed successfully!');
            setProjects([...projects, data.projectName]);
          } else {
            setStatus('Installation failed: ' + data.error);
          }
        } catch (error) {
          setStatus('Installation failed: ' + error.message);
        }
      };

      return (
        <div className="app-container">
          <h1>Vercel-like App</h1>
          <div className="input-container">
            <input
              type="text"
              placeholder="Enter Git Repository URL"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
            />
            <button onClick={handleInstall}>Install</button>
          </div>
          {status && <p className="status">{status}</p>}
          <div className="projects-container">
            <h2>Installed Projects</h2>
            <ul>
              {projects.map((project, index) => (
                <li key={index}>{project}</li>
              ))}
            </ul>
          </div>
        </div>
      );
    }

    export default App;
