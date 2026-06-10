export default defineAppConfig({
  pages: [
    'pages/scan/index',
    'pages/acceptance/index',
    'pages/process/index',
    'pages/finished/index',
    'pages/rectification/index',
    'pages/trace/index',
    'pages/acceptance-add/index',
    'pages/process-add/index',
    'pages/finished-add/index',
    'pages/finished-recheck/index',
    'pages/rectification-add/index',
    'pages/rectification-detail/index'
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
        pagePath: 'pages/process/index',
        text: '过程检查'
      },
      {
        pagePath: 'pages/finished/index',
        text: '成品抽检'
      },
      {
        pagePath: 'pages/rectification/index',
        text: '整改'
      }
    ]
  }
})
