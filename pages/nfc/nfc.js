// pages/nfc/nfc.js
const util = require("../../utils/util.js");

// WiFi配置数据
const wifiConfig = {
  ssid: "",
  password: ""
};

let discoveryTimer = null;

Page({
  data: {
    isDisabled: false,
    steps: [
      {
        text: '步骤一',
        desc: '请检查 WiFi 名称是否为英文字符！不支持中文！',
      },
      {
        text: '步骤二',
        desc: '请检查 WiFi 密码是否为英文字符！不支持中文！',
      },
      {
        text: '步骤三',
        desc: '点击开始配置后，请将手机靠近NFC线圈，直到显示烧写完成！',
      },
    ],
  },

  onLoad (options) {
    this.initNFC();
  },

  onUnload () {
    this.cleanup();
  },

  // 初始化NFC
  initNFC () {
    try {
      this.nfcAdapter = wx.getNFCAdapter();
      this.ndefInstance = this.nfcAdapter.getNdef();
    } catch (error) {
      console.error('NFC初始化失败:', error);
      wx.showToast({
        title: 'NFC功能不可用',
        icon: 'error'
      });
    }
  },

  // 清理资源
  cleanup () {
    if (discoveryTimer) {
      clearInterval(discoveryTimer);
      discoveryTimer = null;
    }
    this.stopNFCDiscovery();
    if (this.ndefInstance) {
      this.ndefInstance.close();
    }
  },

  // WiFi名称输入
  onWifiSSIDInput (e) {
    wifiConfig.ssid = e.detail.value.trim();
    console.log('WiFi SSID:', wifiConfig.ssid);
  },

  // WiFi密码输入
  onWifiPasswordInput (e) {
    wifiConfig.password = e.detail.value.trim();
    console.log('WiFi Password:', wifiConfig.password);
  },

  // 验证WiFi配置
  validateWifiConfig () {
    if (!wifiConfig.ssid) {
      wx.showToast({
        title: '请输入WiFi名称',
        icon: 'none'
      });
      return false;
    }

    if (!wifiConfig.password) {
      wx.showToast({
        title: '请输入WiFi密码',
        icon: 'none'
      });
      return false;
    }

    // 检查是否包含中文字符
    const chineseRegex = /[\u4e00-\u9fa5]/;
    if (chineseRegex.test(wifiConfig.ssid)) {
      wx.showToast({
        title: 'WiFi名称不支持中文',
        icon: 'none'
      });
      return false;
    }

    if (chineseRegex.test(wifiConfig.password)) {
      wx.showToast({
        title: 'WiFi密码不支持中文',
        icon: 'none'
      });
      return false;
    }

    return true;
  },

  // 开始配置
  startWifiConfiguration () {
    console.log('开始WiFi配置');

    if (!this.validateWifiConfig()) {
      return;
    }

    this.setData({
      isDisabled: true
    });

    const payload = JSON.stringify({
      ssid: wifiConfig.ssid,
      passwd: wifiConfig.password
    });

    const records = [{
      id: util.str2ab(Date.now().toString()),
      type: util.str2ab('t'),
      payload: util.str2ab(payload),
      tnf: 2,
    }];

    this.startNFCDiscoveryLoop(records);
  },

  // 开始NFC发现循环
  startNFCDiscoveryLoop (records) {
    discoveryTimer = setInterval(() => {
      wx.showToast({
        title: "请靠近设备",
        icon: "loading",
        duration: 800
      });

      this.startNFCDiscovery();
      this.connectToNFC(records);
    }, 1000);
  },

  // 启动NFC搜寻
  startNFCDiscovery () {
    if (!this.nfcAdapter) return;

    this.nfcAdapter.startDiscovery({
      success: (res) => {
        console.log('NFC搜寻启动成功');
      },
      fail: (error) => {
        console.error('NFC搜寻启动失败:', error);
      }
    });
  },

  // 连接NFC设备
  connectToNFC (records) {
    if (!this.ndefInstance) return;

    this.ndefInstance.connect({
      success: (res) => {
        wx.showToast({
          title: "已连接设备",
          icon: "success",
          duration: 1000
        });
        this.writeNFCData(records);
      },
      fail: (error) => {
        // 连接失败是正常的，不需要显示错误提示
        console.log('等待NFC设备靠近...');
      }
    });
  },

  // 写入NFC数据
  writeNFCData (records) {
    if (!this.ndefInstance) return;

    wx.showToast({
      title: "正在执行写入",
      icon: "loading"
    });

    this.ndefInstance.writeNdefMessage({
      records: records,
      success: (res) => {
        this.handleWriteSuccess();
      },
      fail: (error) => {
        this.handleWriteFailure(error);
      },
      complete: () => {
        this.cleanup();
      }
    });
  },

  // 处理写入成功
  handleWriteSuccess () {
    wx.showToast({
      title: "写入数据成功",
      icon: "success",
      duration: 2000
    });

    this.setData({
      isDisabled: false
    });

    // 延迟返回上一页
    setTimeout(() => {
      wx.navigateBack({
        delta: 1
      });
    }, 2000);
  },

  // 处理写入失败
  handleWriteFailure (error) {
    console.error('NFC写入失败:', error);

    wx.showToast({
      title: "写入数据失败",
      icon: "error"
    });

    this.setData({
      isDisabled: false
    });
  },

  // 停止NFC搜寻
  stopNFCDiscovery () {
    if (!this.nfcAdapter) return;

    this.nfcAdapter.stopDiscovery({
      success: (res) => {
        console.log('NFC搜寻已停止');
      },
      fail: (error) => {
        console.error('停止NFC搜寻失败:', error);
      }
    });
  }
});