import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  trackEvent,
  getQueuedEvents,
  clearEvents,
  isTelemetryEnabled,
} from "./telemetry.js";

describe("telemetry", () => {
  beforeEach(() => {
    clearEvents();
    delete process.env.WHYSPEC_TELEMETRY;
  });

  afterEach(() => {
    clearEvents();
    delete process.env.WHYSPEC_TELEMETRY;
  });

  it("is enabled by default", () => {
    expect(isTelemetryEnabled()).toBe(true);
  });

  it("is disabled when WHYSPEC_TELEMETRY=0", () => {
    process.env.WHYSPEC_TELEMETRY = "0";
    expect(isTelemetryEnabled()).toBe(false);
  });

  it("tracks events when enabled", () => {
    trackEvent("init");
    const events = getQueuedEvents();
    expect(events).toHaveLength(1);
    expect(events[0].command).toBe("init");
    expect(events[0].timestamp).toBeTruthy();
  });

  it("includes agent when provided", () => {
    trackEvent("capture", "claude-code");
    const events = getQueuedEvents();
    expect(events[0].agent).toBe("claude-code");
  });

  it("does not track events when disabled", () => {
    process.env.WHYSPEC_TELEMETRY = "0";
    trackEvent("init");
    expect(getQueuedEvents()).toHaveLength(0);
  });

  it("clears the event queue", () => {
    trackEvent("init");
    trackEvent("plan");
    expect(getQueuedEvents()).toHaveLength(2);
    clearEvents();
    expect(getQueuedEvents()).toHaveLength(0);
  });

  it("produces valid ISO timestamp", () => {
    trackEvent("test");
    const ts = getQueuedEvents()[0].timestamp;
    expect(() => new Date(ts)).not.toThrow();
    expect(new Date(ts).toISOString()).toBe(ts);
  });
});
