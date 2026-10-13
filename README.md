# MCD-Assist

基于麦当劳 `mcd-mcp` 的**多人拼单优惠方案模拟工具**（H5 网页）。

> 🔒 **纯模拟**：仅提供拼单/优惠方案「建议与参考」，**不含真实下单、不涉及支付、无需登录、不收集任何用户信息**。请以麦当劳官方 App 为准。

## 功能
- **多人拼单**：单机给多人各自加购（带「拼单人」标签），自动汇总
- **优惠方案建议**：按「本店可用券」逐张试算，给出**主方案（严格最优）**与**凑单参考方案（+1 件最便宜饮料/小食看是否更省）**
- **门店查询**：按城市+关键词搜门店、营业状态
- **菜单 / 单品图鉴**：全菜单按品类，展示图片、名字、组成、热量营养
- **优惠券展示**：本店可用券 + 麦麦省可领券（仅参考，不领取）
- **活动日历**：后端每日 00:00 定时拉取活动写库

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

## 运行
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
| `MCP_MCD_TOKEN` | mcd-mcp 的 Bearer token（从本机 `~/.workbuddy/mcp.json` 的 `mcd-mcp.headers.Authorization` 去掉 `Bearer ` 获取） |
| `DB_PATH` | SQLite 文件路径（活动日历缓存） |

## 安全
- `.env` 含敏感 token，**已被 .gitignore 忽略，切勿提交**。
- mcd-mcp 的 Bearer token 属于个人/环境凭证，独立部署时请使用你自己的有效 token。
- 本工具只调用公开/只读类能力（门店/菜单/图鉴/价格试算/可领券/活动），**不做**真实下单、自动领券、读取账号卡包等写操作。
