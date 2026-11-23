import { describe, expect, it } from "bun:test";
import { createMemorySink, createLogger } from "#log";
import { createLogMailer, createMemoryMailer, SmtpMailer } from "#mailer";

describe("mailer", () => {
  it("Given createMemoryMailer Then send captures messages", async () => {
    const { mailer, sent } = createMemoryMailer();
    await mailer.send({ from: "a@b.c", to: ["d@e.f"], subject: "Hi" });
    expect(sent).toHaveLength(1);
    expect(sent[0]?.subject).toBe("Hi");
    expect(sent[0]?.to).toEqual(["d@e.f"]);
  });

  it("Given createLogMailer Then send logs", async () => {
    const sink = createMemorySink();
    const logger = createLogger({ sinks: [sink.sink] });
    const mailer = createLogMailer(logger);
    await mailer.send({ from: "a@b.c", to: ["d@e.f"], subject: "Hi", text: "body" });
    expect(sink.records[0]?.message).toBe("email");
    expect(sink.records[0]?.fields.subject).toBe("Hi");
  });

  it("Given SmtpMailer Then it is a Mailer with send", () => {
    const mailer = new SmtpMailer({ host: "localhost", port: 587 });
    expect(typeof mailer.send).toBe("function");
  });
});
