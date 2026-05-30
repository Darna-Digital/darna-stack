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

/**
 * Transport-agnostic email sender. Swap the layer (Resend/SES/...) without
 * touching call sites. {@link EmailConsole} is the dev default.
 */
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

/** Dev implementation: logs the email (incl. verification/reset links). */
export const EmailConsole = Layer.succeed(Email, {
  send: (message: EmailMessage) => Effect.logInfo(format(message)),
});

/**
 * Bridge for non-Effect callers (better-auth's async email callbacks). It logs
 * directly to the console and resolves immediately — deliberately NOT running a
 * nested Effect runtime (`Effect.runPromise`) inside the Worker request, which
 * can hang under workerd. Swap this body for a real provider call later; the
 * {@link Email}/{@link EmailConsole} layer above is the Effect-side seam.
 */
export const sendEmail = (message: EmailMessage): Promise<void> => {
  try {
    console.log(format(message));
  } catch (cause) {
    console.error("sendEmail failed", cause);
  }
  return Promise.resolve();
};
