/**
 * Mailer: interface + transportes de log/memory + cliente SMTP mínimo
 * (EHLO, STARTTLS, AUTH, MAIL FROM, RCPT TO, DATA) — não é um MTA.
 * APIs de socket (`node:net`, `node:tls`) suportadas pelo Bun.
 */

import { connect as netConnect, type Socket } from "node:net";
import { connect as tlsConnect } from "node:tls";
import { createLogger, type Logger } from "#log";

/** Mensagem a enviar. */
export interface MailMessage {
  readonly from: string;
  readonly to: readonly string[];
  readonly subject: string;
  readonly text?: string;
  readonly html?: string;
  readonly headers?: Readonly<Record<string, string>>;
}

/** Interface do mailer. */
export interface Mailer {
  send(message: MailMessage): Promise<void>;
}

/** Mailer em memória: coleta mensagens sem enviar. */
export interface MemoryMailer {
  readonly mailer: Mailer;
  readonly sent: readonly MailMessage[];
}

/** Cria um mailer em memória. */
export function createMemoryMailer(): MemoryMailer {
  const sent: MailMessage[] = [];
  return { sent, mailer: { async send(message) { sent.push(message); } } };
}

/** Cria um mailer de log (loga a mensagem, não envia). */
export function createLogMailer(logger: Logger = createLogger()): Mailer {
  return {
    async send(message) {
      logger.info("email", {
        from: message.from,
        to: message.to,
        subject: message.subject,
        text: message.text,
        html: message.html,
      });
    },
  };
}

/** Opções do SMTP. */
export interface SmtpOptions {
  readonly host: string;
  /** Porta (padrão: `587`). */
  readonly port?: number;
  readonly username?: string;
  readonly password?: string;
  /** STARTTLS se o servidor suportar (padrão: `true`). */
  readonly starttls?: boolean;
}

/** Sessão SMTP mínima: linha-a-linha via `node:net`. */
class SmtpSession {
  readonly socket: Socket;
  private readonly buffer: string[] = [];
  private waiter: ((line: string) => void) | undefined;
  private ended = false;

  constructor(socket: Socket) {
    this.socket = socket;
    socket.on("data", (data: Buffer) => {
      for (const line of data.toString("utf8").split(/\r?\n/)) {
        if (line === "") continue;
        const waiter = this.waiter;
        if (waiter !== undefined) {
          this.waiter = undefined;
          waiter(line);
        } else {
          this.buffer.push(line);
        }
      }
    });
  }

  private read(): Promise<string> {
    const buffered = this.buffer.shift();
    if (buffered !== undefined) return Promise.resolve(buffered);
    if (this.ended) return Promise.reject(new Error("SMTP connection closed"));
    return new Promise<string>((resolve) => {
      this.waiter = resolve;
    });
  }

  async expect(code: number): Promise<string> {
    const line = await this.read();
    if (!line.startsWith(String(code))) throw new Error(`SMTP error: ${line}`);
    return line;
  }

  async cmd(line: string, code: number): Promise<string[]> {
    this.socket.write(`${line}\r\n`);
    const lines: string[] = [];
    for (;;) {
      const reply = await this.read();
      lines.push(reply);
      if (!reply.startsWith(`${code}-`)) {
        if (reply.startsWith(String(code))) return lines;
        throw new Error(`SMTP error: ${reply}`);
      }
    }
  }
}

function toBase64(value: string): string {
  return Buffer.from(value, "utf8").toString("base64");
}

function buildMessage(message: MailMessage): string {
  const lines: string[] = [];
  lines.push(`From: ${message.from}`);
  lines.push(`To: ${message.to.join(", ")}`);
  lines.push(`Subject: ${message.subject}`);
  for (const [key, value] of Object.entries(message.headers ?? {})) {
    lines.push(`${key}: ${value}`);
  }
  if (message.text !== undefined) lines.push("", message.text);
  if (message.html !== undefined) lines.push("", message.html);
  return lines.join("\r\n");
}

/** Cliente SMTP mínimo (EHLO, STARTTLS, AUTH, MAIL FROM, RCPT TO, DATA). */
export class SmtpMailer implements Mailer {
  private readonly options: SmtpOptions;

  constructor(options: SmtpOptions) {
    this.options = options;
  }

  async send(message: MailMessage): Promise<void> {
    if (message.to.length === 0) {
      throw new Error("SmtpMailer.send: at least one recipient is required");
    }
    let socket = netConnect({ host: this.options.host, port: this.options.port ?? 587 });
    let session = new SmtpSession(socket);
    try {
      await session.expect(220); // greeting
      const ehlo = await session.cmd(`EHLO ${this.options.host}`, 250);
      if (this.options.starttls !== false && ehlo.some((line) => line.includes("STARTTLS"))) {
        await session.cmd("STARTTLS", 220);
        socket = tlsConnect({ socket, host: this.options.host, servername: this.options.host });
        session = new SmtpSession(socket);
        await session.expect(220);
        await session.cmd(`EHLO ${this.options.host}`, 250);
      }
      if (this.options.username !== undefined) {
        await session.cmd("AUTH LOGIN", 334);
        await session.cmd(toBase64(this.options.username), 334);
        await session.cmd(toBase64(this.options.password ?? ""), 235);
      }
      await session.cmd(`MAIL FROM:<${message.from}>`, 250);
      for (const recipient of message.to) {
        await session.cmd(`RCPT TO:<${recipient}>`, 250);
      }
      await session.cmd("DATA", 354);
      session.socket.write(`${buildMessage(message)}\r\n.\r\n`);
      await session.expect(250);
      await session.cmd("QUIT", 221);
    } finally {
      socket.destroy();
    }
  }
}
