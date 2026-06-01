export interface EmailMessage {
  readonly to: string;
  readonly subject: string;
  readonly text: string;
  readonly html?: string;
}

export type EmailSender = (message: EmailMessage) => Promise<void>;

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

/**
 * Local-dev fallback: print the email to the console instead of delivering
 * it. Used until a real sender is registered via {@link setEmailSender}.
 */
const consoleSender: EmailSender = (message) => {
  console.log(format(message));
  return Promise.resolve();
};

let activeSender: EmailSender = consoleSender;

/**
 * Register the live email sender. Called from the Worker (and the workflow)
 * once the Cloudflare `send_email` binding is available — see
 * {@link makeBindingSender}. When no sender is registered (e.g. local dev
 * with no sending domain configured), emails fall back to the console.
 */
export const setEmailSender = (sender: EmailSender): void => {
  activeSender = sender;
};

/**
 * The raw Cloudflare `send_email` runtime binding (Email Service / Email
 * Routing). Typed loosely to avoid pulling `@cloudflare/workers-types` into
 * this leaf module.
 */
export interface RawSendEmailMessage {
  from: string;
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

export interface RawSendEmailBinding {
  send: (message: RawSendEmailMessage) => Promise<unknown>;
}

/**
 * Build an {@link EmailSender} backed by a Cloudflare `send_email` binding.
 * `from` must be an address on a verified sending domain (Email Service) or a
 * verified sender (Email Routing).
 */
export const makeBindingSender =
  (binding: RawSendEmailBinding, from: string): EmailSender =>
  (message) =>
    binding
      .send({
        from,
        to: message.to,
        subject: message.subject,
        text: message.text,
        ...(message.html ? { html: message.html } : {}),
      })
      .then(() => undefined);

/**
 * Send an email through the registered sender. Never rejects — on failure it
 * logs the error and dumps the message to the console so flows that embed a
 * link (password reset, verification) can still be completed in dev.
 */
export const sendEmail = (message: EmailMessage): Promise<void> =>
  activeSender(message).catch((cause) => {
    console.error("sendEmail failed", cause);
    console.log(format(message));
  });
