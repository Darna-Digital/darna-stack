import * as Context from "effect/Context";
import * as Effect from "effect/Effect";

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

export interface SendEmailBinding {
  send: (message: {
    from: string;
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
  }) => Promise<unknown>;
}

export const bindingEmail = (binding: SendEmailBinding, from: string): EmailService => ({
  send: (message) =>
    Effect.tryPromise(() =>
      binding.send({
        from,
        to: message.to,
        subject: message.subject,
        text: message.text,
        ...(message.html ? { html: message.html } : {}),
      }),
    ).pipe(Effect.asVoid, Effect.orDie),
});

export const sendWith =
  (email: EmailService) =>
  (message: EmailMessage): Promise<void> =>
    Effect.runPromise(email.send(message));
