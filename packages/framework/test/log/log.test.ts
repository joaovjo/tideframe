import { describe, expect, it } from "bun:test";
import { createLogger, createMemorySink, currentContext, runWithContext } from "#log";

describe("log", () => {
  it("Given a logger with a memory sink Then info records are captured", () => {
    const sink = createMemorySink();
    const logger = createLogger({ sinks: [sink.sink], level: "info" });
    logger.info("hello", { count: 1 });
    logger.debug("hidden");
    expect(sink.records).toHaveLength(1);
    expect(sink.records[0]?.message).toBe("hello");
    expect(sink.records[0]?.fields).toEqual({ count: 1 });
    expect(sink.records[0]?.level).toBe("info");
  });

  it("Given level debug Then debug records are captured", () => {
    const sink = createMemorySink();
    const logger = createLogger({ sinks: [sink.sink], level: "debug" });
    logger.debug("seen");
    expect(sink.records[0]?.level).toBe("debug");
  });

  it("Given default level info Then debug/info captured, warn+ captured", () => {
    const sink = createMemorySink();
    const logger = createLogger({ sinks: [sink.sink] });
    logger.debug("nope");
    logger.info("yes");
    logger.warn("yes too");
    expect(sink.records.map((record) => record.message)).toEqual(["yes", "yes too"]);
  });

  it("Given runWithContext Then currentContext returns the stored context", () => {
    runWithContext({ requestId: "r-1" }, () => {
      expect(currentContext()).toEqual({ requestId: "r-1" });
    });
    expect(currentContext()).toBeUndefined();
  });

  it("Given runWithContext Then the logger record includes the context", () => {
    const sink = createMemorySink();
    const logger = createLogger({ sinks: [sink.sink] });
    runWithContext({ requestId: "r-2" }, () => {
      logger.info("in request");
    });
    expect(sink.records[0]?.context).toEqual({ requestId: "r-2" });
  });

  it("Given a logger with sensitive fields Then they are redacted", () => {
    const sink = createMemorySink();
    const logger = createLogger({ sinks: [sink.sink] });
    logger.info("auth", { password: "hunter2", safe: "visible" });
    expect(sink.records[0]?.fields).toEqual({ password: "[REDACTED]", safe: "visible" });
  });

  it("Given child logger Then child fields are merged into records", () => {
    const sink = createMemorySink();
    const logger = createLogger({ sinks: [sink.sink] }).child({ tenant: "acme" });
    logger.info("hello", { count: 2 });
    expect(sink.records[0]?.fields).toEqual({ tenant: "acme", count: 2 });
  });

  it("Given setLevel Then the level changes", () => {
    const sink = createMemorySink();
    const logger = createLogger({ sinks: [sink.sink] });
    logger.debug("hidden");
    logger.setLevel("debug");
    logger.debug("shown");
    expect(sink.records.map((record) => record.message)).toEqual(["shown"]);
  });
});
