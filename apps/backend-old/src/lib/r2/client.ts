import { AsyncLocalStorage } from "node:async_hooks";

export interface R2Context {
  readonly bucket: R2Bucket;
  readonly accountId: string;
  readonly bucketName: string;
  readonly accessKeyId: string;
  readonly secretAccessKey: string;
}

const ctxStore = new AsyncLocalStorage<R2Context>();

export const runWithR2 = <T>(ctx: R2Context, fn: () => T): T => ctxStore.run(ctx, fn);

const requireCtx = (): R2Context => {
  const c = ctxStore.getStore();
  if (!c) throw new Error("r2 accessed outside of a request scope");
  return c;
};

export const r2 = new Proxy({} as R2Bucket, {
  get: (_target, prop) => {
    const b = requireCtx().bucket;
    const value = Reflect.get(b, prop);
    return typeof value === "function" ? value.bind(b) : value;
  },
});

export const r2Config = (): Omit<R2Context, "bucket"> => {
  const { bucket: _bucket, ...rest } = requireCtx();
  return rest;
};
