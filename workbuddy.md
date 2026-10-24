# workbuddy.md — 使用 WorkBuddy 的开发上下文记录

> 本文档记录 MCD-Assist 项目使用**腾讯 WorkBuddy 智能体**从 0 到 1 的完整开发上下文，用于「麦当劳程序员创意开发大赛」WorkBuddy 专项奖励核验。项目真实使用 WorkBuddy 完成创意构思、开发、调试与参赛整理全过程。

## 一、环境与仓库准备（WorkBuddy 协助完成）

| 步骤 | 内容 |
|---|---|
| 1 | 检查本地 SSH Key 是否已生成；确认走 **SSH Key** 方案托管 GitHub（不用 HTTPS+PAT） |
| 2 | 配置 Git 全局身份：`user.name=foreat`、`user.email=582359805@qq.com`、`credential.helper=manager` |
| 3 | 将 `foreat0926/MCD-Assist` 克隆到本地 `D:/Work/projectFolder/MCD-Assist` 并进入开发 |
| 4 | 确立分支工作流：**一切开发/提交/推送均在 `dev` 分支**，`main` 只经合并进入 |
| 5 | SSH 推送遇 Host key 验证问题，用 `GIT_SSH_COMMAND="ssh -o StrictHostKeyChecking=accept-new"` 解决 |

## 二、需求讨论（WorkBuddy 对话定稿）

- 初版方向：麦当劳订餐 + 生活管理工具（门店查询 / 优惠券中心 / 单品图鉴 / 活动日历 / 自动绑券 / 多人拼单 / 微信登录）。
- **方向调整（用户决策）**：从「可真实付费下单」改为「**拼单优惠方案模拟工具**」——不涉及真实支付、无需登录、不收集用户信息，用于给多人拼单提供优惠套餐方案建议；前端从微信小程序改为 **H5 网页**。
- 优惠计算口径确认：按「**店面可用优惠券**」计算。

## 三、mcd-mcp 能力实测（WorkBuddy 全工具打通）

- 通过 WorkBuddy 连接器接入麦当劳 MCP（`https://mcp.mcd.cn`，Streamable HTTP + Bearer Token），对 **35 个 Tool 逐一实测 schema 与返回结构**。
- 实测发现并固化到代码的关键契约：
  1. 多数工具返回「Markdown + 内嵌 JSON」，需 `extractJson` 提取；
  2. **价格双单位**：`query-meals` 价格为字符串「元」，`calculate-price` 价格为整数「分」（曾因混用产生 100 倍价差 bug，已修复）；
  3. `query-nearby-stores` 按位置搜索时 `city`+`keyword` 必须同时非空（否则 600058）；
  4. 计价商品码字段是 `productCode` 而非 `code`；
  5. `list-nutrition-foods` 的 `data` 是 JSON 字符串（换行被转义），按行拆分失败后改为先解析外层 JSON；
  6. 门店营业时段影响菜单/价格可用性（宵夜部分套餐 `calculate-price` 失败）。

## 四、开发过程（WorkBuddy 生成/调试代码）

- **后端**（Node 22 + TypeScript + Express + better-sqlite3 + node-cron）：
  - `server/src/mcp/client.ts`：StreamableHTTP 客户端封装（`callMcpTool` / `callMcpToolJson` / `callMcpToolText`）
  - 6 组路由按真实契约落地：stores / menu / wiki / coupons / optimizer / activities
  - 定时任务：每日 00:00 拉 `campaign-calendar` 写 SQLite
  - 端到端验证全部通过（门店搜索、菜单、图鉴、券展示、优惠试算）
- **前端**（H5 单文件 `web/index.html`，原生 HTML/CSS/JS 零依赖）：
  - 选门店 → 菜单加购（带「拼单人」标签）→ 图鉴详情（组成+热量）→ 优惠券展示 → 拼单袋计算优惠方案（主方案+凑单参考）→ 活动日历
  - localStorage 持久化拼单袋
- **方向重构**：移除登录/下单/绑券/账号相关代码与 `users`/`orders` 表，新增 CORS；`optimizer` 改为「店面券逐张试算 + 无券回退」。
- **代码清理**：删除 `miniprogram/`、`auth/`、`orders` 路由及死函数；tsconfig 增加 `noUnusedLocals`/`noUnusedParameters`，`tsc` 0 错误；依赖核查无冗余。
- 全部提交按 dev 分支工作流推送至 `origin/dev`（本地与远程保持 `0 0` 同步）。

## 五、参赛整理（WorkBuddy 协助完成）

- 读取大赛仓库参赛要求与 `activityGuidelines.md`，逐条比对；
- 创建参赛三件套：`CONTEST_DECLARATION.md`（官方原文未改）、`MCP_INTEGRATION.md`（8 个 Tool 的调用流程与业务价值）、`mcp-config.example.json`（脱敏配置，仅环境变量占位符）；
- 重写 `README.md`：补齐目标用户、安装方法、使用示例；
- 全仓安全扫描：确认无真实 Token/密钥/个人信息入库。

## 六、开发中使用的 WorkBuddy 能力

- MCP 连接器（mcd-mcp 35 工具实测与联调）
- 代码读写 / 终端命令 / Git 全流程（clone、分支、commit、push）
- 联网检索（大赛规则、官方文档）
- 任务管理（TODO 清单跟踪）

---

*本文档为 WorkBuddy 真实开发上下文记录，不含任何敏感凭证信息。*
