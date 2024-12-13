
    const express = require('express');
    const cors = require('cors');
    const simpleGit = require('simple-git');
    const path = require('path');
    const fs = require('fs');

    const app = express();
    const port = 3000;

    app.use(cors());
    app.use(express.json());

    app.post('/install', async (req, res) => {
      const { repoUrl } = req.body;
      const projectName = repoUrl.split('/').pop().replace('.git', '');
      const projectPath = path.join(__dirname, 'projects', projectName);

      if (fs.existsSync(projectPath)) {
        return res.json({ success: false, error: 'Project already exists' });
      }

      try {
        await simpleGit().clone(repoUrl, projectPath);
        res.json({ success: true, projectName });
      } catch (error) {
