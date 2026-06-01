import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Drizzle from "alchemy/Drizzle";
import * as Planetscale from "alchemy/Planetscale";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

import Worker from "./src/worker.ts";
import { Hyperdrive, PlanetscaleDb } from "./src/layers/db/db-iac.ts";

export default Alchemy.Stack(
  "DarnaBackend",
  {
    providers: Layer.mergeAll(
      Cloudflare.providers(),
      Drizzle.providers(),
      Planetscale.providers(),
    ),
    state: Cloudflare.state(),
  },
  Effect.gen(function* () {
    const bucket = yield* Cloudflare.R2Bucket("Bucket");

    const { database, branch } = yield* PlanetscaleDb;
    const hyperdrive = yield* Hyperdrive;
    const worker = yield* Worker;

    return {
      bucketName: bucket.bucketName,
      url: worker.url,
      databaseId: database.id,
      branchName: branch.name,
      hyperdriveId: hyperdrive.hyperdriveId,
    };
  }),
);
