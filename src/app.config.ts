export default defineAppConfig({
  pages: [
    'pages/scan/index',
    'pages/acceptance/index',
    'pages/inspection/index',
    'pages/rectification/index',
    'pages/trace/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#0FC6C2',
    navigationBarTitleText: '质量追溯',
    navigationBarTextStyle: 'white',
    backgroundColor: '#F5F6F7'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#0FC6C2',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/scan/index',
        text: '扫码'
      },
      {
        pagePath: 'pages/acceptance/index',
        text: '验收'
      },
      {
        pagePath: 'pages/inspection/index',
        text: '检验'
      },
      {
        pagePath: 'pages/rectification/index',
        text: '整改'
      },
      {
        pagePath: 'pages/trace/index',
        text: '追溯'
      }
    ]
  }
})
