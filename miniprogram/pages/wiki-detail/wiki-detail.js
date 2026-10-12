const app = getApp();
Page({
  data: {
    code: '',
    detail: null,
    loading: true
  },
  onLoad(q) {
    this.setData({ code: q.code || '' });
  },
  onShow() {
    if (this.data.code) this.load();
  },
  async load() {
    if (!app.globalData.store.code) return;
    this.setData({ loading: true });
    try {
      const d = await app.request(
        '/wiki/detail?storeCode=' + app.globalData.store.code + '&code=' + this.data.code
      );
      this.setData({ detail: d, loading: false });
    } catch (e) {
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败：' + e, icon: 'none' });
    }
  }
});
