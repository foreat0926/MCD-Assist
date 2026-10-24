# MCP 集成说明（MCP_INTEGRATION.md）

本文档说明 MCD-Assist 实际使用的麦当劳 MCP Server、Tool、调用流程与业务价值，供「麦当劳程序员创意开发大赛」资格核验使用。

## 1. 使用的 MCP Server

| 项 | 值 |
|---|---|
| Server 名称 | `mcd-mcp`（麦当劳中国官方 MCP Server） |
| 服务地址 | `https://mcp.mcd.cn` |
| 传输协议 | Streamable HTTP（`streamablehttp`） |
| 鉴权方式 | `Authorization: Bearer <MCP_MCD_TOKEN>`（Token 经麦当劳 MCP 控制台申请） |
| 官方使用指南 | https://github.com/M-China/mcd-mcp-server |
| 接入 SDK | `@modelcontextprotocol/sdk` → `StreamableHTTPClientTransport` |

> 前端（H5）**不直连** mcd-mcp：直连会暴露 Bearer Token 且存在跨域问题，因此全部调用经由自建 Node 后端中间层代理。

## 2. 实际调用的 Tool（共 8 个）

| Tool | 用途 | 代码位置 |
|---|---|---|
| `query-nearby-stores` | 按城市 + 关键词搜索附近门店，返回门店编码、地址、营业状态、营业时段 | `server/src/routes/stores.ts` |
| `query-meals` | 拉取门店在售菜单（早餐/正餐/宵夜时段），含餐品图片、名称、价格、分类 | `server/src/routes/menu.ts`、`wiki.ts`、`optimizer.ts` |
| `query-meal-detail` | 查询单品/套餐详情：套餐组成（rounds/choices）、配料、图片 | `server/src/routes/wiki.ts` |
| `list-nutrition-foods` | 拉取营养数据库（热量、蛋白质、脂肪、碳水、钠、钙），用于单品图鉴 | `server/src/routes/wiki.ts` |
| `available-coupons` | 展示当前可领取的营销活动券（仅展示参考，**不领取**） | `server/src/routes/coupons.ts` |
| `query-store-coupons` | 查询**指定门店**当前可用优惠券，是拼单优惠试算的输入 | `server/src/routes/coupons.ts`、`optimizer.ts` |
| `calculate-price` | 按购物车 + 指定券**试算价格**（不落单），是优惠比价的核心工具 | `server/src/routes/optimizer.ts` |
| `campaign-calendar` | 拉取活动日历，由后端 node-cron 每日 00:00 定时拉取写入 SQLite | `server/src/scheduler/activities.ts` |

## 3. 调用流程

```
用户（H5 网页 web/index.html）
  │  1. 选择门店 / 加购（可标注「拼单人」）
  ▼
Node 后端（Express，server/）
  │  2. REST API：/api/stores /api/menu /api/wiki /api/coupons /api/optimizer /api/activities
  ▼
mcd-mcp 客户端（server/src/mcp/client.ts）
  │  3. StreamableHTTPClientTransport → POST https://mcp.mcd.cn
  │     Header: Authorization: Bearer ${MCP_MCD_TOKEN}
  ▼
mcd-mcp 远程服务 ──► 麦当劳后端
```

关键实现细节（实测踩坑，已固化在代码注释中）：

- **返回格式**：多数 Tool 返回「Markdown 说明 + 内嵌 `{"success":...}` JSON」，客户端内置 `extractJson` 提取结构化数据；需要原文展示的（如 `available-coupons`）走 `callMcpToolText` 取原始文本。
- **价格双单位**：`query-meals` 的 `currentPrice`/`originalPrice` 为**字符串、单位「元」**；`calculate-price` 的 `price`/`productPrice`/`discount`/`productList[].subtotal` 为**整数、单位「分」**，需 `/100` 换算。混用会导致 100 倍价差 bug。
- **门店查询**：`query-nearby-stores` 的 `beType` 必填；按位置搜索（`searchType=2`）时 `city` 与 `keyword` **必须同时非空**（否则报错 600058）。到店场景 `beType=1` 且不传 `beCode`。
- **计价商品码**：`calculate-price` / `create-order` 的商品码字段是 **`productCode`**（不是 `code`）；套餐子项在 `roundList[].comboItemList[].code`。
- **营养数据**：`list-nutrition-foods` 的 `data` 字段是 JSON **字符串**（换行被转义），需先解析外层 JSON 再按行拆分。
- **营业时段**：门店营业时段影响菜单与价格可用性（宵夜部分套餐 `calculate-price` 会失败），前端已按门店营业状态提示。

## 4. 业务价值：多人拼单优惠方案模拟

现实问题：办公室下午茶、朋友聚餐多人拼单时，麦当劳的优惠券规则复杂（每张券适用商品不同、满减门槛不同、互斥关系不明），人工逐张计算容易买贵。

MCD-Assist 的解法（**纯模拟，不涉及真实下单与支付**）：

1. 多人各自加购，系统自动汇总成一张「拼单购物车」；
2. 通过 `query-store-coupons` 取本店当前可用券，通过 `calculate-price` **逐张试算**，给出：
   - **主方案（严格最优）**：试算范围内价格最低的券组合；
   - **凑单参考方案**：在主方案基础上 +1 件最便宜的饮料/小食，看是否触发更高减免；
3. 辅以门店查询、菜单/单品图鉴（组成 + 热量）、可领券展示、活动日历，让拼单决策一站式完成。

## 5. 只读边界（合规自述）

本项目**仅调用公开/只读类能力**：门店查询、菜单/详情/营养查询、价格**试算**、可领券**查询**、活动日历。
**不调用**任何写操作：不下单（`create-order` 等）、不自动领券（`auto-bind-coupons`）、不读取账号卡包/订单，不收集任何用户信息，无需登录。
