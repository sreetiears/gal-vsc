import * as vscode from "vscode";
import { PetEventType } from "../domain/types";

export type ApplyHandler = (event: PetEventType) => void;

export function registerEventWatchers(
  apply: ApplyHandler,
): vscode.Disposable[] {
  const disposables: vscode.Disposable[] = [];

  disposables.push(
    vscode.workspace.onDidSaveTextDocument(() => apply("save")),
  );

  let typingTimer: NodeJS.Timeout | undefined;
  disposables.push(
    vscode.workspace.onDidChangeTextDocument(() => {
      if (typingTimer) {
        return;
      }
      typingTimer = setTimeout(() => {
        typingTimer = undefined;
        apply("typing");
      }, 1200);
    }),
  );

  let lastErrorCount = countErrors();
  disposables.push(
    vscode.languages.onDidChangeDiagnostics(() => {
      const next = countErrors();
      if (next < lastErrorCount) {
        apply("diagImprove");
      } else if (next > lastErrorCount) {
        apply("diagWorsen");
      }
      lastErrorCount = next;
    }),
  );

  disposables.push(
    vscode.tasks.onDidEndTaskProcess((e) => {
      if (e.exitCode === 0) {
        apply("taskSuccess");
      } else if (e.exitCode !== undefined) {
        apply("taskFail");
      }
    }),
  );

  disposables.push(
    vscode.window.onDidCloseTerminal((terminal) => {
      const code = terminal.exitStatus?.code;
      if (code === undefined) {
        return;
      }
      if (code === 0) {
        apply("taskSuccess");
      } else {
        apply("taskFail");
      }
    }),
  );

  const gitDisposable = tryWatchGit(apply);
  if (gitDisposable) {
    disposables.push(gitDisposable);
  }

  const idleTimer = setInterval(() => apply("idleTick"), 60_000);
  disposables.push({ dispose: () => clearInterval(idleTimer) });

  return disposables;
}

function countErrors(): number {
  return vscode.languages
    .getDiagnostics()
    .reduce((sum, [, diags]) => sum + diags.filter((d) => d.severity === vscode.DiagnosticSeverity.Error).length, 0);
}

function tryWatchGit(apply: ApplyHandler): vscode.Disposable | undefined {
  try {
    const gitExt = vscode.extensions.getExtension("vscode.git");
    if (!gitExt) {
      return undefined;
    }
    const api = gitExt.isActive ? gitExt.exports.getAPI(1) : undefined;
    if (!api) {
      void gitExt.activate().then(() => {
        const activated = gitExt.exports.getAPI(1);
        wireGit(activated, apply);
      });
      return { dispose: () => undefined };
    }
    return wireGit(api, apply);
  } catch {
    return undefined;
  }
}

function wireGit(api: { repositories: Array<{ onDidCommit?: vscode.Event<void> }> }, apply: ApplyHandler): vscode.Disposable {
  const subs: vscode.Disposable[] = [];
  for (const repo of api.repositories) {
    if (typeof repo.onDidCommit === "function") {
      subs.push(repo.onDidCommit(() => apply("gitCommit")));
    }
  }
  return vscode.Disposable.from(...subs);
}
