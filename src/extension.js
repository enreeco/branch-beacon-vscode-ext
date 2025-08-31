// @ts-check
const vscode = require('vscode');

function getGitApi() {
  const gitExt = vscode.extensions.getExtension('vscode.git');
  if (!gitExt) return undefined;
  if (gitExt.isActive) {
    return gitExt.exports.getAPI(1);
  }
  return gitExt.activate().then(() => gitExt.exports.getAPI(1));
}

function pickRepoForActiveEditor(api) {
  if (!api) return undefined;
  const active = vscode.window.activeTextEditor?.document?.uri;
  if (active) {
    const repo = api.getRepository(active);
    if (repo) return repo;
  }
  return api.repositories?.[0];
}

function getConfig() {
  const cfg = vscode.workspace.getConfiguration('branchHighlighter');
  const config = {
    showStatusBar: cfg.get('showStatusBar', true),
    updateTitleBarColors: cfg.get('updateTitleBarColors', true),
    rules: cfg.get('rules', []),
    defaultColors: cfg.get('defaultColors', { bg: '#444444', fg: '#ffffff' }),
    debug: cfg.get('debug', false)
  };
  return config;
}

function matchRule(branch, rules) {
  for (const r of rules) {
    try {
      const re = new RegExp(r.pattern);
      if (re.test(branch)) {
        return r;
      }
    } catch (error) {
      // ignore invalid regex
    }
  }
  return undefined;
}

async function applyWorkbenchColors(colors) {
  const config = vscode.workspace.getConfiguration('workbench');
  const existing = config.get('colorCustomizations') || {};
  const next = {
    ...existing,
    "statusBar.background": colors.statusBg,
    "statusBar.foreground": colors.statusFg,
    "statusBar.noFolderBackground": colors.statusBg,
    "statusBar.debuggingBackground": colors.statusBg,

    "titleBar.activeBackground": colors.titleBg,
    "titleBar.activeForeground": colors.titleFg,
    "titleBar.inactiveBackground": colors.titleBg,
    "titleBar.inactiveForeground": colors.titleFg
  };
  await config.update('colorCustomizations', next, vscode.ConfigurationTarget.Workspace);
}

async function restoreWorkbenchColors(previous) {
  const config = vscode.workspace.getConfiguration('workbench');
  await config.update('colorCustomizations', previous, vscode.ConfigurationTarget.Workspace);
}

/** @param {vscode.ExtensionContext} context */
async function activate(context) {
  const statusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 10000);
  statusItem.command = "branchHighlighter.copyBranch";

  let previousWorkbenchColors = vscode.workspace.getConfiguration('workbench').get('colorCustomizations');

  async function render() {
    const api = await getGitApi();
    const repo = pickRepoForActiveEditor(api);
    const { showStatusBar, updateTitleBarColors, rules, defaultColors, debug } = getConfig();

    const branch = repo?.state?.HEAD?.name;
    
    if (!branch) {
      statusItem.hide();
      if (updateTitleBarColors) await restoreWorkbenchColors(previousWorkbenchColors);
      return;
    }

    const rule = matchRule(branch, rules);

    const statusBg = (rule && (rule.statusBg || rule.bg)) || defaultColors.bg;
    const statusFg = (rule && (rule.statusFg || rule.fg)) || defaultColors.fg;
    const titleBg  = (rule && (rule.titleBarBg || rule.bg)) || defaultColors.bg;
    const titleFg  = (rule && (rule.titleBarFg || rule.fg)) || defaultColors.fg;

    if (showStatusBar) {
      statusItem.text = `$(lightbulb) ${branch}`;
      statusItem.tooltip = `Current Git branch - Click to copy`;
      statusItem.color = statusFg;
      statusItem.show();
    } else {
      statusItem.hide();
    }

    if (updateTitleBarColors) {
      await applyWorkbenchColors({
        statusBg,
        statusFg,
        titleBg,
        titleFg
      });
    }
  }

  // Commands
  context.subscriptions.push(
    vscode.commands.registerCommand('branchHighlighter.copyBranch', async () => {
      const api = await getGitApi();
      const repo = pickRepoForActiveEditor(api);
      const branch = repo?.state?.HEAD?.name;
      if (branch) {
        await vscode.env.clipboard.writeText(branch);
        vscode.window.showInformationMessage(`Copied branch: ${branch}`);
      } else {
        vscode.window.showWarningMessage('No Git branch detected.');
      }
    }),
    vscode.commands.registerCommand('branchHighlighter.refresh', render),
    vscode.commands.registerCommand('branchHighlighter.debug', async () => {
      const api = await getGitApi();
      const repo = pickRepoForActiveEditor(api);
      const config = getConfig();
      
      const debugInfo = {
        gitApi: api ? 'Available' : 'Not available',
        repository: repo ? repo.rootUri?.fsPath : 'None',
        branch: repo?.state?.HEAD?.name || 'None',
        headType: repo?.state?.HEAD?.type || 'None',
        headCommit: repo?.state?.HEAD?.commit || 'None',
        rules: config.rules,
        defaultColors: config.defaultColors,
        showStatusBar: config.showStatusBar,
        updateTitleBarColors: config.updateTitleBarColors
      };
      
      // Show in output channel
      const output = vscode.window.createOutputChannel('Branch Highlighter Debug');
      output.show();
      output.appendLine('Branch Highlighter Debug Information:');
      output.appendLine(JSON.stringify(debugInfo, null, 2));
      
      vscode.window.showInformationMessage('Debug info logged to output channel');
    }),
    vscode.commands.registerCommand('branchHighlighter.testRegex', async () => {
      const config = getConfig();
      const testBranches = ['main', 'master', 'release/v1.0', 'hotfix/bug-123', 'feature/new-feature', 'develop', 'other-branch'];
      
      const output = vscode.window.createOutputChannel('Branch Highlighter Regex Test');
      output.show();
      output.appendLine('Branch Highlighter Regex Test Results:');
      output.appendLine('=====================================');
      
      testBranches.forEach(branch => {
        output.appendLine(`\nTesting branch: "${branch}"`);
        const rule = matchRule(branch, config.rules);
        if (rule) {
          output.appendLine(`✓ MATCHED: Pattern "${rule.pattern}"`);
          output.appendLine(`  Colors: bg=${rule.bg}, fg=${rule.fg}`);
        } else {
          output.appendLine(`✗ NO MATCH: Using default colors`);
        }
      });
      
      vscode.window.showInformationMessage('Regex test completed - check output channel');
    }),
    statusItem
  );

  // React to repo/state changes
  const api = await getGitApi();
  if (api?.onDidOpenRepository) {
    api.onDidOpenRepository((r) => {
      context.subscriptions.push(r.state.onDidChange(render));
    });
  }
  
  // Also listen to repository changes directly for existing repos
  if (api?.repositories) {
    api.repositories.forEach(repo => {
      if (repo.state?.onDidChange) {
        context.subscriptions.push(repo.state.onDidChange(() => {
          render();
        }));
      }
    });
  }
  
  // Listen for when repositories are added
  if (api?.onDidOpenRepository) {
    api.onDidOpenRepository((repo) => {
      if (repo.state?.onDidChange) {
        context.subscriptions.push(repo.state.onDidChange(() => {
          render();
        }));
      }
    });
  }
  
  vscode.window.onDidChangeActiveTextEditor(render, null, context.subscriptions);
  vscode.workspace.onDidChangeConfiguration(e => {
    if (e.affectsConfiguration('branchHighlighter') || e.affectsConfiguration('workbench.colorCustomizations')) {
      render();
    }
  }, null, context.subscriptions);

  // Add a periodic refresh to catch branch changes that might be missed
  const refreshInterval = setInterval(() => {
    render();
  }, 3000); // Check every 3 seconds
  
  context.subscriptions.push({
    dispose: () => clearInterval(refreshInterval)
  });

  await render();
}

async function deactivate() {
  // keep workspace color customizations as-is intentionally
}

module.exports = {
  activate,
  deactivate
};
