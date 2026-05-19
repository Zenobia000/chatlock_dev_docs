import * as vscode from 'vscode';

export type ThemeMode = 'system' | 'dark' | 'light';

export function isForceHighContrast(): boolean {
  return vscode.workspace
    .getConfiguration('architectCopilot')
    .get<boolean>('forceHighContrast', false);
}

export function isGuidanceMode(): boolean {
  return vscode.workspace
    .getConfiguration('architectCopilot')
    .get<boolean>('guidanceMode', true); // default ON for novice manager persona
}

export function getThemeMode(): ThemeMode {
  const v = vscode.workspace
    .getConfiguration('architectCopilot')
    .get<string>('themeMode', 'system');
  return (v === 'dark' || v === 'light' ? v : 'system') as ThemeMode;
}

export function bodyClass(): string {
  const cls: string[] = [];
  if (isForceHighContrast()) cls.push('force-hc');
  if (isGuidanceMode()) cls.push('guidance-mode');
  const theme = getThemeMode();
  if (theme === 'dark') cls.push('theme-dark');
  if (theme === 'light') cls.push('theme-light');
  // theme === 'system' adds nothing — defers to VS Code CSS variables
  return cls.join(' ');
}

export async function setForceHighContrast(value: boolean): Promise<void> {
  await vscode.workspace
    .getConfiguration('architectCopilot')
    .update('forceHighContrast', value, vscode.ConfigurationTarget.Global);
}

export async function setGuidanceMode(value: boolean): Promise<void> {
  await vscode.workspace
    .getConfiguration('architectCopilot')
    .update('guidanceMode', value, vscode.ConfigurationTarget.Global);
}

export async function setThemeMode(value: ThemeMode): Promise<void> {
  await vscode.workspace
    .getConfiguration('architectCopilot')
    .update('themeMode', value, vscode.ConfigurationTarget.Global);
}
