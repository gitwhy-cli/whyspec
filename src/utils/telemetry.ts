/**
 * Anonymous telemetry for WhySpec.
 * Opt-out via WHYSPEC_TELEMETRY=0 environment variable.
 *
 * Collected: command name, timestamp, agent type.
 * NOT collected: file contents, project names, context content.
 */

export interface TelemetryEvent {
  command: string;
  timestamp: string;
  agent?: string;
}

/** Returns true if telemetry is enabled. */
export function isTelemetryEnabled(): boolean {
  return process.env.WHYSPEC_TELEMETRY !== "0";
}

// In-memory event queue for the current process.
const eventQueue: TelemetryEvent[] = [];

/** Logs a telemetry event (in-memory only for MVP). */
export function trackEvent(command: string, agent?: string): void {
  if (!isTelemetryEnabled()) return;

  eventQueue.push({
    command,
    timestamp: new Date().toISOString(),
    agent,
  });
}

/** Returns all queued events (for testing/future flush). */
export function getQueuedEvents(): readonly TelemetryEvent[] {
  return eventQueue;
}

/** Clears the event queue (for testing). */
export function clearEvents(): void {
  eventQueue.length = 0;
}
