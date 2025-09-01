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

## Screenshots

### Title Bar Coloring
![Title Bar Coloring](assets/screenshots/title-bar-coloring.png)
*Title bar and status bar are recolored based on branch name patterns*

### Status Bar Badge
![Status Bar Badge](assets/screenshots/status-bar-badge.png)
*The current branch is prominently displayed in the status bar with custom colors*

### Different Branch Types
![Branch Types](assets/screenshots/branch-types.png)
*Different colors for main, feature, hotfix, and staging branches*

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
```

## Download links

- VSCode Market Place: [https://marketplace.visualstudio.com/items?itemName=ORGanizersolutions.branch-beacon]
- Open VSX Registry (e.g. for Cursor): [https://open-vsx.org/extension/ORGanizersolutions/branch-beacon]