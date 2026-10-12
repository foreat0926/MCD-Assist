const app = getApp();
Page({
  data: {
    plan: null,
    items: [],
    submitting: false,
    result: null,
    storeName: ''
  },
  onLoad() {
    this.setData({
      plan: app.globalData.lastPlan,
      items: app.globalData.cart.slice(),
      storeName: app.globalData.store.name
    });
  },
  async submit() {
    if (!app.globalData.token) {
      wx.showToast({ title: '请先在「我的」登录', icon: 'none' });
      return;
    }
    if (app.globalData.cart.length === 0) {
      wx.showToast({ title: '购物袋是空的', icon: 'none' });
      return;
    }
    this.setData({ submitting: true });
    const items = app.globalData.cart.map((c) => ({
      productCode: c.code,
      quantity: c.quantity,
      ...(c.roundList ? { roundList: c.roundList } : {})
    }));
    try {
      const d = await app.request('/orders', 'POST', {
        storeCode: app.globalData.store.code,
        orderType: 1,
        beType: 1,
        items
      });
      this.setData({ submitting: false, result: d });
      app.clearCart();
      wx.showToast({ title: '下单成功', icon: 'none' });
    } catch (e) {
      this.setData({ submitting: false });
      wx.showToast({ title: '下单失败：' + e, icon: 'none' });
    }
  },
  viewOrders() {
    wx.redirectTo({ url: '/pages/orders/orders' });
  },
  login() {
    wx.switchTab({ url: '/pages/profile/profile' });
  }
});
