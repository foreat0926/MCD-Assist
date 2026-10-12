const app = getApp();
Page({
  data: {
    categories: [],
    loading: true,
    hasStore: false
  },
  onShow() {
    const has = !!app.globalData.store.code;
    this.setData({ hasStore: has });
    if (has) this.load();
    else this.setData({ loading: false });
  },
  async load() {
    this.setData({ loading: true });
    try {
      const d = await app.request('/wiki?storeCode=' + app.globalData.store.code);
      this.setData({ categories: d.categories || [], loading: false });
    } catch (e) {
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败：' + e, icon: 'none' });
    }
  },
  chooseStore() {
    wx.navigateTo({ url: '/pages/stores/stores' });
  },
  toDetail(e) {
    wx.navigateTo({ url: '/pages/wiki-detail/wiki-detail?code=' + e.currentTarget.dataset.code });
  }
});
