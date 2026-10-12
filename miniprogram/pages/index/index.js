const app = getApp();
Page({
  data: {
    activities: [],
    loading: true,
    storeName: ''
  },
  onShow() {
    this.setData({ storeName: app.globalData.store.name });
    this.fetchActivities();
  },
  chooseStore() {
    wx.navigateTo({ url: '/pages/stores/stores' });
  },
  goMenu() {
    if (!app.globalData.store.code) {
      wx.navigateTo({ url: '/pages/stores/stores' });
    } else {
      wx.navigateTo({ url: '/pages/menu/menu' });
    }
  },
  goWiki() {
    wx.switchTab({ url: '/pages/wiki/wiki' });
  },
  goCoupons() {
    wx.switchTab({ url: '/pages/coupons/coupons' });
  },
  goProfile() {
    wx.switchTab({ url: '/pages/profile/profile' });
  },
  fetchActivities() {
    app.request('/activities')
      .then((d) => this.setData({ activities: d || [], loading: false }))
      .catch(() => this.setData({ loading: false }));
  }
});
