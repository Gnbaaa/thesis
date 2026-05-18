import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

/** Бүх боломжит .env зам — дарааллаар уншина, сүүлийн олдсон нь өмнөхийг дарна (override). */
export function envFileCandidates(): string[] {
  return [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), 'backend', '.env'),
    path.resolve(__dirname, '..', '.env'),
    path.resolve(__dirname, '..', '..', 'backend', '.env'),
  ];
}

function uniquePaths(paths: string[]): string[] {
  return [...new Set(paths)];
}

for (const envPath of uniquePaths(envFileCandidates())) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true, quiet: true });
  }
}

// Jest sets NODE_ENV=test before importing the app; keep test output free of HTTP noise.
if (process.env.NODE_ENV === 'test') {
  process.env.LOG_LEVEL = 'silent';
}

export function getDotenvDiagnostics(): { cwd: string; loadedEnvFiles: { path: string; exists: boolean }[] } {
  return {
    cwd: process.cwd(),
    loadedEnvFiles: uniquePaths(envFileCandidates()).map((p) => ({
      path: p,
      exists: fs.existsSync(p),
    })),
  };
}
