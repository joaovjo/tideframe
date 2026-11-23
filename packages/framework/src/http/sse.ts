/**
 * Eventos SSE: quadro `data:` com `Content-Type: text/event-stream`.
 */

import type { Ctx } from "./ctx";

/** Envia um quadro SSE: dados + evento/id/retry opcionais. */
export type SseSend = (data: string, options?: { event?: string; id?: string; retry?: number }) => void;

/** Resposta SSE — aberta e mantida aberta pelo handler. */
export function sseResponse(
  ctx: Ctx,
  handler: (send: SseSend, ctx: Ctx) => void | Promise<void>,
  init?: ResponseInit,
): Response {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      const send: SseSend = (data, options) => {
        let frame = "";
        if (options?.event !== undefined) frame += `event: ${options.event}\n`;
        if (options?.id !== undefined) frame += `id: ${options.id}\n`;
        if (options?.retry !== undefined) frame += `retry: ${options.retry}\n`;
        for (const line of data.split("\n")) {
          frame += `data: ${line}\n`;
        }
        frame += "\n";
        controller.enqueue(encoder.encode(frame));
      };
      void (async () => {
        try {
          await handler(send, ctx);
        } finally {
          controller.close();
        }
      })();
    },
  });
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "text/event-stream");
  headers.set("Cache-Control", "no-cache");
  headers.set("Connection", "keep-alive");
  return ctx.stream(stream, init === undefined ? { headers } : { ...init, headers });
}
