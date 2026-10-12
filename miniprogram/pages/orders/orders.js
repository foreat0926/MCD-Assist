const app = getApp();
Page({
  data: {
    orders: [],
    loading: true,
    loggedIn: false
  },
  onShow() {
    const li = !!app.globalData.token;
    this.setData({ loggedIn: li });
    if (li) this.load();
    else this.setData({ loading: false });
  },
  async load() {
    this.setData({ loading: true });
    try {
      const d = await app.request('/orders');
      this.setData({ orders: d || [], loading: false });
    } catch (e) {
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败：' + e, icon: 'none' });
    }
  },
  fmt(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    const p = (n) => (n < 10 ? '0' + n : '' + n);
    return (
      d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
      ' ' + p(d.getHours()) + ':' + p(d.getMinutes())
    );
  },
  goProfile() {
    wx.switchTab({ url: '/pages/profile/profile' });
  }
});
