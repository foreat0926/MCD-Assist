const app = getApp();
Page({
  data: {
    city: '上海',
    keyword: '麦当劳',
    stores: [],
    loading: false,
    searched: false
  },
  onLoad() {
    this.search();
  },
  onCity(e) {
    this.setData({ city: e.detail.value });
  },
  onKeyword(e) {
    this.setData({ keyword: e.detail.value });
  },
  async search() {
    this.setData({ loading: true });
    try {
      const q =
        '?city=' + encodeURIComponent(this.data.city) +
        '&keyword=' + encodeURIComponent(this.data.keyword);
      const d = await app.request('/stores/nearby' + q);
      this.setData({ stores: d.stores || [], loading: false, searched: true });
    } catch (e) {
      wx.showToast({ title: '加载失败：' + e, icon: 'none' });
      this.setData({ loading: false, searched: true });
    }
  },
  choose(e) {
    const s = this.data.stores[e.currentTarget.dataset.idx];
    app.setStore({ code: s.storeCode, name: s.storeName });
    wx.showToast({ title: '已选 ' + s.storeName, icon: 'none' });
    setTimeout(() => wx.navigateBack(), 800);
  }
});
