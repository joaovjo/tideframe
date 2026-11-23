/**
 * Filas de trabalho (queues) — versão em memória.
 * Sem Redis/Kafka/etc.: workers, retries, backoff e DLQ (via `onError`).
 */

import { newId } from "#core";

/** Job na fila: `id`, `name`, `payload` e tentativa atual. */
export interface Job {
  readonly id: string;
  readonly name: string;
  readonly payload: unknown;
  /** Tentativa atual (incrementa em cada retry). */
  attempt: number;
}

/** Opções de `createQueue` — workers, retries, backoff e hooks. */
export interface WorkOptions {
  /** Máximo de jobs processados em paralelo (padrão `1`). */
  readonly concurrency?: number;
  /** Retries por job (padrão `0`). */
  readonly retries?: number;
  /** Backoff por attempt — padrão exponencial (`1s, 2s, 4s...`). */
  readonly backoffMs?: (attempt: number) => number;
  /** Hook ao job ser concluído. */
  readonly onComplete?: (job: Job) => void;
  /** Hook ao job falhar (exaustão de retries). */
  readonly onError?: (job: Job, error: unknown) => void;
}

/** Fila em memória — `add`/`work`/`size`/`close`. */
export interface Queue {
  /** Adiciona um job — retorna o `jobId`. */
  add(name: string, payload?: unknown): string;
  /** Registra o handler de workers — chama `handler(job)` para cada job. */
  work(handler: (job: Job) => void | Promise<void>): void;
  /** Quantidade de jobs não processados. */
  size(): number;
  /** Fecha a fila — aguarda jobs em execução. */
  close(): Promise<void>;
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const defaultBackoffMs = (attempt: number): number => Math.min(1000 * 2 ** (attempt - 1), 30000);

/** Cria uma fila em memória. */
export function createQueue(options: WorkOptions = {}): Queue {
  const concurrency = options.concurrency ?? 1;
  const retries = options.retries ?? 0;
  const backoffMs = options.backoffMs ?? defaultBackoffMs;
  const onComplete = options.onComplete;
  const onError = options.onError;

  const queue: Job[] = [];
  let handler: ((job: Job) => void | Promise<void>) | undefined;
  let running = 0;

  function pump(): void {
    if (handler === undefined) return;
    while (queue.length > 0 && running < concurrency) {
      const job = queue.shift();
      if (job === undefined) return;
      running++;
      void runJob(job);
    }
  }

  async function runJob(job: Job): Promise<void> {
    job.attempt += 1;
    try {
      await handler?.(job);
      running--;
      onComplete?.(job);
    } catch (error) {
      running--;
      if (job.attempt > retries) {
        onError?.(job, error);
        return;
      }
      await sleep(backoffMs(job.attempt));
      queue.push(job);
    } finally {
      pump();
    }
  }

  return {
    add(name, payload) {
      const job: Job = { id: newId(), name, payload, attempt: 0 };
      queue.push(job);
      pump();
      return job.id;
    },

    work(worker) {
      handler = worker;
      pump();
    },

    size() {
      return queue.length;
    },

    async close() {
      while (running > 0) {
        await sleep(5);
      }
    },
  };
}
