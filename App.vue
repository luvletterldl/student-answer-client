<script>
export default {
	globalData: {  
		authStatus: null,
		// 保证全局只有一个音频处于播放状态且录音与播放操作互斥
		audioPlaying: false,
		audioRecording: false,
		currentFillAnswer: { // 当前填空题
			order: 0,
			studentAnswer: ''
		},
		currentQuestionType: '', // 当前题目类型
		source: '', // 题目来源 OA: 公众号 OE：PC网考
		hasHideAction: false, // 考试过程中如果有切屏，分屏，悬浮行为的话，设定为true并弹出警告
		legalHideAction: false, // 是否属于合法的隐藏操作
	}, 
	onLaunch: function() {
		console.log('App Launch');
	},
	onShow: function() {
		const { authStatus, hasHideAction, legalHideAction } = this.$scope.globalData
		console.log('App Show',);
		if (authStatus === true && hasHideAction === true && !legalHideAction) {
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
		this.$scope.globalData.legalHideAction = false
	},
	onHide: function() {
		console.log('App Hide');
		this.$scope.globalData.hasHideAction = true
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
