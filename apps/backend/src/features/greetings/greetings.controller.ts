import { HttpApiBuilder } from "effect/unstable/httpapi";
import * as Effect from "effect/Effect";
import { Api } from "../../api.ts";
import type { Greeting } from "./greetings.model.ts";

const store: Greeting[] = [
  { id: 1, text: "Hello, Alchemy" },
  { id: 2, text: "Hello, Effect 4" },
];
let nextId = store.length + 1;

export const GreetingsController = HttpApiBuilder.group(Api, "greetings", (handlers) =>
  handlers
    .handle("index", () => Effect.succeed(store))
    .handle("store", ({ payload }) =>
      Effect.sync(() => {
        const greeting: Greeting = { id: nextId++, text: payload.text };
        store.push(greeting);
        return greeting;
      }),
    ),
);
