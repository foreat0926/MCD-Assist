# MCD-Assist

基于麦当劳 `mcd-mcp` 的微信小程序：智能订餐 + 生活管理。

## 功能（MVP）
- **门店查询**：附近门店、营业状态、按营业中筛选、门店详情
- **优惠券中心**：可用券 / 我的券 / 门店券 / 促销活动，有效期倒计时
- **单品图鉴**：全菜单按品类（汉堡/小食/饮料/甜品/套餐），展示图片、名字、成分、热量
- **活动日历**：首页展示，后端每日 00:00 定时拉取未来 7 天开始的活动
- **自动绑券 + 多人拼单 + 智能优惠优化**：结算前置自动绑券；单机多标签拼单；返回「主方案（严格最优）」与「凑单参考方案（加一杯饮料/一件小食反而更省）」供选择
- **订单**：仅到店自取，微信登录(openid) + 云端存储，订单列表/详情/取消

## 架构
```
微信小程序 (miniprogram/)
   │  HTTPS
   ▼
Node 后端 (server/, Express + TypeScript)
   ├─ 微信登录：code → code2Session → openid → token
   ├─ 业务 API（门店/优惠券/菜单/图鉴/活动/优惠优化/订单）
   ├─ 定时任务 scheduler：每日 00:00 拉取活动写库
   ├─ 优惠优化模块（auto-bind-coupons 前置 + 枚举套餐/券组合 + calculate-price 比价）
   └─ mcd-mcp 客户端（Streamable HTTP → https://mcp.mcd.cn）
   ▼
mcd-mcp (远程 Streamable HTTP) ──► 麦当劳服务
```
- 小程序无法直接连 mcd-mcp，必须经后端中间层。
- 后端需常驻以触发定时任务。

## 目录
- `server/`  Node 后端（Express + TS + better-sqlite3 + node-cron）
- `miniprogram/`  微信小程序原生前端

## 运行
### 后端
```bash
cd server
npm install
cp .env.example .env   # 填入 WECHAT_APPID/WECHAT_SECRET、MCP_MCD_TOKEN
npm run dev            # tsx watch 热重载
```
### 小程序
用微信开发者工具「导入项目」打开 `miniprogram/` 目录，填入自己的 AppID。

## 环境变量（见 server/.env.example）
| 变量 | 说明 |
|------|------|
| `PORT` | 后端端口，默认 3000 |
| `WECHAT_APPID` / `WECHAT_SECRET` | 微信小程序登录凭证 |
| `MCP_MCD_URL` | mcd-mcp 地址，默认 `https://mcp.mcd.cn` |
| `MCP_MCD_TOKEN` | mcd-mcp 的 Bearer token（从本机 `~/.workbuddy/mcp.json` 的 `mcd-mcp.headers.Authorization` 获取） |
| `DB_PATH` | SQLite 文件路径 |
| `JWT_SECRET` | 登录态签名密钥 |

## 安全
- `.env` 含敏感 token，**已被 .gitignore 忽略，切勿提交**。
- mcd-mcp 的 Bearer token 属于个人/环境凭证，独立部署时请使用你自己的有效 token。
