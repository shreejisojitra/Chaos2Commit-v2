const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..', '..');
const projHtmlPath = path.join(rootDir, 'project.html');
const projEnhancedPath = path.join(rootDir, 'project-enhanced.html');
const frontendProjPath = path.join(rootDir, 'frontend', 'project.html');
const frontendProjEnhancedPath = path.join(rootDir, 'frontend', 'project-enhanced.html');

let content = fs.readFileSync(projHtmlPath, 'utf8');

// Copy project.html to frontend/project.html
fs.writeFileSync(frontendProjPath, content, 'utf8');

// Update for project-enhanced.html (replace dashboard.html with dashboard-enhanced.html)
let enhancedContent = content.split('href="dashboard.html"').join('href="dashboard-enhanced.html"');
fs.writeFileSync(projEnhancedPath, enhancedContent, 'utf8');
fs.writeFileSync(frontendProjEnhancedPath, enhancedContent, 'utf8');

console.log('Synchronized project and project-enhanced files successfully.');
