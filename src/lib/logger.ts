// lib/logger.ts
// Lightweight structured logger. Suppresses non-error output outside development
// to avoid leaking debug information in production.

type LogLevel = "debug" | "info" | "warn" | "error";

const isDev = process.env.NODE_ENV === "development";

function write(level: LogLevel, message: string, context?: unknown): void {
  if (!isDev && level !== "error") return;
  const prefix = `[${new Date().toISOString()}] [${level.toUpperCase()}]`;
  const args: unknown[] = [prefix, message];
  if (context !== undefined) args.push(context);
  /* eslint-disable no-console */
  if (level === "error") console.error(...args);
  else if (level === "warn") console.warn(...args);
  else console.log(...args);
  /* eslint-enable no-console */
}

export const logger = {
  debug: (msg: string, ctx?: unknown) => write("debug", msg, ctx),
  info: (msg: string, ctx?: unknown) => write("info", msg, ctx),
  warn: (msg: string, ctx?: unknown) => write("warn", msg, ctx),
  error: (msg: string, ctx?: unknown) => write("error", msg, ctx),
};
