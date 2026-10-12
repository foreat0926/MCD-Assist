# MCD-Assist 待办清单（TODO）

> 计划文件：`~/.workbuddy/plans/quantum-nebula-newton-t9UFLVY.md`（v5）
> 分支工作流：开发/提交/推送一律在 `dev`，`main` 只经 PR/合并进入。
> 最近更新：2026-10-12

## ✅ 已完成
- Phase 0 工程骨架（GitHub 仓库、SSH、git 配置、clone）
- Phase 1 后端骨架（mcp client / db / auth / scheduler / routes / index）
- Phase 2 mcd-mcp 35 工具 schema + 关键返回结构实测，路由按真实契约回填
- Phase 3 优惠优化（optimizer：基准价 + 逐券试算 + 凑单参考，已提前实现）
- Phase 4 小程序前端 10 页面（index/stores/menu/cart/checkout/wiki/wiki-detail/coupons/profile/orders）
- Git：后端 + 前端均已提交并推送到 `origin/dev`（c5c10c5、9b6e1e0）

## 🔴 阻塞项（需用户提供/决策）
- [ ] 微信 **AppID / Secret** 填入 `server/.env` 的 `WECHAT_APPID` / `WECHAT_SECRET`（登录 code2Session、DevTools/真机预览前提）
- [ ] 是否接**微信支付**：取决于 `create-order` 返回是否带支付参数（见 Phase 5 实测后决策）

## 🟠 联调与验证（Phase 5）
- [ ] WeChat DevTools 跑通全流程：首页 → 选门店 → 菜单 → 加购 → 拼单袋 → 优惠结算 → 下单 → 订单
      - `baseUrl` 默认 `http://localhost:3000/api`（后端需在 3000 端口启动）
- [ ] 真机预览：把 `app.js` 的 `baseUrl` 改成电脑局域网 IP（如 `http://192.168.x.x:3000/api`）
- [ ] `create-order` **用餐时段实测**（早餐/午餐 + 有有效券），确认返回结构、是否含微信支付参数
      - ⚠️ 涉及真实下单金额，务必由用户明确触发
- [ ] 套餐下单验证：宵夜等时段部分套餐 `calculate-price` 会 500（时段库存），需在正常用餐时段确认带 `roundList` 的套餐能正常计价/下单

## 🟡 功能增强
- [ ] 多人拼单「添加人」细化：按「单机多标签」支持多人各自独立标记/汇总
- [ ] UI/体验打磨：空状态、加载/错误提示、价格/优惠展示、图鉴营养为空文案
- [ ] 图鉴营养匹配优化：单品可命中热量、套餐多为 null，可考虑按套餐子项聚合估算

## 🟢 部署与上线（Phase 6）
- [ ] **HTTPS + 合法域名**：真机网络请求要求后端有备案域名 + HTTPS，确认部署方式（服务器/云托管）
- [ ] `dev → main` 合并：联调稳定后提 PR 合入 `main`
- [ ] mcd-mcp token 管理：`server/.env` 的 token 是个人账号的（未入库），后端部署时考虑存放与安全

## ⚪ 暂不做
- 门店排队进展、生活管理模块（Phase 7）
- 麦乐送/团餐（当前 MVP 仅到店自取 beType=1）

---

## 关键契约备忘（联调时对照，避免踩坑）
- **返回格式**：多数工具返回「Markdown + 内嵌 `{"success":...}` JSON」，用 `client.ts` 的 `extractJson` 提取。
- **价格单位两套**：`query-meals` 的 `currentPrice` 是**字符串「元」**（如 "26"）；`calculate-price` 的价格是**整数「分」**（如 5700，需 /100）。
- **商品码字段**：`calculate-price`/`create-order` 用 **`productCode`**（不是 code）；套餐子项 `roundList[].comboItemList[].code`。
- **query-nearby-stores**：`searchType=2` 必须**同时传 `city` + `keyword`**；到店 `beType=1` 不传 `beCode`。
- **图鉴数据拼装**：menu(图片/名字) + query-meal-detail(组成 rounds) + list-nutrition-foods(热量，`data` 是 JSON 字符串，换行被转义，需先取外层 JSON 再解析)。
- **鉴权**：小程序请求带 `Authorization: Bearer <token>`；token 由 `POST /api/auth/login` 签发。
