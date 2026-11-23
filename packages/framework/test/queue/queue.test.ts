import { describe, expect, it } from "bun:test";
import { createQueue } from "#queue";

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

describe("queue", () => {
  it("Given work handler Then added jobs are processed", async () => {
    const queue = createQueue();
    const processed: string[] = [];
    queue.work((job) => {
      processed.push(job.name);
    });
    queue.add("a");
    queue.add("b");
    await sleep(20);
    expect(processed).toEqual(["a", "b"]);
    expect(queue.size()).toBe(0);
  });

  it("Given failing handler with retries Then retries until attempts exhausted, then onError", async () => {
    let calls = 0;
    const errors: unknown[] = [];
    const queue = createQueue({
      retries: 1,
      backoffMs: () => 1,
      onError: (job, error) => {
        errors.push({ job: job.name, error });
      },
    });
    queue.work(() => {
      calls++;
      throw new Error("nope");
    });
    queue.add("x");
    await sleep(40);
    expect(calls).toBe(2);
    expect(errors).toHaveLength(1);
    expect(queue.size()).toBe(0);
  });

  it("Given concurrency Then up to N jobs run in parallel", async () => {
    let running = 0;
    let maxRunning = 0;
    const queue = createQueue({ concurrency: 2 });
    queue.work(async () => {
      running++;
      maxRunning = Math.max(maxRunning, running);
      await sleep(10);
      running--;
    });
    for (let i = 0; i < 5; i++) queue.add("j" + i);
    await sleep(50);
    expect(maxRunning).toBe(2);
  });

  it("Given close Then waits for running jobs", async () => {
    const queue = createQueue();
    const done: string[] = [];
    queue.work(async (job) => {
      await sleep(5);
      done.push(job.name);
    });
    queue.add("a");
    await sleep(1);
    await queue.close();
    expect(done).toEqual(["a"]);
  });

  it("Given add Before work Then jobs are queued until worker starts", async () => {
    const queue = createQueue();
    const id = queue.add("early");
    expect(typeof id).toBe("string");
    expect(queue.size()).toBe(1);
    await sleep(5);
    expect(queue.size()).toBe(1); // sem worker ainda
    const processed: string[] = [];
    queue.work((job) => {
      processed.push(job.name);
    });
    await sleep(10);
    expect(processed).toEqual(["early"]);
    expect(queue.size()).toBe(0);
  });
});
