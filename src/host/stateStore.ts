import * as vscode from "vscode";
import { PetState } from "../domain/types";
import { createInitialState } from "../domain/AffectionEngine";

const KEY = "galVsc.petState";

export function loadPetState(context: vscode.ExtensionContext): PetState {
  const raw = context.globalState.get<PetState>(KEY);
  if (!raw) {
    return createInitialState();
  }
  return {
    ...createInitialState(),
    ...raw,
  };
}

export async function savePetState(
  context: vscode.ExtensionContext,
  state: PetState,
): Promise<void> {
  await context.globalState.update(KEY, state);
}

export async function resetPetState(
  context: vscode.ExtensionContext,
): Promise<PetState> {
  const fresh = createInitialState();
  await savePetState(context, fresh);
  return fresh;
}
