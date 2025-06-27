// pages/env1/env1.js

const g_value = {
  IP: '',
  PORT: 7788,
  flag: {
    on_off: true,
  },
  message: {
    turn: {
      on: '{"carStatus":"on"}'
    }
  }
};

let udp = null;

Page({
  data: {
    temp: 0,
    humi: 0,
    ir: 0,
    als: 0,
    ps: 0,
    inputValue: ''
  },

  // UDP消息处理
  onUdpMessage (res) {
    console.log(res);

    if (res.remoteInfo.size <= 0) return;

    try {
      const unit8Arr = new Uint8Array(res.message);
      const encodedString = String.fromCharCode.apply(null, unit8Arr);
      const decodedString = decodeURIComponent(escape(encodedString));
      const json = JSON.parse(decodedString);

      // 一次性更新所有数据！！！
      const updateData = {};

      // 温湿度数据
      if (json.sht20) {
        if (json.sht20.temp) {
          updateData.temp = json.sht20.temp.toFixed(1);
        }
        if (json.sht20.humi) {
          updateData.humi = json.sht20.humi.toFixed(1);
        }
      }

      // 传感器数据
      if (json.ap3216) {
        if (json.ap3216.ps) {
          updateData.ps = json.ap3216.ps;
        }
        if (json.ap3216.ir) {
          updateData.ir = json.ap3216.ir;
        }
        if (json.ap3216.als) {
          updateData.als = json.ap3216.als;
        }
      }

      // 只调用一次setData！！！！！！！！！
      this.setData(updateData);

    } catch (e) {
      console.error('UDP消息解析失败:', e);
    }
  },

  // 发送UDP消息
  sendUDP (ip) {
    if (!ip) return;

    udp.send({
      address: ip,
      port: g_value.PORT,
      message: g_value.message.turn.on
    });
  },

  // 页面加载
  onLoad (options) {
    udp = wx.createUDPSocket();
    udp.bind();
    udp.onMessage(this.onUdpMessage.bind(this));

    // 读取本地IP
    const savedIP = wx.getStorageSync('IP');
    if (savedIP) {
      g_value.IP = savedIP;
      this.setData({ inputValue: savedIP });
      this.sendUDP(savedIP);
    }
  },

  // 返回上一页
  goback (res) {
    if (res.detail) {
      wx.navigateTo({
        url: '../home/home',
      });
    }
  },

  // 返回主页
  gobackToHome () {
    wx.navigateBack({
      delta: 1
    });
  },

  // IP地址输入处理
  onchange_setcarIP (res) {
    const ip = res.detail.value;
    console.log('输入IP:', ip);

    g_value.IP = ip;
    wx.setStorageSync('IP', ip);
    this.sendUDP(ip);
  },
});