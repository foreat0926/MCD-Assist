const app = getApp();
Page({
  data: {
    available: [],
    loading: true
  },
  onShow() {
    this.load();
  },
  async load() {
    this.setData({ loading: true });
    try {
      const d = await app.request('/coupons');
      this.setData({ available: d.available || [], loading: false });
    } catch (e) {
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败：' + e, icon: 'none' });
    }
  }
});
