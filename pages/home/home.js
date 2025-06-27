// pages/home/home.js

// 路由配置
const ROUTES = {
  CTRL: '/pages/ctrl/ctrl',
  ENV: '/pages/env1/env1',
  NFC: '/pages/nfc/nfc'
};

Page({
  data: {
    menuItems: [
      {
        id: 'ctrl',
        title: '控制界面',
        icon: 'control',
        color: '#007AFF'
      },
      {
        id: 'env',
        title: '环境监测',
        icon: 'monitor',
        color: '#34C759'
      },
      {
        id: 'nfc',
        title: 'NFC配网',
        icon: 'wifi',
        color: '#FF9500'
      },
      {
        id: 'settings',
        title: '系统设置',
        icon: 'settings',
        color: '#8E8E93'
      }
    ]
  },

  onLoad (options) {
    this.checkAppVersion();
  },

  onShow () {
    this.refreshPageStatus();
  },

  handleNavigation (event) {
    const { id } = event.currentTarget.dataset;

    switch (id) {
      case 'ctrl':
        this.navigateToPage(ROUTES.CTRL);
        break;
      case 'env':
        this.navigateToPage(ROUTES.ENV);
        break;
      case 'nfc':
        this.navigateToPage(ROUTES.NFC);
        break;
      case 'settings':
        this.showComingSoon();
        break;
      default:
        console.warn('未知的导航目标:', id);
    }
  },

  navigateToPage (url) {
    wx.navigateTo({
      url,
      fail: (err) => {
        console.error('页面跳转失败:', err);
        wx.showToast({
          title: '页面跳转失败',
          icon: 'error'
        });
      }
    });
  },

  // 显示开发中提示
  showComingSoon () {
    wx.showToast({
      title: '功能开发中',
      icon: 'none',
      duration: 2000
    });
  },

  // 检查应用版本
  checkAppVersion () {
    const systemInfo = wx.getSystemInfoSync();
    console.log('系统信息:', systemInfo);
  },

  // 刷新页面状态
  refreshPageStatus () {
    // 可以在这里检查网络状态、设备连接状态等
    const networkType = wx.getNetworkType({
      success: (res) => {
        console.log('网络类型:', res.networkType);
      }
    });
  },

  // 兼容旧版本的跳转方法 （以防万一）
  goto_ctrl () {
    this.navigateToPage(ROUTES.CTRL);
  },

  goto_env () {
    this.navigateToPage(ROUTES.ENV);
  },

  goto_nfc () {
    this.navigateToPage(ROUTES.NFC);
  },

  goto_settings () {
    this.showComingSoon();
  },

});