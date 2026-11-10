import * as vscode from "vscode";
import { AffectionEngine } from "./domain/AffectionEngine";
import { PetEventType } from "./domain/types";
import { registerEventWatchers } from "./host/EventWatchers";
import { PetViewProvider } from "./host/PetViewProvider";
import {
  installCursorHooks,
  watchAgentSignal,
} from "./host/cursorHooks";
import {
  loadPetState,
  resetPetState,
  savePetState,
} from "./host/stateStore";

let engine: AffectionEngine;
let statusItem: vscode.StatusBarItem;
let provider: PetViewProvider;

export function activate(context: vscode.ExtensionContext): void {
  engine = new AffectionEngine(loadPetState(context));
  provider = new PetViewProvider(context.extensionUri);

  statusItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100,
  );
  statusItem.command = "galVsc.showPet";
  statusItem.show();
  refreshUi();

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      PetViewProvider.viewType,
      provider,
    ),
    statusItem,
    vscode.commands.registerCommand("galVsc.showPet", async () => {
      await vscode.commands.executeCommand("galVsc.petView.focus");
      refreshUi();
    }),
    vscode.commands.registerCommand("galVsc.resetState", async () => {
      const state = await resetPetState(context);
      engine.loadState(state);
      refreshUi();
      vscode.window.showInformationMessage("大肥鱼存档已重置");
    }),
    vscode.commands.registerCommand("galVsc.installCursorHooks", async () => {
      const folder = vscode.workspace.workspaceFolders?.[0];
      if (!folder) {
        vscode.window.showWarningMessage("请先打开一个工作区再安装 Hooks");
        return;
      }
      const signal = await installCursorHooks(folder.uri.fsPath);
      context.subscriptions.push(
        watchAgentSignal(signal, (status) => {
          applyEvent(context, status === "fail" ? "agentFail" : "agentSuccess");
        }),
      );
      vscode.window.showInformationMessage(
        "已写入 .cursor/hooks.json 与信号文件，重启 Cursor Agent 会话后生效",
      );
    }),
  );

  for (const d of registerEventWatchers((event) =>
    applyEvent(context, event),
  )) {
    context.subscriptions.push(d);
  }

  // Auto-watch hooks signal if present in workspace
  const folder = vscode.workspace.workspaceFolders?.[0];
  if (folder) {
    const signalPath = vscode.Uri.joinPath(
      folder.uri,
      ".cursor",
      "gal-vsc-agent-signal.json",
    );
    void vscode.workspace.fs.stat(signalPath).then(
      () => {
        context.subscriptions.push(
          watchAgentSignal(signalPath, (status) => {
            applyEvent(
              context,
              status === "fail" ? "agentFail" : "agentSuccess",
            );
          }),
        );
      },
      () => undefined,
    );
  }

  // Nudge webview after a tick so first paint gets state
  setTimeout(() => refreshUi(), 300);
}

export function deactivate(): void {
  // no-op
}

function applyEvent(
  context: vscode.ExtensionContext,
  event: PetEventType,
): void {
  const result = engine.apply(event);
  if (!result.applied && event === "idleTick") {
    provider.postState(engine.getState());
    return;
  }
  if (!result.applied) {
    return;
  }
  void savePetState(context, result.state);
  refreshUi();
}

function refreshUi(): void {
  const state = engine.getState();
  statusItem.text = `🐋 好感 ${state.affection} · 陪伴 Lv${state.companionshipLevel}`;
  statusItem.tooltip = state.bubbleText;
  provider.postState(state);
}
