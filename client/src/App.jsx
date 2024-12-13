import React, { useState, useEffect } from 'react';
    import axios from 'axios';

    const api = axios.create({
      baseURL: 'http://localhost:3000',
    });

    function App() {
      const [repoUrl, setRepoUrl] = useState('');
      const [status, setStatus] = useState('');
      const [projects, setProjects] = useState([]);
      const [username, setUsername] = useState('');
      const [password, setPassword] = useState('');
      const [token, setToken] = useState(localStorage.getItem('token') || null);
      const [isLoggedIn, setIsLoggedIn] = useState(!!token);
      const [showRegister, setShowRegister] = useState(false);
      const [selectedProject, setSelectedProject] = useState(null);
      const [envVariables, setEnvVariables] = useState({});
      const [newEnvKey, setNewEnvKey] = useState('');
      const [newEnvValue, setNewEnvValue] = useState('');

      useEffect(() => {
        if (token) {
          fetchProjects();
        }
      }, [token]);

      useEffect(() => {
        if (selectedProject) {
          fetchProjectSettings();
        }
      }, [selectedProject]);

      const fetchProjects = async () => {
        try {
          const response = await api.get('/projects', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.data.projects) {
            setProjects(response.data.projects);
          }
        } catch (error) {
          console.error('Failed to fetch projects:', error);
          setStatus(`Failed to fetch projects: ${error.message}`);
        }
      };

      const fetchProjectSettings = async () => {
        try {
          const response = await api.get(`/project/${selectedProject}/settings`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.data.settings) {
            setEnvVariables(response.data.settings);
          }
        } catch (error) {
          console.error('Failed to fetch project settings:', error);
          setStatus(`Failed to fetch project settings: ${error.message}`);
        }
      };

      const handleInstall = async () => {
        setStatus('Installing...');
        try {
          const response = await api.post(
            '/install',
            { repoUrl },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (response.data.success) {
            setStatus('Installed successfully!');
            fetchProjects();
          } else {
            setStatus('Installation failed: ' + response.data.error);
          }
        } catch (error) {
          console.error('Installation failed:', error);
          setStatus('Installation failed: ' + error.message);
        }
      };

      const handleRun = async (projectName) => {
        setStatus(`Running ${projectName}...`);
        try {
          const response = await api.post(
            '/run',
            { projectName },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (response.data.success) {
            setStatus(`${projectName} started successfully!`);
            fetchProjects();
          } else {
            setStatus(`Failed to run ${projectName}: ` + response.data.error);
          }
        } catch (error) {
          console.error('Failed to run project:', error);
          setStatus(`Failed to run ${projectName}: ` + error.message);
        }
      };

      const handleStop = async (projectName) => {
        setStatus(`Stopping ${projectName}...`);
        try {
          const response = await api.post(
            '/stop',
            { projectName },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (response.data.success) {
            setStatus(`${projectName} stopped successfully!`);
            fetchProjects();
          } else {
            setStatus(`Failed to stop ${projectName}: ` + response.data.error);
          }
        } catch (error) {
          console.error('Failed to stop project:', error);
          setStatus(`Failed to stop ${projectName}: ` + error.message);
        }
      };

      const handleLogin = async () => {
        try {
          const response = await api.post('/login', { username, password });
          if (response.data.success) {
            setToken(response.data.token);
            localStorage.setItem('token', response.data.token);
            setIsLoggedIn(true);
          } else {
            setStatus('Login failed: ' + response.data.error);
          }
        } catch (error) {
          console.error('Login failed:', error);
          setStatus('Login failed: ' + error.message);
        }
      };

      const handleRegister = async () => {
        try {
          const response = await api.post('/register', { username, password });
          if (response.data.success) {
            setStatus('Registration successful, please log in.');
            setShowRegister(false);
          } else {
            setStatus('Registration failed: ' + response.data.error);
          }
        } catch (error) {
          console.error('Registration failed:', error);
          setStatus('Registration failed: ' + error.message);
        }
      };

      const handleLogout = () => {
        setToken(null);
        localStorage.removeItem('token');
        setIsLoggedIn(false);
      };

      const handleProjectSelect = (projectName) => {
        setSelectedProject(projectName);
      };

      const handleAddEnvVariable = () => {
        if (newEnvKey && newEnvValue) {
          setEnvVariables({ ...envVariables, [newEnvKey]: newEnvValue });
          setNewEnvKey('');
          setNewEnvValue('');
        }
      };

      const handleRemoveEnvVariable = (key) => {
        const { [key]: removed, ...rest } = envVariables;
        setEnvVariables(rest);
      };

      const handleSaveSettings = async () => {
        setStatus('Saving settings...');
        try {
          const response = await api.post(
            `/project/${selectedProject}/settings`,
            { envVariables },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (response.data.success) {
            setStatus('Settings saved successfully!');
          } else {
            setStatus('Failed to save settings: ' + response.data.error);
          }
        } catch (error) {
          console.error('Failed to save settings:', error);
          setStatus('Failed to save settings: ' + error.message);
        }
      };

      if (!isLoggedIn) {
        return (
          <div className="auth-container">
            <h2>{showRegister ? 'Register' : 'Login'}</h2>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {showRegister ? (
              <button onClick={handleRegister}>Register</button>
            ) : (
              <button onClick={handleLogin}>Login</button>
            )}
            <button onClick={() => setShowRegister(!showRegister)}>
              {showRegister ? 'Go to Login' : 'Go to Register'}
            </button>
            {status && <p className="status">{status}</p>}
          </div>
        );
      }

      return (
        <div className="app-container">
          <h1>Vercel-like App</h1>
          <button onClick={handleLogout}>Logout</button>
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
              {projects.map((project) => (
                <li key={project.id}>
                  <span
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleProjectSelect(project.name)}
                  >
                    {project.name} - Status: {project.status}
                  </span>
                  <div className="project-buttons">
                    <button onClick={() => handleRun(project.name)} disabled={project.status === 'running'}>
                      Run
                    </button>
                    <button onClick={() => handleStop(project.name)} disabled={project.status === 'stopped' || project.status === 'idle'}>
                      Stop
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          {selectedProject && (
            <div className="settings-container">
              <h2>Project Settings for {selectedProject}</h2>
              <div className="env-variables">
                <h3>Environment Variables</h3>
                <ul>
                  {Object.entries(envVariables).map(([key, value]) => (
                    <li key={key}>
                      {key}: {value}
                      <button onClick={() => handleRemoveEnvVariable(key)}>Remove</button>
                    </li>
                  ))}
                </ul>
                <div className="add-env-variable">
                  <input
                    type="text"
                    placeholder="Key"
                    value={newEnvKey}
                    onChange={(e) => setNewEnvKey(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Value"
                    value={newEnvValue}
                    onChange={(e) => setNewEnvValue(e.target.value)}
                  />
                  <button onClick={handleAddEnvVariable}>Add</button>
                </div>
              </div>
              <button onClick={handleSaveSettings}>Save Settings</button>
            </div>
          )}
        </div>
      );
    }

    export default App;
