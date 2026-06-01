import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

export interface EmailMessage {
  readonly to: string;
  readonly subject: string;
  readonly text: string;
  readonly html?: string;
}

export interface EmailService {
  readonly send: (message: EmailMessage) => Effect.Effect<void>;
}

export class Email extends Context.Service<Email, EmailService>()("Email") {}

const format = (m: EmailMessage): string =>
  [
    "",
    "📧 ───────────── EMAIL (console) ─────────────",
    `   to:      ${m.to}`,
    `   subject: ${m.subject}`,
    "   ----------------------------------------",
    m.text
      .split("\n")
      .map((line) => `   ${line}`)
      .join("\n"),
    "📧 ────────────────────────────────────────────",
    "",
  ].join("\n");

export const EmailConsole = Layer.succeed(Email, {
  send: (message: EmailMessage) => Effect.logInfo(format(message)),
});

export const sendEmail = (message: EmailMessage): Promise<void> => {
  try {
    console.log(format(message));
  } catch (cause) {
    console.error("sendEmail failed", cause);
  }
  return Promise.resolve();
};
