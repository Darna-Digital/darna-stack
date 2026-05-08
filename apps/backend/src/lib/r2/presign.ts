import { AwsClient } from "aws4fetch";
import { r2Config } from "./client.js";

export interface PresignPutInput {
  readonly key: string;
  readonly contentType: string;
  readonly expiresInSeconds: number;
}

export const presignPut = async (input: PresignPutInput): Promise<string> => {
  const cfg = r2Config();
  const missing = (["accountId", "bucketName", "accessKeyId", "secretAccessKey"] as const).filter(
    (k) => !cfg[k],
  );
  if (missing.length > 0) {
    throw new Error(
      `R2 presign config missing env: ${missing
        .map(
          (k) =>
            `R2_${k === "accountId" ? "ACCOUNT_ID" : k === "bucketName" ? "FILES_BUCKET_NAME" : k === "accessKeyId" ? "ACCESS_KEY_ID" : "SECRET_ACCESS_KEY"}`,
        )
        .join(", ")}`,
    );
  }
  const client = new AwsClient({
    accessKeyId: cfg.accessKeyId,
    secretAccessKey: cfg.secretAccessKey,
    service: "s3",
    region: "auto",
  });
  const url = new URL(
    `https://${cfg.accountId}.r2.cloudflarestorage.com/${cfg.bucketName}/${encodeURIComponent(input.key)}`,
  );
  url.searchParams.set("X-Amz-Expires", String(input.expiresInSeconds));
  const signed = await client.sign(
    new Request(url.toString(), {
      method: "PUT",
      headers: { "Content-Type": input.contentType },
    }),
    { aws: { signQuery: true } },
  );
  return signed.url;
};
