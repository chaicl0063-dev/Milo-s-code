/**
 * 本地开发启动器：先把 .env.local 里的变量放进环境，再启动 `next dev`。
 *
 * 为什么需要它：Node 的 fetch 不走系统代理，只认 HTTPS_PROXY 环境变量，
 * 而且必须在 Node 进程启动前就设置好（NODE_USE_ENV_PROXY=1 时）。
 * Next 自己读 .env.local 的时机太晚，所以这里提前读一遍。
 * 线上（Vercel）不需要代理，也不会用到这个脚本。
 */
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const env = { ...process.env };

if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match || line.trimStart().startsWith("#")) continue;
    const [, key, rawValue] = match;
    if (key in env) continue; // 已经在环境里的变量优先
    env[key] = rawValue.replace(/^(["'])(.*)\1$/, "$2");
  }
}

const child = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "dev", ...process.argv.slice(2)],
  { stdio: "inherit", env },
);
child.on("exit", (code) => process.exit(code ?? 0));
