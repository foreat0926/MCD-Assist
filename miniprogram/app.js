App({
  globalData: {
    // 开发期后端地址：WeChat 开发者工具中可用 localhost；真机预览需改成电脑局域网 IP（如 http://192.168.x.x:3000/api）
    baseUrl: 'http://localhost:3000/api',
    token: '',
    openid: '',
    store: { code: '', name: '' }, // 当前选中的门店
    cart: [], // 拼单购物袋：{ code,name,image,price,quantity,roundList?,by }
    itemCache: {} // code -> { roundList, image, name, nutrition }
  },

  onLaunch() {
    const token = wx.getStorageSync('token');
    if (token) this.globalData.token = token;
    const store = wx.getStorageSync('store');
    if (store && store.code) this.globalData.store = store;
    const cart = wx.getStorageSync('cart');
    if (Array.isArray(cart)) this.globalData.cart = cart;
  },

  /** 统一请求封装：自动带 Bearer token，返回 Promise<data> */
  request(path, method = 'GET', data = {}) {
    const app = this;
    return new Promise((resolve, reject) => {
      const header = { 'content-type': 'application/json' };
      if (app.globalData.token) header['Authorization'] = 'Bearer ' + app.globalData.token;
      wx.request({
        url: app.globalData.baseUrl + path,
        method,
        data,
        header,
        success: (res) => {
          if (res.statusCode >= 200 && res.statusCode < 300) resolve(res.data);
          else reject(res.data && res.data.error ? res.data.error : ('HTTP ' + res.statusCode));
        },
        fail: (err) => reject(err.errMsg || 'network error')
      });
    });
  },

  setToken(token, openid) {
    this.globalData.token = token || '';
    if (openid) this.globalData.openid = openid;
    if (token) wx.setStorageSync('token', token);
  },

  setStore(store) {
    this.globalData.store = store;
    wx.setStorageSync('store', store);
  },

  /** 拉取并缓存单品详情（组成 rounds -> roundList，用于下单/优惠计算） */
  async ensureDetail(code) {
    const cache = this.globalData.itemCache;
    if (cache[code] && cache[code].roundList) return cache[code];
    const storeCode = this.globalData.store.code;
    if (!storeCode) return null;
    try {
      const d = await this.request('/wiki/detail?storeCode=' + storeCode + '&code=' + code);
      const composition = d.composition || [];
      const roundList = composition.map((r) => ({
        comboItemList: [
          (r.choices.find((c) => c.isDefault) || r.choices[0] || {}).code
        ]
          .filter(Boolean)
          .map((c) => ({ code: c }))
      }));
      const info = { roundList, image: d.image, name: d.name, nutrition: d.nutrition };
      cache[code] = info;
      return info;
    } catch {
      return null;
    }
  },

  /** 加入拼单：code 必填，其余可选；有 roundList 则带上 */
  async addToCart(item) {
    const detail = await this.ensureDetail(item.code);
    const roundList = detail && detail.roundList && detail.roundList.length ? detail.roundList : undefined;
    const cart = this.globalData.cart;
    const exist = cart.find((c) => c.code === item.code);
    if (exist) {
      exist.quantity += 1;
    } else {
      cart.push({
        code: item.code,
        name: item.name || (detail && detail.name) || '',
        image: item.image || (detail && detail.image) || '',
        price: item.price || 0,
        quantity: 1,
        by: item.by || '我',
        ...(roundList ? { roundList } : {})
      });
    }
    this.saveCart();
    return cart;
  },

  updateCartQty(code, delta) {
    const cart = this.globalData.cart;
    const i = cart.findIndex((c) => c.code === code);
    if (i < 0) return;
    cart[i].quantity += delta;
    if (cart[i].quantity <= 0) cart.splice(i, 1);
    this.saveCart();
  },

  removeCartItem(code) {
    this.globalData.cart = this.globalData.cart.filter((c) => c.code !== code);
    this.saveCart();
  },

  saveCart() {
    wx.setStorageSync('cart', this.globalData.cart);
  },

  clearCart() {
    this.globalData.cart = [];
    wx.removeStorageSync('cart');
  },

  cartCount() {
    return this.globalData.cart.reduce((s, c) => s + c.quantity, 0);
  }
});
