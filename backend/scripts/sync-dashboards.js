const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..', '..');
const dashHtmlPath = path.join(rootDir, 'dashboard.html');
const dashEnhancedPath = path.join(rootDir, 'dashboard-enhanced.html');
const frontendDashPath = path.join(rootDir, 'frontend', 'dashboard.html');
const frontendDashEnhancedPath = path.join(rootDir, 'frontend', 'dashboard-enhanced.html');

let content = fs.readFileSync(dashHtmlPath, 'utf8');

// Copy dashboard.html to frontend/dashboard.html
fs.writeFileSync(frontendDashPath, content, 'utf8');

// Create dashboard-enhanced.html
let enhancedContent = content
  .split('href="index.html"').join('href="index-enhanced.html"')
  .split('href="dashboard.html"').join('href="dashboard-enhanced.html"')
  .split('href="admin.html"').join('href="admin-enhanced.html"')
  .split('href="project.html?id=').join('href="project-enhanced.html?id=')
  .split("const PROJECT_PAGE = 'project.html';").join("const PROJECT_PAGE = 'project-enhanced.html';")
  .split("window.location.href = 'project.html?id='").join("window.location.href = 'project-enhanced.html?id='");

fs.writeFileSync(dashEnhancedPath, enhancedContent, 'utf8');
fs.writeFileSync(frontendDashEnhancedPath, enhancedContent, 'utf8');

console.log('Synchronized dashboard and dashboard-enhanced files successfully.');
