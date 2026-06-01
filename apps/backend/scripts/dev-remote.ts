import { watch } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const TARGETS = ["src", "alchemy.run.ts"];
const SOURCE = /\.tsx?$/;
const DEBOUNCE_MS = 400;

let running = false;
let queued = false;
let timer: ReturnType<typeof setTimeout> | null = null;

const deploy = () => {
  if (running) {
    queued = true;
    return;
  }
  running = true;
  process.stdout.write("\n⟳ alchemy deploy …\n");
  const child = spawn("pnpm", ["run", "deploy:remote"], { cwd: ROOT, stdio: "inherit" });
  child.on("exit", (code) => {
    running = false;
    process.stdout.write(code === 0 ? "✓ deployed — watching\n" : `✗ deploy exited ${code}\n`);
    if (queued) {
      queued = false;
      schedule();
    }
  });
};

const schedule = () => {
  if (timer) clearTimeout(timer);
  timer = setTimeout(deploy, DEBOUNCE_MS);
};

const ignored = (file: string | null): boolean =>
  !file || !SOURCE.test(file) || file.replaceAll("\\", "/").includes("/migrations/");

for (const target of TARGETS) {
  watch(path.join(ROOT, target), { recursive: true }, (_event, file) => {
    if (!ignored(file)) schedule();
  });
}

process.stdout.write("👀 redeploying to Cloudflare on every save (Ctrl-C to stop)\n");
deploy();
