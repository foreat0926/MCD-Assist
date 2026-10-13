# MCD-Assist 待办清单（TODO）

> 定位：**多人拼单优惠方案「模拟」工具**（H5 网页）——不含真实下单、不涉及支付、无需登录、不收集用户信息。
> 分支工作流：开发/提交/推送一律在 `dev`，`main` 只经 PR/合并进入。
> 最近更新：2026-10-13（方向调整：小程序→H5，去登录/下单/绑券）

## ✅ 已完成
- Phase 0 工程骨架（GitHub 仓库、SSH、git 配置、clone）
- Phase 1 后端骨架（mcp client / db / scheduler / routes / index）
- Phase 2 mcd-mcp 35 工具 schema + 关键返回结构实测，路由按真实契约回填
- Phase 3 优惠优化（optimizer：店面券逐张试算 + 无券回退 + 凑单参考）
- **方向调整**：移除登录/用户体系/真实下单/自动绑券/账号券查询；后端加 CORS
- Phase 4' H5 前端 `web/index.html`（单文件）：选门店、菜单加购(带拼单人标签)、图鉴详情(组成+热量)、优惠券展示、拼单袋→优惠方案(主方案+凑单参考)、活动日历

## 🟠 联调与验证
- [ ] 起后端（`cd server && npm run dev`）+ 浏览器打开 `web/index.html`，跑通：选门店 → 菜单加购 → 拼单袋 → 计算优惠方案
- [ ] 多浏览器/移动端浏览器适配检查（响应式）
- [ ] 用餐时段（早/午/晚）验证 `calculate-price` 对套餐的计价（宵夜等时段部分套餐可能 500 不可售，属正常）
- [ ] 店面券 `query-store-coupons` 有数据时，验证逐券试算选中最优是否正确

## 🟡 功能增强
- [ ] 拼单体验：按拼单人分组汇总/AA 分摊金额展示
- [ ] UI/体验打磨：空状态、加载/错误提示、优惠展示、图鉴营养为空文案
- [ ] 图鉴营养匹配优化：单品可命中热量、套餐多为 null，可考虑按套餐子项聚合估算
- [ ] 凑单参考可扩展：不止 +1 最便宜饮料/小食，可试多种凑单组合

## 🟢 部署与上线
- [ ] 后端部署（需 HTTPS + 备案域名），`web/index.html` 的 `API` 改成线上地址
- [ ] CORS 收紧到前端域名（生产）
- [ ] mcd-mcp token 管理：`server/.env` 的 token 是个人账号的（未入库），部署时考虑存放与安全
- [ ] `dev → main` 合并：稳定后提 PR 合入 `main`

## ⚪ 暂不做
- 真实下单 / 支付 / 登录 / 自动领券 / 账号卡包查询（已按新定位移除）
- 门店排队进展、生活管理模块
- 麦乐送/团餐（当前仅到店自取 beType=1）

---

## 关键契约备忘（联调时对照，避免踩坑）
- **返回格式**：多数工具返回「Markdown + 内嵌 `{"success":...}` JSON」，用 `client.ts` 的 `extractJson` 提取。
- **价格单位两套**：`query-meals` 的 `currentPrice` 是**字符串「元」**（如 "26"）；`calculate-price` 的价格是**整数「分」**（如 5700，需 /100）。
- **商品码字段**：`calculate-price` 用 **`productCode`**；套餐子项 `roundList[].comboItemList[].code`（加购时经 `/api/wiki/detail` 的组成 rounds 生成）。
- **query-nearby-stores**：`searchType=2` 必须**同时传 `city` + `keyword`**；到店 `beType=1` 不传 `beCode`。
- **图鉴数据拼装**：menu(图片/名字) + query-meal-detail(组成 rounds) + list-nutrition-foods(热量，`data` 是 JSON 字符串，换行被转义，需先取外层 JSON 再解析)。
- **优惠来源**：`query-store-coupons`（店面可用券）+ `calculate-price` 逐张带 `couponId/couponCode` 试算；无券则回退标价/套餐优惠。
