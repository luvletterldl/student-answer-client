<script>
import { unLockTerminal, listeningOnHideInExam } from './lib/Api'
import Main from './lib/Main'
import { ExamType } from './lib/Enumerate';
export default {
	globalData: {  
		authStatus: null, // 认证状态
		// 保证全局只有一个音频处于播放状态且录音与播放操作互斥
		audioPlaying: false,
		audioRecording: false,
		currentFillAnswer: { // 当前填空题
			order: 0,
			studentAnswer: ''
		},
		isAnswering: null, // 其他终端是否正在考试中
		examRecordDataId: 0,
		currentQuestionType: '', // 当前题目类型
		currentExamType: '', // 当前考试类型
		source: '', // 题目来源 OA: 公众号 OE：PC网考
		hasHideAction: false, // 考试过程中如果有切屏，分屏，悬浮行为的话，设定为true并弹出警告
		legalHideAction: false, // 是否属于合法的隐藏操作
		onHideLeaveTime: 0, // 小程序切到后台时记录下时间戳（秒）
		// onShowReturnTime: 0, // 小程序切回前台时记录下时间戳（秒）
	}, 
	onLaunch: function() {
		console.log('App Launch');
    // #ifdef MP-WEIXIN
		uni.setKeepScreenOn({ keepScreenOn: true }) // 保持屏幕常亮
    // #endif
	},
	onShow: function() {
    // #ifdef MP-WEIXIN
		const { authStatus, examRecordDataId, hasHideAction, legalHideAction, isAnswering, currentExamType, onHideLeaveTime } = this.$scope.globalData
		console.log('App Show', isAnswering);
		/**
		 * 认证状态为true， 有Hide动作， 不是合法的Hide操作，当前考试类型是线上考试
		 */
		if (authStatus === true && hasHideAction === true && !legalHideAction && currentExamType === ExamType.K12_ONLINE_EXAM) {
			if (!isAnswering) {
				const returnTime = Math.floor(Date.now() / 1000)
				listeningOnHideInExam(onHideLeaveTime, returnTime, returnTime - onHideLeaveTime, null, Main.examId, examRecordDataId, Main.userId).then((res) => {
					console.log('listeningOnHideInExam', res)
				})
				uni.showModal({
					title: '提示',
					content: '考试过程中严禁使用分屏、切屏或浮窗等功能，您的行为已违规被记录，请谨慎操作！',
					showCancel: false,
				}).then((res) => {
					if (res[1].confirm) {
						this.$scope.globalData.hasHideAction = false
					}
				})
			}
		}
		this.$scope.globalData.legalHideAction = false
    // #endif
	},
	onHide: function() {
		console.log('App Hide');
		this.$scope.globalData.hasHideAction = true
		this.$scope.globalData.onHideLeaveTime = Math.floor(Date.now() / 1000)
		const { isAnswering, examRecordDataId, legalHideAction } = this.$scope.globalData
		// 如果合法操作就不触发unLock
		if (isAnswering && examRecordDataId !== 0 && legalHideAction === false) {
			unLockTerminal(examRecordDataId).then((res) => {
				if (res.code === '0') {
					this.$scope.globalData.authStatus = false // 触发showExitBtn
				}
			})
		}
	},
  onUnload: function() {
    console.log('App Unload')
    unLockTerminal(this.$scope.globalData.examRecordDataId).then((res) => {
    	if (res.code === '0') {
    		this.$scope.globalData.authStatus = false // 触发showExitBtn
    	}
    })
  }
};
</script>

<style lang="scss">
/* 注意要写在第一行，同时给style标签加入lang="scss"属性 */
@import "uview-ui/index.scss";
</style>
<style>
/* 解决头条小程序组件内引入字体不生效的问题 */
/* #ifdef MP-TOUTIAO */
@font-face {
	font-family: uniicons;
	src: url('/static/uni.ttf');
}
/* #endif */
</style>
