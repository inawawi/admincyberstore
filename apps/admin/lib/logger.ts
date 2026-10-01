import { randomUUID } from "node:crypto";

export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

const LEVEL_WEIGHTS: Record<LogLevel, number> = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
};

const SENSITIVE_KEY_REGEX = /(?:password|token|secret|authorization|cookie|otp|signature_key|otp_code|credit_card|cvv|key|auth_secret)/i;

/**
 * Mask sensitive email addresses (e.g. user@example.com -> u***r@example.com)
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email || typeof email !== "string") return "";
  const parts = email.split("@");
  if (parts.length !== 2) return "[INVALID_EMAIL]";
  const [user, domain] = parts;
  if (user.length <= 2) {
    return `${user[0] || "*"}***@${domain}`;
  }
  return `${user[0]}***${user[user.length - 1]}@${domain}`;
}

/**
 * Mask phone numbers (e.g. 081234567890 -> 0812****7890)
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone || typeof phone !== "string") return "";
  const trimmed = phone.trim();
  if (trimmed.length <= 4) return "****";
  const start = trimmed.slice(0, 4);
  const end = trimmed.slice(-4);
  return `${start}****${end}`;
}

/**
 * Recursively redacts sensitive keys from objects and arrays before logging.
 */
export function redactSensitiveData(data: unknown, depth = 0): unknown {
  if (depth > 5) return "[DEPTH_LIMIT]";
  if (data === null || data === undefined) return data;

  if (data instanceof Error) {
    return {
      name: data.name,
      message: data.message,
      stack: data.stack,
      ...(data as unknown as Record<string, unknown>),
    };
  }

  if (Array.isArray(data)) {
    return data.map((item) => redactSensitiveData(item, depth + 1));
  }

  if (typeof data === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (SENSITIVE_KEY_REGEX.test(key)) {
        sanitized[key] = "[REDACTED]";
      } else {
        sanitized[key] = redactSensitiveData(value, depth + 1);
      }
    }
    return sanitized;
  }

  return data;
}

function getActiveLogLevel(): LogLevel {
  const envLevel = (process.env.LOG_LEVEL || "").toLowerCase() as LogLevel;
  if (envLevel in LEVEL_WEIGHTS) {
    return envLevel;
  }
  return process.env.NODE_ENV === "production" ? "info" : "debug";
}

function shouldLog(level: LogLevel): boolean {
  const activeLevel = getActiveLogLevel();
  return LEVEL_WEIGHTS[level] >= LEVEL_WEIGHTS[activeLevel];
}

export interface LoggerOptions {
  context?: Record<string, unknown>;
  reqId?: string;
}

export class Logger {
  private defaultContext: Record<string, unknown>;
  public reqId?: string;

  constructor(options: LoggerOptions = {}) {
    this.defaultContext = options.context || {};
    this.reqId = options.reqId;
  }

  /**
   * Create a child logger with bound contextual metadata.
   */
  public child(context: Record<string, unknown>): Logger {
    return new Logger({
      context: { ...this.defaultContext, ...context },
      reqId: (context.reqId as string) || this.reqId,
    });
  }

  private write(level: LogLevel, message: string, context?: Record<string, unknown>) {
    if (!shouldLog(level)) return;

    const isProd = process.env.NODE_ENV === "production";
    const timestamp = new Date().toISOString();
    const mergedContext = {
      ...this.defaultContext,
      ...(context || {}),
    };

    const reqId = (mergedContext.reqId as string) || this.reqId;
    if (reqId) {
      mergedContext.reqId = reqId;
    }

    const sanitizedContext = redactSensitiveData(mergedContext) as Record<string, unknown>;

    if (isProd) {
      // 12-factor standard NDJSON
      const payload: Record<string, unknown> = {
        level,
        time: timestamp,
        pid: process.pid,
        msg: message,
        ...sanitizedContext,
      };

      const jsonStr = JSON.stringify(payload);
      if (level === "error" || level === "fatal") {
        process.stderr.write(jsonStr + "\n");
      } else {
        process.stdout.write(jsonStr + "\n");
      }
    } else {
      // Human-readable dev output
      const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
      const reqTag = reqId ? ` (${reqId})` : "";
      const hasContext = Object.keys(sanitizedContext).length > 0;

      const line = `${prefix}${reqTag}: ${message}`;
      if (level === "error" || level === "fatal") {
        console.error(line, hasContext ? sanitizedContext : "");
      } else if (level === "warn") {
        console.warn(line, hasContext ? sanitizedContext : "");
      } else {
        console.log(line, hasContext ? sanitizedContext : "");
      }
    }
  }

  public trace(message: string, context?: Record<string, unknown>) {
    this.write("trace", message, context);
  }

  public debug(message: string, context?: Record<string, unknown>) {
    this.write("debug", message, context);
  }

  public info(message: string, context?: Record<string, unknown>) {
    this.write("info", message, context);
  }

  public warn(message: string, context?: Record<string, unknown>) {
    this.write("warn", message, context);
  }

  public error(message: string, context?: Record<string, unknown>) {
    this.write("error", message, context);
  }

  public fatal(message: string, context?: Record<string, unknown>) {
    this.write("fatal", message, context);
  }

  /**
   * Standardized audit log for security, administrative mutations, and financial events.
   */
  public audit(
    action: string,
    details: {
      actor?: { id?: number | string; email?: string; role?: string };
      target?: { type: string; id?: number | string };
      status: "success" | "failure" | "blocked";
      ip?: string;
      reason?: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    this.write("info", `[AUDIT] ${action}: ${details.status}`, {
      is_audit: true,
      audit_action: action,
      ...details,
    });
  }
}

/**
 * Singleton Root Logger instance.
 */
export const logger = new Logger();

/**
 * Generate a cryptographically random Request ID.
 */
export function generateRequestId(): string {
  return `req_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
}
