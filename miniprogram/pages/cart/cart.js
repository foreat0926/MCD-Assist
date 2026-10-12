const app = getApp();
Page({
  data: {
    items: [],
    loading: false,
    plan: null,
    reference: null,
    optimizing: false,
    error: ''
  },
  onShow() {
    this.refresh();
  },
  refresh() {
    this.setData({ items: app.globalData.cart.slice(), plan: null, reference: null, error: '' });
  },
  inc(e) {
    app.updateCartQty(e.currentTarget.dataset.code, 1);
    this.refresh();
  },
  dec(e) {
    app.updateCartQty(e.currentTarget.dataset.code, -1);
    this.refresh();
  },
  remove(e) {
    app.removeCartItem(e.currentTarget.dataset.code);
    this.refresh();
  },
  async optimize() {
    if (app.globalData.cart.length === 0) return;
    this.setData({ optimizing: true, error: '' });
    const items = app.globalData.cart.map((c) => ({
      productCode: c.code,
      quantity: c.quantity,
      ...(c.roundList ? { roundList: c.roundList } : {})
    }));
    try {
      const d = await app.request('/optimizer', 'POST', {
        storeCode: app.globalData.store.code,
        items
      });
      app.globalData.lastPlan = d.mainPlan;
      app.globalData.lastReference = d.referencePlan;
      this.setData({
        plan: d.mainPlan,
        reference: d.referencePlan,
        optimizing: false
      });
    } catch (e) {
      this.setData({ error: '优惠计算失败：' + e, optimizing: false });
    }
  },
  checkout() {
    if (!this.data.plan) {
      wx.showToast({ title: '请先点优惠结算', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: '/pages/checkout/checkout' });
  }
});
