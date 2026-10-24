# MCD-Assist

> 🏆 麦当劳程序员创意开发大赛参赛项目 · 基于麦当劳 `mcd-mcp` 的**多人拼单优惠方案模拟工具**（H5 网页）

> 🔒 **纯模拟**：仅提供拼单/优惠方案「建议与参考」，**不含真实下单、不涉及支付、无需登录、不收集任何用户信息**。餐品信息、价格及供应状态以麦当劳官方渠道为准。

## 目标用户

- 组织办公室下午茶、部门聚餐的**拼单发起人**：快速算出「怎么买最省」
- 参与多人拼单的**普通用户**：看清自己那份多少钱（AA 参考）
- 想在麦当劳复杂券规则里**省钱**的个人用户

## 功能

- **多人拼单**：单机给多人各自加购（带「拼单人」标签），自动汇总
- **优惠方案建议**：按「本店可用券」逐张试算，给出**主方案（严格最优）**与**凑单参考方案（+1 件最便宜饮料/小食看是否更省）**
- **门店查询**：按城市+关键词搜门店、营业状态
- **菜单 / 单品图鉴**：全菜单按品类，展示图片、名字、组成、热量营养
- **优惠券展示**：本店可用券 + 麦麦省可领券（仅参考，不领取）
- **活动日历**：后端每日 00:00 定时拉取活动写库

## 使用示例

场景：行政同事组织 5 人下午茶拼单，想知道怎么点最省。

1. 打开 H5 页面 → 选择城市 + 地标搜索门店（如「上海 + 某写字楼」）→ 选中门店
2. 在菜单页为每位同事加购（加购时标注拼单人，如「阿明」「小红」），想了解成分/热量可进「图鉴」查看
3. 点底部「拼单袋」→ 查看汇总金额 → 点「计算优惠方案」
4. 得到两个方案：
   - **主方案**：例如「用 X 券，实付 ¥57.0（原 ¥66.5）」
   - **凑单参考**：例如「加 1 份 ¥6 的小食可再触发 Y 券减免，实付降至 ¥55.0」
5. 按方案去麦当劳 App/柜台自行下单（本工具不代下单）

## 架构

```
H5 前端 (web/index.html, 单文件无外部依赖)
   │  HTTP (CORS)
   ▼
Node 后端 (server/, Express + TypeScript)
   ├─ 业务 API（门店/菜单/图鉴/优惠券/活动/优惠优化）
   ├─ 定时任务 scheduler：每日 00:00 拉取活动写库
   ├─ 优惠优化：query-store-coupons 店面券 + calculate-price 逐张试算比价
   └─ mcd-mcp 客户端（Streamable HTTP → https://mcp.mcd.cn）
   ▼
mcd-mcp (远程 Streamable HTTP) ──► 麦当劳服务
```

- 前端不能直连 mcd-mcp（token 会暴露且跨域），必须经后端中间层。
- 后端需常驻以触发定时任务。

## 目录

- `server/`  Node 后端（Express + TS + better-sqlite3 + node-cron）
- `web/`     H5 前端（`index.html` 单文件，内联 CSS/JS）
- `docs/`    TODO 等文档

## 安装与运行

### 后端

```bash
cd server
npm install
cp .env.example .env   # 填入 MCP_MCD_TOKEN
npm run dev            # tsx watch 热重载，默认 :3000
```

### 前端

直接用浏览器打开 `web/index.html` 即可（默认请求 `http://localhost:3000/api`）。

- 若浏览器因 `file://` 拦截请求，可在 `web/` 下起一个静态服务，如：
  `python -m http.server 8080` 然后访问 `http://localhost:8080`
- 后端已开启 CORS（`Access-Control-Allow-Origin: *`）。
- 顶部 `web/index.html` 里的 `var API = 'http://localhost:3000/api';` 部署时改成你的域名/HTTPS 地址。

## 环境变量（见 server/.env.example）

| 变量 | 说明 |
|------|------|
| `PORT` | 后端端口，默认 3000 |
| `MCP_MCD_URL` | mcd-mcp 地址，默认 `https://mcp.mcd.cn` |
| `MCP_MCD_TOKEN` | mcd-mcp 的 Bearer token（从麦当劳 MCP 控制台申请，填入 `server/.env`） |
| `DB_PATH` | SQLite 文件路径（活动日历缓存） |

### MCP 配置示例

`mcp-config.example.json` 提供了接入 WorkBuddy / MCP 客户端的脱敏配置模板（Token 仅使用环境变量占位符 `${MCD_MCD_TOKEN}`），可直接复制到本地 `mcp.json` 并替换为真实 Token 使用。

## MCP 集成说明

实际使用的 MCP Server、Tool 清单、调用流程与业务价值，详见 [MCP_INTEGRATION.md](MCP_INTEGRATION.md)。

## 参赛文件

- [CONTEST_DECLARATION.md](CONTEST_DECLARATION.md) —— 参赛声明（官方文件，内容未改动）
- [MCP_INTEGRATION.md](MCP_INTEGRATION.md) —— MCP 集成说明
- `mcp-config.example.json` —— 脱敏 MCP 配置示例
- `workbuddy.md` —— 使用 WorkBuddy 开发的对话上下文记录

## 安全

- `.env` 含敏感 token，**已被 .gitignore 忽略，切勿提交**。
- mcd-mcp 的 Bearer token 属于个人/环境凭证，独立部署时请使用你自己的有效 token。
- 本工具只调用公开/只读类能力（门店/菜单/图鉴/价格试算/可领券/活动），**不做**真实下单、自动领券、读取账号卡包等写操作。
- 本仓库不含任何真实 Token、密钥、账号凭证（见信息安全扫描结论）。
