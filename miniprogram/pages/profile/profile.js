const app = getApp();
Page({
  data: {
    loggedIn: false,
    openid: '',
    storeName: '',
    binding: false
  },
  onShow() {
    this.setData({
      loggedIn: !!app.globalData.token,
      openid: app.globalData.openid,
      storeName: app.globalData.store.name
    });
  },
  login() {
    wx.login({
      success: async (res) => {
        if (!res.code) return;
        try {
          const d = await app.request('/auth/login', 'POST', { code: res.code });
          app.setToken(d.token, d.openid);
          this.setData({ loggedIn: true, openid: d.openid });
          wx.showToast({ title: '登录成功', icon: 'none' });
        } catch (e) {
          wx.showToast({ title: '登录失败：' + e, icon: 'none' });
        }
      }
    });
  },
  logout() {
    app.setToken('');
    this.setData({ loggedIn: false, openid: '' });
  },
  async autoBind() {
    this.setData({ binding: true });
    try {
      await app.request('/coupons/auto-bind', 'POST', {});
      wx.showToast({ title: '已一键领取', icon: 'none' });
    } catch (e) {
      wx.showToast({ title: '领券失败：' + e, icon: 'none' });
    }
    this.setData({ binding: false });
  },
  goOrders() {
    wx.navigateTo({ url: '/pages/orders/orders' });
  },
  goStores() {
    wx.navigateTo({ url: '/pages/stores/stores' });
  }
});
