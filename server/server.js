require('dotenv').config();
    const express = require('express');
    const cors = require('cors');
    const simpleGit = require('simple-git');
    const path = require('path');
    const fs = require('fs');
    const { exec } = require('child_process');
    const sqlite3 = require('sqlite3').verbose();
    const jwt = require('jsonwebtoken');
    const bcrypt = require('bcrypt');

    const app = express();
    const port = 3000;
    const secretKey = process.env.JWT_SECRET || 'your-secret-key'; // Use environment variable or default
    const logFilePath = path.join(__dirname, 'error.log');

    app.use(cors());
    app.use(express.json());

    // Database setup
    const db = new sqlite3.Database('./database.db', (err) => {
      if (err) {
        console.error('Database connection error:', err.message);
        logError(`Database connection error: ${err.message}`);
      } else {
        console.log('Connected to the database.');
        db.run(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
          )
        `);
        db.run(`
          CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            repoUrl TEXT NOT NULL,
            status TEXT DEFAULT 'idle',
            envVariables TEXT DEFAULT '{}'
          )
        `);
      }
    });

    const projectsDir = path.join(__dirname, 'projects');

    if (!fs.existsSync(projectsDir)) {
      fs.mkdirSync(projectsDir);
    }

    // Error logging function
    function logError(message) {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] ERROR: ${message}\n`;
      fs.appendFile(logFilePath, logMessage, (err) => {
        if (err) {
          console.error('Failed to write to log file:', err);
        }
      });
    }

    // Authentication middleware
    const authenticateToken = (req, res, next) => {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (token == null) return res.sendStatus(401);

      jwt.verify(token, secretKey, (err, user) => {
        if (err) {
          logError(`JWT verification failed: ${err.message}`);
          return res.sendStatus(403);
        }
        req.user = user;
        next();
      });
    };

    // User registration
    app.post('/register', async (req, res) => {
      const { username, password } = req.body;
      try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], function (err) {
          if (err) {
            logError(`User registration failed: ${err.message}`);
            return res.status(400).json({ error: err.message });
          }
          res.json({ success: true, message: 'User registered successfully' });
        });
      } catch (error) {
        logError(`User registration failed: ${error.message}`);
        res.status(500).json({ error: 'Failed to register user' });
      }
    });

    // User login
    app.post('/login', async (req, res) => {
      const { username, password } = req.body;

      db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
        if (err || !user) {
          logError(`Login failed: Invalid username or password`);
          return res.status(400).json({ error: 'Invalid username or password' });
        }

        try {
          const passwordMatch = await bcrypt.compare(password, user.password);
          if (!passwordMatch) {
            logError(`Login failed: Invalid username or password`);
            return res.status(400).json({ error: 'Invalid username or password' });
          }

          const token = jwt.sign({ userId: user.id, username: user.username }, secretKey, { expiresIn: '1h' });
          res.json({ success: true, token });
        } catch (error) {
          logError(`Login failed: ${error.message}`);
          res.status(500).json({ error: 'Login failed' });
        }
      });
    });

    // Install project
    app.post('/install', authenticateToken, async (req, res) => {
      const { repoUrl } = req.body;
      const projectName = repoUrl.split('/').pop().replace('.git', '');
      const projectPath = path.join(projectsDir, projectName);

      if (fs.existsSync(projectPath)) {
        return res.json({ success: false, error: 'Project already exists' });
      }

      try {
        await simpleGit().clone(repoUrl, projectPath);
        db.run('INSERT INTO projects (name, repoUrl) VALUES (?, ?)', [projectName, repoUrl], function (err) {
          if (err) {
            logError(`Project installation failed: ${err.message}`);
            return res.status(500).json({ success: false, error: err.message });
          }
          res.json({ success: true, projectName });
        });
      } catch (error) {
        logError(`Project installation failed: ${error.message}`);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Get projects
    app.get('/projects', authenticateToken, (req, res) => {
      db.all('SELECT * FROM projects', [], (err, rows) => {
        if (err) {
          logError(`Failed to fetch projects: ${err.message}`);
          return res.status(500).json({ error: 'Could not fetch projects' });
        }
        res.json({ projects: rows });
      });
    });

    // Get project settings
    app.get('/project/:projectName/settings', authenticateToken, (req, res) => {
      const { projectName } = req.params;
      db.get('SELECT envVariables FROM projects WHERE name = ?', [projectName], (err, row) => {
        if (err) {
          logError(`Failed to get project settings: ${err.message}`);
          return res.status(500).json({ error: 'Could not get project settings' });
        }
        if (!row) {
          return res.status(404).json({ error: 'Project not found' });
        }
        res.json({ settings: JSON.parse(row.envVariables) });
      });
    });

    // Update project settings
    app.post('/project/:projectName/settings', authenticateToken, (req, res) => {
      const { projectName } = req.params;
      const { envVariables } = req.body;
      try {
        const envVariablesString = JSON.stringify(envVariables);
        db.run('UPDATE projects SET envVariables = ? WHERE name = ?', [envVariablesString, projectName], function (err) {
          if (err) {
            logError(`Failed to update project settings: ${err.message}`);
            return res.status(500).json({ error: 'Could not update project settings' });
          }
          res.json({ success: true, message: 'Project settings updated successfully' });
        });
      } catch (error) {
        logError(`Failed to update project settings: ${error.message}`);
        res.status(500).json({ error: 'Failed to update project settings' });
      }
    });

    // Run project
    app.post('/run', authenticateToken, (req, res) => {
      const { projectName } = req.body;
      const projectPath = path.join(projectsDir, projectName);

      if (!fs.existsSync(projectPath)) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const packageJsonPath = path.join(projectPath, 'package.json');
      if (!fs.existsSync(packageJsonPath)) {
        return res.status(400).json({ error: 'package.json not found in project' });
      }

      const packageJson = require(packageJsonPath);
      const startScript = packageJson.scripts && (packageJson.scripts.start || packageJson.scripts.dev);

      if (!startScript) {
        return res.status(400).json({ error: 'No start or dev script found in package.json' });
      }

      db.get('SELECT envVariables FROM projects WHERE name = ?', [projectName], (err, row) => {
        if (err) {
          logError(`Failed to get project settings: ${err.message}`);
          return res.status(500).json({ error: 'Could not get project settings' });
        }
        const envVariables = row ? JSON.parse(row.envVariables) : {};
        const env = { ...process.env, ...envVariables };

        const command = `cd ${projectPath} && npm install && npm run ${startScript}`;

        db.run('UPDATE projects SET status = ? WHERE name = ?', ['running', projectName], (err) => {
          if (err) {
            logError(`Failed to update project status: ${err.message}`);
            return res.status(500).json({ error: 'Failed to update project status' });
          }
          const child = exec(command, { env }, (error, stdout, stderr) => {
            if (error) {
              logError(`Failed to run project: ${error.message}`);
              db.run('UPDATE projects SET status = ? WHERE name = ?', ['failed', projectName]);
              return res.status(500).json({ error: `Failed to run project: ${error.message}` });
            }
            console.log(`stdout: ${stdout}`);
            console.error(`stderr: ${stderr}`);
            db.run('UPDATE projects SET status = ? WHERE name = ?', ['running', projectName]);
            res.json({ success: true, message: 'Project started successfully' });
          });

          child.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
          });

          child.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
          });
        });
      });
    });

    // Stop project
    app.post('/stop', authenticateToken, (req, res) => {
      const { projectName } = req.body;
      db.run('UPDATE projects SET status = ? WHERE name = ?', ['stopped', projectName], (err) => {
        if (err) {
          logError(`Failed to stop project: ${err.message}`);
          return res.status(500).json({ error: 'Failed to stop project' });
        }
        res.json({ success: true, message: 'Project stopped successfully' });
      });
    });

    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
