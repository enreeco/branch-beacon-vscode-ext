# Branch Beacon (JavaScript)

**Make your current Git branch impossible to miss.**  
Shows a big status bar badge and (optionally) recolors your **title bar** and **status bar** based on branch name using **regex rules**.

## Features
- Status bar badge with the current branch
- Regex-driven color rules (first match wins)
- Optional title/status bar recoloring via `workbench.colorCustomizations`
- Commands:
  - **Branch Beacon: Copy Current Branch**
  - **Branch Beacon: Refresh**

## Settings

```jsonc
"branchHighlighter.showStatusBar": true,
"branchHighlighter.updateTitleBarColors": true,
"branchHighlighter.rules": [
  { "pattern": "^(main|master|prod)$", "bg": "#1d9f61", "fg": "#ffffff" },
  { "pattern": "^stage|preprod|release(\\/.*)?$", "bg": "#ff9800", "fg": "#000000" },
  { "pattern": "^hotfix|bugfix(\\/.*)?$", "bg": "#e53935", "fg": "#ffffff" },
  { "pattern": "^feature(\\/.*)?$", "bg": "#3f51b5", "fg": "#ffffff" }
],
"branchHighlighter.defaultColors": { "bg": "#444444", "fg": "#ffffff" }
