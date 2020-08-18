let debug = true
// let debug = false
// if (process.env.NODE_ENV === 'development') {
//   debug = true
// }
// class MainWrapper {
//   public static getInstance() {
//     if (!MainWrapper.instance) {
//       MainWrapper.instance = new MainWrapper()
//     }
//     return MainWrapper.instance
//   }

//   private static instance: MainWrapper

//   host: string

//   acToken: string

//   accountPasswordData: string

//   rootOrgId: string

//   rememberPW: string

//   key: string

// }
// const Main = MainWrapper.getInstance()
let Main = {}
Main.host = ''
Main.examId = 0
Main.userId = 0
// Main.userInfo = 'userInfo'
// Main.studentInfo = 'studentInfo'
// Main.accountPasswordData = 'apdata'
// Main.rememberPW = 'rememberPW'

// if (debug) {
//   Main.host = 'https://test.xiaocongkj.com/'
// } else {
//   Main.host = 'https://kxjma.520haoxue.com'
// }
export default Main
