const app = getApp();
Page({
  data: {
    categories: [],
    loading: true,
    storeName: '',
    cartCount: 0
  },
  onShow() {
    this.setData({ storeName: app.globalData.store.name, cartCount: app.cartCount() });
    if (!app.globalData.store.code) {
      wx.redirectTo({ url: '/pages/stores/stores' });
      return;
    }
    this.loadMenu();
  },
  async loadMenu() {
    this.setData({ loading: true });
    try {
      const d = await app.request('/menu?storeCode=' + app.globalData.store.code);
      this.setData({ categories: d.categories || [], loading: false });
    } catch (e) {
      wx.showToast({ title: '加载失败：' + e, icon: 'none' });
      this.setData({ loading: false });
    }
  },
  async add(e) {
    const m = e.currentTarget.dataset.meal;
    await app.addToCart({ code: m.code, name: m.name, image: m.image, price: m.currentPrice });
    this.setData({ cartCount: app.cartCount() });
    wx.showToast({ title: '已加入', icon: 'none' });
  },
  toDetail(e) {
    wx.navigateTo({ url: '/pages/wiki-detail/wiki-detail?code=' + e.currentTarget.dataset.code });
  },
  toCart() {
    wx.navigateTo({ url: '/pages/cart/cart' });
  }
});
