// pages/control/control.js
const g_value = {
  IP: '',
  PORT: 7788,
  flag: { on_off: true },
  message: {
    trun: {
      on: '{"carStatus":"on"}',
      off: '{"carStatus":"off"}',
      run: '{"carStatus":"run"}',
      back: '{"carStatus":"back"}',
      left: '{"carStatus":"left"}',
      right: '{"carStatus":"right"}',
      stop: '{"carStatus":"stop"}',
    },
    auto_Mode: { on: '{"autoMode": 1}', off: '{"autoMode": 0}' },
    rgb_Mode: { on: '{"autorgb": 1}', off: '{"autorgb": 0}' },
    bzu_Mode: { on: '{"autobzu": 1}', off: '{"autobzu":0}' },
    led_Mode: { on: '{"autoled": 1}', off: '{"autoled": 0}' },
    fan_Mode: { on: '{"autofan": 1}', off: '{"autofan": 0}' },
    set_gears: {
      low: '{"carSpeed":"low"}',
      middle: '{"carSpeed":"middle"}',
      high: '{"carSpeed":"high"}',
    },
    temp: 0,
    humi: 0,
  }
};
let udp = null;

Page({
  data: {
    temp: 0,
    humi: 0,
    chargt: true,
    Value: {
      power: 0,
      speed: 0,
      gears: 0,
    }
  },

  // 通用UDP发送
  sendUDP (message) {
    if (!g_value.IP) return;
    udp.send({
      address: g_value.IP,
      port: g_value.PORT,
      message
    });
  },

  // 只做一次setData
  onUdpMessage (res) {
    if (res.remoteInfo.size > 0) {
      const unit8Arr = new Uint8Array(res.message);
      const encodedString = String.fromCharCode.apply(null, unit8Arr);
      const decodedString = decodeURIComponent(escape(encodedString));
      let json;
      try {
        json = JSON.parse(decodedString);
      } catch (e) {
        console.error('JSON解析失败', e);
        return;
      }
      const speed = json.carSpeed?.left
        ? (((json.carSpeed.left * 1000) / 1936) * 0.2).toFixed(1)
        : 0;
      const power = json.carPower
        ? (json.carPower / 12280 * 100).toFixed(0)
        : 0;
      const temp = json.sht20?.temp
        ? json.sht20.temp.toFixed(1)
        : 0;
      const humi = json.sht20?.humi
        ? json.sht20.humi.toFixed(1)
        : 0;

      this.setData({
        Value: { ...this.data.Value, power, speed },
        temp,
        humi,
        chargt: power == 0
      });
    }
  },

  onLoad () {
    udp = wx.createUDPSocket();
    udp.bind();
    udp.onMessage(this.onUdpMessage.bind(this));
    // 读取本地IP
    const savedIP = wx.getStorageSync('IP');
    if (savedIP) g_value.IP = savedIP;
  },

  onTemp () {
    this.sendUDP(g_value.message.temp);
  },

  onGotoNfc () {
    wx.navigateTo({ url: '../nfc/nfc' });
  },

  // 控制类方法
  handleSwitch (res, type, onMsg, offMsg, nameKey, onLabel, offLabel, flagKey) {
    if (!g_value.flag.on_off) return;
    const isOn = res.detail?.value ?? res.currentTarget?.dataset?.set;
    this.sendUDP(isOn ? onMsg : offMsg);
    if (nameKey) {
      this.setData({
        Value: { ...this.data.Value, [nameKey]: isOn ? onLabel : offLabel },
        ...(flagKey ? { [flagKey[isOn ? 0 : 1]]: true, [flagKey[isOn ? 1 : 0]]: false } : {})
      });
    }
  },

  onButtonBizhang (res) {
    this.handleSwitch(
      res,
      'auto_Mode',
      g_value.message.auto_Mode.on,
      g_value.message.auto_Mode.off,
      'bizhang_name',
      '开启',
      '关闭'
    );
  },

  onButtonRgb (res) {
    this.handleSwitch(
      res,
      'rgb_Mode',
      g_value.message.rgb_Mode.on,
      g_value.message.rgb_Mode.off
    );
  },

  onButtonFan (res) {
    this.handleSwitch(
      res,
      'fan_Mode',
      g_value.message.fan_Mode.on,
      g_value.message.fan_Mode.off
    );
  },

  onButtonLed (res) {
    this.handleSwitch(
      res,
      'led_Mode',
      g_value.message.led_Mode.on,
      g_value.message.led_Mode.off,
      'led_name',
      'led开启',
      'led关闭',
      ['flag3', 'flag4']
    );
  },

  onButtonBuzzer (res) {
    this.handleSwitch(
      res,
      'bzu_Mode',
      g_value.message.bzu_Mode.on,
      g_value.message.bzu_Mode.off,
      'led_name',
      '蜂鸣器开启',
      '蜂鸣器关闭',
      ['flag5', 'flag6']
    );
  },

  onButtonStartCar (res) {
    const isOn = res.detail.value;
    g_value.flag.on_off = isOn;
    this.sendUDP(isOn ? g_value.message.trun.on : g_value.message.trun.off);
    this.setData({
      Value: { ...this.data.Value, link_name: isOn ? '启动' : '关闭' }
    });
  },

  // 方向控制
  onButtonTurnLeftStart () {
    this.sendUDP(g_value.message.trun.left);
  },
  onButtonTurnLeftEnd () {
    setTimeout(() => this.sendUDP(g_value.message.trun.stop), 100);
  },
  onButtonTurnRightStart () {
    this.sendUDP(g_value.message.trun.right);
  },
  onButtonTurnRightEnd () {
    setTimeout(() => this.sendUDP(g_value.message.trun.stop), 100);
  },
  onButtonTurnRunStart () {
    this.sendUDP(g_value.message.trun.run);
  },
  onButtonTurnRunEnd () {
    setTimeout(() => this.sendUDP(g_value.message.trun.stop), 100);
  },
  onButtonTurnBackStart () {
    this.sendUDP(g_value.message.trun.back);
  },
  onButtonTurnBackEnd () {
    setTimeout(() => this.sendUDP(g_value.message.trun.stop), 100);
  },

  // 档位
  onChangeSetGears (res) {
    const gearMsg = [g_value.message.set_gears.low, g_value.message.set_gears.middle, g_value.message.set_gears.high];
    if (gearMsg[res.detail] !== undefined) {
      this.sendUDP(gearMsg[res.detail]);
    }
  },

  // IP输入
  onChangeSetCarIp (res) {
    g_value.IP = res.detail.value;
    this.sendUDP(g_value.message.trun.on);
    wx.setStorageSync('IP', g_value.IP);
  },
});