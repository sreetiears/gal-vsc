import * as vscode from "vscode";
import { PetState } from "../domain/types";

export class PetViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "galVsc.petView";
  private view?: vscode.WebviewView;

  constructor(private readonly extensionUri: vscode.Uri) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ): void {
    this.view = webviewView;
    const { webview } = webviewView;
    webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.extensionUri, "media"),
      ],
    };
    webview.html = this.getHtml(webview);
  }

  postState(state: PetState): void {
    this.view?.webview.postMessage({ type: "state", state });
  }

  private getHtml(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "media", "webview", "main.js"),
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "media", "webview", "main.css"),
    );
    const petUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "media", "pet", "whale-idle.png"),
    );
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; img-src ${webview.cspSource} data:; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link href="${styleUri}" rel="stylesheet" />
</head>
<body>
  <div id="hud">
    <span id="affection">好感 10</span>
    <span id="companionship">陪伴 Lv0 · 0/100</span>
  </div>
  <div id="stage">
    <div id="pet" class="mood-idle" style="left:70%; top:45%;">
      <div id="bubble">你好，我是大肥鱼～</div>
      <img id="sprite" src="${petUri}" alt="大肥鱼" draggable="false" />
    </div>
  </div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function getNonce(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let text = "";
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}
