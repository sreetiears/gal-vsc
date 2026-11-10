import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

/**
 * Installs a project-local Cursor hooks stub that writes a signal file.
 * The extension watches that file and maps agent finish → affection events.
 */
export async function installCursorHooks(
  workspaceRoot: string,
): Promise<vscode.Uri> {
  const hooksDir = path.join(workspaceRoot, ".cursor");
  const hooksFile = path.join(hooksDir, "hooks.json");
  const scriptPath = path.join(hooksDir, "gal-vsc-agent-hook.mjs");
  const signalPath = path.join(hooksDir, "gal-vsc-agent-signal.json");

  fs.mkdirSync(hooksDir, { recursive: true });

  const script = `#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const signal = path.join(dir, "gal-vsc-agent-signal.json");
const status = process.env.CURSOR_HOOK_STATUS || process.argv[2] || "success";
fs.writeFileSync(
  signal,
  JSON.stringify({ at: Date.now(), status, source: "gal-vsc-hook" }, null, 2),
);
`;
  fs.writeFileSync(scriptPath, script, "utf8");

  let hooks: { version?: number; hooks?: Record<string, unknown> } = {
    version: 1,
    hooks: {},
  };
  if (fs.existsSync(hooksFile)) {
    try {
      hooks = JSON.parse(fs.readFileSync(hooksFile, "utf8"));
    } catch {
      // keep fresh shell
    }
  }
  hooks.version = hooks.version ?? 1;
  hooks.hooks = hooks.hooks ?? {};

  const entry = {
    command: `node "${scriptPath.replace(/\\/g, "/")}"`,
  };

  // Best-effort keys used by Cursor hooks docs; harmless if ignored.
  const keys = ["afterAgentResponse", "stop", "afterShellExecution"];
  for (const key of keys) {
    const existing = hooks.hooks[key];
    if (Array.isArray(existing)) {
      const already = existing.some(
        (item) =>
          typeof item === "object" &&
          item &&
          "command" in item &&
          String((item as { command: string }).command).includes("gal-vsc-agent-hook"),
      );
      if (!already) {
        existing.push(entry);
      }
    } else {
      hooks.hooks[key] = [entry];
    }
  }

  fs.writeFileSync(hooksFile, JSON.stringify(hooks, null, 2), "utf8");
  fs.writeFileSync(
    signalPath,
    JSON.stringify({ at: 0, status: "idle", source: "gal-vsc-hook" }, null, 2),
    "utf8",
  );

  return vscode.Uri.file(signalPath);
}

export function watchAgentSignal(
  signalUri: vscode.Uri,
  onEvent: (status: "success" | "fail") => void,
): vscode.Disposable {
  let lastAt = 0;
  try {
    const raw = fs.readFileSync(signalUri.fsPath, "utf8");
    lastAt = JSON.parse(raw).at ?? 0;
  } catch {
    lastAt = 0;
  }

  const watcher = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern(
      vscode.Uri.file(path.dirname(signalUri.fsPath)),
      "gal-vsc-agent-signal.json",
    ),
  );

  const handle = () => {
    try {
      const raw = fs.readFileSync(signalUri.fsPath, "utf8");
      const data = JSON.parse(raw) as { at?: number; status?: string };
      if (!data.at || data.at <= lastAt) {
        return;
      }
      lastAt = data.at;
      const fail =
        data.status === "fail" ||
        data.status === "error" ||
        data.status === "failed";
      onEvent(fail ? "fail" : "success");
    } catch {
      // ignore partial writes
    }
  };

  watcher.onDidChange(handle);
  watcher.onDidCreate(handle);
  return watcher;
}
