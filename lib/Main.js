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
Main.userInfo = 'userInfoz'
Main.studentInfo = 'studentInfo'
Main.accountPasswordData = 'apdata'
Main.rememberPW = 'rememberPW'

if (debug) {
  Main.host = 'http://haoxue.qmth.com.cn/'
} else {
  Main.host = 'https://kxjma.520haoxue.com'
}
export default Main
