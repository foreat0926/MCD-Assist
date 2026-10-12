Page({
  data: {
    activities: [],
    loading: true
  },
  onLoad() {
    this.fetchActivities();
  },
  fetchActivities() {
    const app = getApp();
    wx.request({
      url: app.globalData.baseUrl + '/activities',
      success: (res) => {
        this.setData({ activities: res.data || [], loading: false });
      },
      fail: () => {
        this.setData({ loading: false });
      }
    });
  }
});
