# ReAround You · 部署与运维交接（Beta）

面向接手部署的运维团队。代码为 Next.js 16（App Router）全栈应用：前端页面、官网和全部后端接口在同一个仓库里，没有独立后端服务、没有数据库迁移。本文只写部署需要知道的事；产品与设计的事实总账在 `docs/PRODUCT-BRIEF.md`。

## 1. 交付物

| 项 | 位置 | 说明 |
|---|---|---|
| 源码 | 本压缩包 / Git 仓库 `main` 分支 | 不含 `node_modules`、`.env.local`、安卓签名文件 |
| 环境变量清单 | `.env.example` | 所有变量及默认值，值留空 |
| 安卓工程 | `android/` | Capacitor 壳，远程加载网页；见第 6 节 |
| 已有安卓包 | `ReAroundYou-1.0-remote.apk`（versionCode 1，另附） | 加载地址写死为 Beta 测试地址，仅供对照 |
| 签名密钥 | **不在交付物内**，由产品负责人另行移交 | `rearound-release.jks` + 口令；丢了就无法给已安装用户覆盖升级 |

## 2. 运行要求

- Node.js 20 或更新（本机开发用 24），pnpm 10。
- 出网：服务器需要能访问 Wikipedia / Wikimedia、OpenStreetMap（Overpass、Nominatim、瓦片）、Wikidata、Wikivoyage、大模型接口（当前智谱 `open.bigmodel.cn`）、微软 Edge 语音（`speech.platform.bing.com`，WebSocket）、Upstash Redis。
- 无持久化磁盘需求；唯一的状态在 Upstash Redis（邮箱登记、限流计数）。
- 路由 `/api/guide` `/api/ask` `/api/plan` 是流式响应，单次最长 60 秒（`maxDuration`）。反向代理不要缓冲响应体，超时不低于 60 秒。

## 3. 两种部署方式

### 3a. Vercel（当前 Beta 就是这样跑的，最省事）

1. 导入 Git 仓库，框架自动识别为 Next.js，构建命令 `pnpm build`。
2. 在 Vercel Marketplace 添加 Upstash Redis（免费档够用），它会自动注入 `KV_REST_API_URL` / `KV_REST_API_TOKEN`。
3. 按第 4 节填其余环境变量。
4. 绑定域名（第 5 节）。

### 3b. 自有服务器 / 容器

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm start          # 监听 3000 端口；用 PORT=xxxx 改
```

- 用 Nginx / Caddy 做 HTTPS 终止并反向代理到 3000，转发时必须带 `X-Forwarded-For`（限流按它取客户端 IP）和 `Host`（域名分流按它判断）。
- 进程管理用 pm2 或 systemd；应用无状态，可跑多个实例。多实例时 Redis 必须配置，否则限流只按单实例计数。
- 容器化：任意 Node 20 基础镜像，`pnpm build` 后 `pnpm start`。没有额外系统依赖。

## 4. 环境变量

完整清单见 `.env.example`，这里只列决策点。

| 变量 | 必需 | 说明 |
|---|---|---|
| `LLM_API_KEY` `LLM_BASE_URL` `LLM_MODEL` | 是 | OpenAI 兼容接口。Beta 用智谱免费模型；换 Gemini / Groq 只改这三项，无需改代码 |
| `KV_REST_API_URL` `KV_REST_API_TOKEN` | 生产必需 | Upstash Redis REST。不配时邮箱登记不持久化、限流退回进程内存 |
| `SITE_HOSTS` | 域名分流时 | 官网域名列表，如 `bubblefrog.fun,www.bubblefrog.fun` |
| `NEXT_PUBLIC_APP_URL` | 域名分流时 | 官网按钮指向的应用地址，如 `https://app.bubblefrog.fun`。构建期变量，改了要重新构建 |
| `NEXT_PUBLIC_APK_URL` `NEXT_PUBLIC_APK_VERSION` | 放出安卓包时 | 官网下载按钮。构建期变量 |
| `RATE_LIMIT_*` | 否 | 覆盖默认限流额度；默认值在 `lib/ratelimit.ts` |
| `AMAP_KEY` `ASR_*` | 否 | 中国境内数据、语音提问；面向海外可不配 |

`NEXT_PUBLIC_` 前缀的变量会打进前端代码，只放公开信息。其余变量只在服务端使用，不会下发到浏览器或安卓包。

## 5. 域名方案

- `bubblefrog.fun`（和 `www`）：官网。配置 `SITE_HOSTS` 后，这两个域名的 `/` 显示官网，`/privacy` `/terms` 显示法律页（内部重写到 `/site/*`，实现见根目录 `proxy.ts`）。其它路径（应用页面、接口）在官网域名下也能访问，不做限制。
- `app.bubblefrog.fun`：应用。不需要任何配置，根路径就是应用；`/site` 在这个域名下仍能打开官网，无害。
- 两个域名指向同一个部署即可，不需要两套服务。
- 不配 `SITE_HOSTS` 时行为和 Beta 一样：应用在 `/`，官网在 `/site`。
- HTTPS 必需：浏览器定位、相机、麦克风只在 HTTPS 下可用。

## 6. 安卓包（Capacitor 远程加载壳）

安装包里只有一个占位页，真正的界面从 `server.url` 加载。网页更新即生效，用户不用重装；**代价是必须联网，且加载地址写死在包里**，换地址就要重新打包并让用户升级。

### 打包步骤（在有 Android SDK 的机器上）

```bash
# 1. 设置最终应用地址（打进安装包）
export CAP_SERVER_URL=https://app.bubblefrog.fun
pnpm install --frozen-lockfile
pnpm exec cap sync android

# 2. 签名配置：把 keystore.properties 放到 android/（模板见下），密钥文件路径用正斜杠
# 3. 构建
cd android && ./gradlew assembleRelease
# 产物：android/app/build/outputs/apk/release/app-release.apk
```

`android/keystore.properties`（不进 git）：

```
storeFile=D:/path/to/rearound-release.jks
storePassword=…
keyAlias=rearound
keyPassword=…
```

要求：JDK 21（Capacitor 8 的 Gradle 需要）；`android/local.properties` 里 `sdk.dir` 用正斜杠。

仓库里的 `android/gradle.properties` 不带任何代理设置；构建机需要代理时写在用户级 `~/.gradle/gradle.properties`，不要提交进仓库。

### 版本与签名规则

- `applicationId` 固定 `com.rearound.app`，**对外发过就不能改**，改了等于另一个应用，用户无法覆盖安装。
- 每次外发 `versionCode` 递增（当前 2，`versionName` 1.1），在 `android/app/build.gradle`。同时把 `components/AboutScreen.tsx` 里的 `APP_VERSION` 改成一致。
- 必须用同一把签名密钥，否则已安装用户升级失败。验证：`apksigner verify --print-certs app-release.apk`，证书指纹应与上一版一致。
- 发布时把 APK 放到官网可下载的位置（例如仓库 `public/downloads/` 或对象存储），并设置 `NEXT_PUBLIC_APK_URL` / `NEXT_PUBLIC_APK_VERSION` 后重新构建网页。

### 已知的架构债务

Capacitor 官方把 `server.url` 定位为开发用途；我们在 Beta 用它做远程加载是权衡后的选择。正式版计划改为「内置前端」：把前端导出进安装包，接口仍在服务器。那一步需要把服务端渲染的页面改成客户端取数，约两三天工作量，不在本次交付范围。

## 7. 上线检查单

1. `https://<应用域名>/api/nearby?lat=48.8584&lon=2.2945&lang=en` 返回地点列表（埃菲尔铁塔周边），说明出网与数据源正常。
2. 打开应用，允许定位或手选巴黎，点一个地点 → 「听导游讲讲」有文字、点播放有声音。如果返回 503 `llm_not_configured`，是 `LLM_*` 没配。
3. `/api/signup` 连续发 6 次同一 IP，第 6 次应为 429（限流工作），Upstash 里出现 `signup:<email>` 键。
4. 官网域名 `/`、`/privacy`、`/terms` 显示官网与法律页；应用域名 `/` 显示应用。
5. 手机浏览器（安卓 Chrome、iPhone Safari）走一遍：定位 → 地点 → 讲解 → 追问 → 返回地图。
6. 若放出 APK：从官网下载、安装、启动；`apksigner verify` 证书与上一版一致。

## 8. 回滚

- 网页：Vercel 在控制台一键回到上一个部署；自建时保留上一次 `pnpm build` 产物或镜像，切回去即可。应用无数据库迁移，回滚没有数据兼容问题。
- 安卓：远程加载壳的界面跟着网页走，网页回滚即回滚；只有加载地址或壳本身出问题才需要发新包（versionCode 必须继续递增，不能回退）。

## 9. 日志与告警建议

- 服务端 `console.warn` 有统一前缀：`[ratelimit]`（限流存储不可用，已放行）、`[signup]`（KV 未配置）、`[tts]` / `[guide]` 等接口错误。
- 值得盯的：大模型 429 频率（智谱免费额度紧张时会多）、`/api/tts` 失败率（非官方接口偶发失效，前端会自动退回系统语音）。
- 目前没有埋点或分析工具；隐私页对外承诺了这一点，加任何统计前要先改隐私页（`app/site/privacy/page.tsx`）。

## 10. 联系

产品与代码问题：产品负责人转 Claude / Codex 协作文档（`docs/COLLABORATION.md`）。对外邮箱 `hello@bubblefrog.fun`（占位，开通后请确认能收信；隐私页和联系页都用这个地址，在 `lib/site/brand.ts` 一处修改）。
