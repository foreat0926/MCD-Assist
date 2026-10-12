App({
  globalData: {
    baseUrl: 'http://localhost:3000/api',
    token: '',
    openid: ''
  },
  onLaunch() {
    const token = wx.getStorageSync('token');
    if (token) this.globalData.token = token;
  }
});
