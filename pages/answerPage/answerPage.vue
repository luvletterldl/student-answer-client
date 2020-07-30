<template>
	<view class="container">
		<class-top-base-info
			:answerGuideIndex='answerGuideIndex'
			:className='className'
			:courseName='courseName'
			:currentLessonNumber='currentLessonNumber'
		/>
		<view class="answer-panel">
			<view class="topic-switch" :style="answerGuideIndex === 1 ? 'z-index: 101' : 'z-index: 2'">
				<image @click='switchTopic(false)' src='../../static/images/icon_prevTopic.png' class='switcher' />
				<view class='topicProcess'>
					<view class='process'>
						<text class="time-limit"><text class="cdtime">{{ currentTopicTimeCost }}</text>/{{ fmtSecToMin(currentTopic.timeLimit) }}</text>
						<text class='currentIndex'>{{ questionList.length > 0 ? currentTopicIndex + 1 : 0 }}/{{ questionList.length }}</text>
					</view>
					<view @click="showOrHideTopicOverview" class='viewAll'>
						<text v-if="duration !== null">剩余时间：{{ remineTime }}</text>
						<text>{{ showTopicTab ? '点击收起总览' : '点击查看总览' }}</text>
					</view>
				</view>
				<image @click='switchTopic(true)' src='../../static/images/icon_nextTopic.png' class='switcher' />
			</view>
			<view v-if="showTopicTab === true" class="topic-tab">
				<view class='topic-index'>
					<view @click='chooseQuestion(index)' v-for="(item, index) in questionList" :key="index" class="item">
						<view>{{ index + 1 }}</view>
					</view>
				</view>
			</view>
			<view class="topic-list" :style="answerGuideIndex === 2 ? 'z-index: 101' : 'z-index: 0'">
				<view v-if="currentTopic.hasSub === true" class="topic-body">
					<view class="ques-top-body">
						<text class="ques-type">{{ fmtQuestionType }}</text>
						<text class="quest-index">{{ currentTopicIndex + 1 }}、</text>
						<rich-text class="questBody" :nodes="fmtRichTextImg(currentTopic.quesBody)" />
						<custom-audio v-if="currentTopic.audioLink !== null && currentTopic.audioLink !== ''" :audioSrc="currentTopic.audioLink" />
						<topic-body
							v-for="(ques, index) in currentTopic.subQuestions"
							:key="index"
							:subQuesIndex="index"
							:questionIndex='index'
							:question='ques'
							v-on:updateQuestionList='updateQuestionList'
							:examId='examId'
							:examRecordDataId='examRecordDataId'
							:userId='userId'
							:studentId='studentId'
							:time='timeLimitList[currentTopicIndex]'
							:storeFlag='storeFlag'
							v-on:storedTopic='storedTopic'
							:submitFlag='submitFlag'
							v-on:updateSubmitFlag='updateSubmitFlag'
							:showSpokenAnswer='showSpokenAnswer'
							v-on:showExitBtnAction='showExitBtnAction'
						/>
					</view>
				</view>
				<view v-else-if="currentTopic.hasSub === false" class="topic-body">
					<topic-body
						:question='currentTopic'
						:questionIndex="currentTopicIndex"
						v-on:updateQuestionList='updateQuestionList'
						:examId='examId'
						:examRecordDataId='examRecordDataId'
						:userId='userId'
						:studentId='studentId'
						:time='timeLimitList[currentTopicIndex]'
						:storeFlag='storeFlag'
						v-on:storedTopic='storedTopic'
						:submitFlag='submitFlag'
						v-on:updateSubmitFlag='updateSubmitFlag'
						:showSpokenAnswer='showSpokenAnswer'
						v-on:showExitBtnAction='showExitBtnAction'
					/>
				</view>
			</view>
			<view class="submit-store" :style="answerGuideIndex === 3 ? 'z-index: 101' : 'z-index: 10'">
				<button @click="submitTopic" class="submit-topic">上交</button>
				<button @click="storeTopic" class="store-submit">暂存</button>
			</view>
		</view>
		<default-answer-page-view v-if="showDefaultView" />
		<view v-if="showExitBtn" class="exit">
			<navigator class="exitBtn" open-type="exit" target="miniProgram">退出答题</navigator>
		</view>
		<auth-login
			:account='account'
			:needLogin='needLogin'
			v-on:authLoginSuccess='authLoginSuccess'
		/>
		<answer-guide
			:showAnswerGuide='showAnswerGuide'
			v-on:answerGuideChangeStep='answerGuideChangeStep'
			v-on:hideAnswerGuide='hideAnswerGuide'
		/>
	</view>
</template>

<script>
import ClassTopBaseInfo from '../../components/ClassTopBaseInfo/ClassTopBaseInfo';
import CustomAudio from '../../components/CustomAudio/CustomAudio';
import RecorderPanel from '../../components/RecorderPanel/RecorderPanel'
import TopicBody from '../../components/TopicBody/TopicBody'
import AuthLogin from '../../components/AuthLogin/AuthLogin'
import AnswerGuide from '../../components/CustomGuide/AnswerGuide'
import DefaultAnswerPageView from '../../components/DefaultAnswerPageView/DefaultAnswerPageView'
import { QuestionType, ChoiceOption } from '../../lib/Enumerate';
import { formatQuestionType, formatSecondToHHmmss, formatRichTextImg } from '../../lib/Utils';
import Main from '../../lib/Main';
import { findClsAndCourseByClassIdAndCourseId, pageAssignment, startExam, getQuestions, findExamQuestionList, examSubmit, currentServerTime, endExam, examHeartbeat, header, restartExam, checkExamInProgress } from '../../lib/Api'
export default {
	components: {
		ClassTopBaseInfo,
		CustomAudio,
		RecorderPanel,
		TopicBody,
		DefaultAnswerPageView,
		AuthLogin,
		AnswerGuide,
	},
	data() {
		return {
			showDefaultView: true, // 占位组件
			showExitBtn: false, // 答题完毕后退出小程序
			userId: 0,
			courseId: 0,
			lessonId: 0,
			id: 0,
			studentId: 0,
			examRecordDataId: 0,
			examId: 0,
			className: '',
			courseName: '',
			currentLessonNumber: '',
			showAnswerPanel: false, // 展示答题面板
			showTopicTab: false, // 展示题目Tab
			assignmentInfo: {}, 
			questionList: [], // 题目列表
			currentTopicIndex: 0, // 当前题目索引
			QuestionType: {}, // 题目类型
			ChoiceOption: [],
			selectedOptions: [], // 选择题选中的索引列表
			boolStudentAnswer: null, // 判断题
			timeLimitList: [], // 限时列表
			duration: null, // 剩余考试时间（分钟）
			durationSeconds: 1, // 剩余考试时间（秒）
			remineTime: '', // 剩余考试时间
			timer: 0, // 计时器,
			countdownTimer: 0, // 考试剩余时间计时器
			storeFlag: false, // 暂存标识
			submitFlag: -1, // 提交标识 默认状态：-1；上交作业中： 0；上交完毕： 1
			isAnswering: null, // true: 表明已经在其他终端开始作答，本终端不能上交； false: 在本终端开启作答，可以在本终端上交
			restart: null, // 是否是重刷
			account: null, // 用户的账户
			needLogin: false, // 是否需要先进行用户认证
			showAnswerGuide: false, // 是否显示答题引导,
			answerGuideIndex: -1, // 当前引导的步骤
			showSpokenAnswer: 1, // 1:实时显示口语题答案 0:不实时显示口语题
      source: '', // OE OA
		}
	},
	computed: {
		// 当前题目
		currentTopic() {
			if (this.questionList === null || this.questionList === [] || this.questionList === undefined) {
				return ''
			} else {
				// 改变全局变量中的当前题目类型
				getApp().globalData.currentQuestionType = this.questionList.length > 0 ? this.questionList[this.currentTopicIndex].questionType : ''
				return this.questionList.length > 0 ? this.questionList[this.currentTopicIndex] : ''
			}
		},
		// 题目类型
		fmtQuestionType() {
		 	return formatQuestionType(this.currentTopic)
		},
		// 当前题目耗时
		currentTopicTimeCost() {
			return this.fmtSecToMin(this.timeLimitList[this.currentTopicIndex])
		}
	},
	watch: {
		// 如果是套题 需要把submitFlag数组元素全部重置为-1
		currentTopicIndex: {
			handler(newIndex, oldIndex) {
				if (this.questionList.length > 0) {
					this.submitFlag = -1
					console.log('submitFlag', this.submitFlag)
				}
			}
		},
		// 如果全部提交成功就交卷
		submitFlag: {
			handler(newFlag, oldFlag) {
				if (typeof newFlag === 'number' && newFlag === 1) {
					console.log('watch submitFlag number', newFlag)
					this.submitTopicAction()
				}
			}
		},
		// 如果有总限时的话到时自动交卷
		durationSeconds: {
			handler(newSec, oldSec) {
				if (newSec <= 0 && this.duration !== null) {
					uni.showToast({
						title: '答题时间到！',
						icon: 'none'
					})
					this.endExamAction()
				}
			}
		}
	},
	onLoad(options) {
		console.log('invoked onLoad')
		// 判断是否是第一次使用
		if (uni.getStorageSync('answerGuide') === '') {
			this.startAnswerGuide()
		}
		// 保持屏幕常亮
		uni.setKeepScreenOn({
			keepScreenOn: true
		})
		this.QuestionType = QuestionType
		this.ChoiceOption = ChoiceOption
		// 调试时打开这句注释下句
		const url = 'https://test.xiaocongkj.com/?token=44840a386a1645dab4e1399ec0cd5a12&key=U_E_17_11937&userId=11937&studentId=11968&examId=2640&mainNum=1&className=0722一班&courseName=0722课堂练习&currentLessonNumber=第3课次&isAnswering=false&account=15911111114&source=OE&examType=K12_CLASSROOM_EXERCISES'
		// const url = decodeURIComponent(options.q)
		const q = decodeURIComponent(url)
		console.log('options', q)
		const getParams = (url) => {
			if (url === undefined) {
				return ''
			} else if (url !== '') {
				console.log('url', url)
				let paramsList = url.split('?')[1]
				Main.host = url.split('?')[0]
				if (paramsList) {
					paramsList = paramsList.split('&')
				} else {
					throw new Error(`没有合适的传参: url: ${url}, options.q: ${options.q}`)
					return
				}
				let params = {}
				paramsList.forEach((v, i) => {
					params[v.split('=')[0]] = v.split('=')[1]
				})
				return params
			} else {
				return ''
			}
		}
		let p = undefined
		if (q !== undefined && q !== '' && q !== null) {
		 	p = getParams(q)
		} else {
			return false
		}
		if (
			'token' in p &&
			'key' in p &&
			'mainNum' in p &&
			'className' in p &&
			'courseName' in p &&
			'currentLessonNumber' in p &&
			'examId' in p &&
			// 'examRecordDataId' in p &&
			'studentId' in p &&
			'userId' in p &&
			'isAnswering' in p &&
			'source' in p &&
			'examType' in p
		) {
			this.showDefaultView = false
			const {token, key, mainNum, className, currentLessonNumber, courseName, examId, studentId, userId, isAnswering, source, examType } = p
			this.currentTopicIndex = Number(mainNum) - 1
			this.className = className
			this.courseName = courseName
			this.currentLessonNumber = currentLessonNumber
			this.examId = Number(examId)
			// this.examRecordDataId = Number(examRecordDataId)
			this.studentId = Number(studentId)
			this.userId = Number(userId)
			this.isAnswering = isAnswering
			this.examType = examType
			getApp().globalData.source = source // 全局指定题目来源
			this.source = source
			if ('restart' in p && p.restart === 'true') {
				this.restart = true
			}
			header.key = key
			header.token = token
			if (this.account !== null) {
				return
			} else {
				if (isAnswering === 'false' && 'account' in p) {
					this.account = p.account
					this.needLogin = true
				} else {
					this.initExam()
				}
			}
		} else {
			this.showDefaultView = true
		}
	},
	onShow() {
		const currentFillAnswer = getApp().globalData.currentFillAnswer
		if (currentFillAnswer.order !== 0) {
			const params = JSON.stringify({order: currentFillAnswer.order, studentAnswer: currentFillAnswer.studentAnswer})
			this.updateQuestionList(params)
		}
	},
  beforeDestroy() {
		clearInterval(this.timer)
		clearInterval(this.countdownTimer)
  },
	methods: {
		initExam(){
      if (this.source === 'OE') {
				if (this.isAnswering === 'true') {
					this.startOrRestartAction()
				} else {
					this.examInProgressHandler()
				}
      } else if (this.source === 'OA') {
        this.startOrRestartAction()
      }
		},
		examInProgressHandler() {
			checkExamInProgress().then((res) => {
				console.log('checkExamInProgress', res)
				if (this.examType === 'K12_ONLINE_EXAM' && res.showSoe !== undefined) {
					this.showSpokenAnswer = res.showSoe
				}
				if (res.examId === this.examId) {
					if (res.isExceed) {
						uni.showToast({
							title: `超出最大断点续考次数(${res.maxInterruptNum}),正在自动交卷...`,
							icon: 'none'
						})
						setTimeout(() => {
							this.endExamAction()
						}, 2000)
					} else {
						uni.showToast({
							title: '正在进入断点续考...',
							icon: 'none'
						})
						findExamQuestionList(this.examId, this.userId).then((res) => {
							this.examRecordDataId = res[0].examRecordDataId
						})
						examHeartbeat(this.examId).then((resp) => {
							console.log('examHeartbeat', resp)
							this.durationSeconds = resp / 1000
							this.duration = Math.floor(this.durationSeconds / 60)
							this.countdownTimer = setInterval(() => {
								this.durationSeconds -= 1
								const remineTime = formatSecondToHHmmss(this.durationSeconds)
								this.remineTime = `${remineTime.hour}:${remineTime.min}:${remineTime.second}`
							}, 1000)
						})
						this.updateQuestionList().then(() => {
							this.timeLimitList = new Array(this.questionList.length).fill(0)
							this.timer = setInterval(() => {
								const newTime = this.timeLimitList[this.currentTopicIndex] + 1
								this.timeLimitList.splice(this.currentTopicIndex, 1, newTime)
							}, 1000)
						})
					}
				} else {
					this.startOrRestartAction()
				}
			})
		},
    startOrRestartAction() {
      if (this.restart === true) {
      	restartExam(this.examId, this.userId).then((res) => {
      		this.startOrRestartExamCallback(res)
      	})
      } else {
      	startExam(this.examId, this.userId).then((res) => {
      		this.startOrRestartExamCallback(res)
      	})
      }
    },
		startOrRestartExamCallback(res) {
			console.log('startExam', res)
			if (res.code !== undefined && res.code !== '0' && res.code !== 0) {
			} else {
				this.examRecordDataId = res.examRecordDataId
				this.duration = res.duration
				if (this.examType === 'K12_ONLINE_EXAM') {
					this.showSpokenAnswer = res.showSoe
				}
				if (res.duration !== null) {
					this.durationSeconds = res.duration * 60
					this.countdownTimer = setInterval(() => {
						this.durationSeconds -= 1
						const remineTime = formatSecondToHHmmss(this.durationSeconds)
						this.remineTime = `${remineTime.hour}:${remineTime.min}:${remineTime.second}`
					}, 1000)
				}
				this.updateQuestionList().then(() => {
					this.timeLimitList = new Array(this.questionList.length).fill(0)
					this.timer = setInterval(() => {
						const newTime = this.timeLimitList[this.currentTopicIndex] + 1
						this.timeLimitList.splice(this.currentTopicIndex, 1, newTime)
					}, 1000)
				})
			}
		},
		updateQuestionList(params) {
			console.log('updateQuestionList params', params)
			if (params) {
				const data = JSON.parse(params)
				const questionList = JSON.parse(JSON.stringify(this.questionList))
				questionList.forEach((ques, i) => {
					if (ques.hasSub) {
						const subQuestions = ques.subQuestions
						subQuestions.forEach((subQues, j, arr) => {
							if (data.order === subQues.order) {
								console.log(data, subQues)
								subQuestions[j].studentAnswer = data.studentAnswer
								if (subQuestions[j].questionType === QuestionType.SPOKEN_ANSWER_QUESTION) {
									subQuestions[j].evaluation = data.evaluation
								}
								this.questionList.splice(i, 1, questionList[i])
								console.log(this.questionList)
							}
						})
					} else {
						if (data.order === ques.order) {
							questionList[i].studentAnswer = data.studentAnswer
							if (questionList[i].questionType === QuestionType.SPOKEN_ANSWER_QUESTION) {
								questionList[i].evaluation = data.evaluation
							}
							this.questionList.splice(i, 1, questionList[i])
						}
					}
				})
				getApp().globalData.currentFillAnswer.order = 0 // 刷新questionList后重置currentFillAnswer
				// this.questionList = questionList
				console.log('questionList', questionList)
			} else {
				return getQuestions(this.examId, this.userId).then((res) => {
					console.log('getQuestions', res)
					if (res.code === "E_K12-OE_S2001") {
						uni.showToast({
							title: res.desc,
							icon: 'none'
						})
						return
					} else {
						this.questionList = res.data
					}
				})
			}
		},
		// 左右切换题目
		switchTopic(dir) {
			const audioPlaying = getApp().globalData.audioPlaying
			const audioRecording = getApp().globalData.audioRecording
			if (audioPlaying || audioRecording) {
				let title = ''
				if (audioPlaying) {
					title = '请先暂停音频播放'
				} else if (audioRecording) {
					title = '请先结束录音'
				}
				uni.showToast({
					title: title,
					icon: 'none'
				})
				return false
			} else {
				let newIndex = this.currentTopicIndex
				const questionList = this.questionList
				const questionLength = this.questionList.length
				dir ? newIndex += 1 : newIndex -= 1
				if (newIndex > questionLength - 1) {
					this.currentTopicIndex = 0
					// this.order = questionList[0].order
				} else if (newIndex < 0) {
					this.currentTopicIndex = questionLength - 1
					// this.order = questionList[this.currentTopicIndex].order
				} else {
					this.currentTopicIndex = newIndex
					// this.order = questionList[newIndex].order
				}
			}
		},
		// 展示或隐藏总览
		showOrHideTopicOverview() {
			this.showTopicTab = this.showTopicTab ? false : true
		},
		// 选择某一题
		chooseQuestion(index) {
			this.currentTopicIndex = index
			this.showOrHideTopicOverview()
		},
		// 对富文本中的图片进行处理
		fmtRichTextImg(nodes) {
			return formatRichTextImg(nodes)
		},
		// 倒计时
		fmtSecToMin(time) {
			if (this.timeLimitList.length > 0) {
				const fmtTime = formatSecondToHHmmss(time)
				return `${fmtTime.min}:${fmtTime.second}`
			} else {
				return '0:0'
			}
		},
		storedTopic() {
			this.storeFlag = false
		},
    storeTopic() {
			// this.storeFlag = true
			this.switchTopic(true)
			uni.showToast({
				title: '暂存成功',
				icon: 'success'
			})
    },
		submitTopic() {
			if (this.isAnswering === 'true' || this.isAnswering === true) {
				uni.showModal({
					title: '提示',
					content: '请在原终端进行提交!',
          showCancel: false,
				})
        return false
			}
			console.log('submitTopic', this.submitFlag)
			if (this.submitFlag === -1) {
				this.submitFlag = 0
			// } else if (typeof this.submitFlag === 'object') {
			// 	this.submitFlag = new Array(this.submitFlag.length).fill(0)
			// } else if (this.submitFlag === true) {
			// 	this.submitTopicAction()
			} else {
				this.submitTopicAction()
			}
		},
		updateSubmitFlag(data) {
			console.log('updateSubmitFlag', data, this.submitFlag)
			if (this.submitFlag === 0) {
				this.submitFlag = 1
			}
		},
		endExamAction() {
			uni.showLoading({
				title: '上交中...'
			})
			endExam(this.examId, this.userId).then((res) => {
				uni.hideLoading()
				if (res.code === 'E_K12-OE_M3001') {
					uni.showToast({
						title: res.desc,
						icon: 'none'
					})
					return
				} else {
					uni.showToast({
						title: '提交成功',
						icon: 'success',
					})
					clearInterval(this.countdownTimer)
					clearInterval(this.timer)
					this.showExitBtnAction()
					if (typeof this.submitFlag === 'number') {
						this.submitFlag = -1
					}
				}
				console.log('endExam', res)
			})
		},
		showExitBtnAction(){
			this.showExitBtn = true
		},
		submitTopicAction() {
			const that = this
			uni.showModal({
				title: '确定要上交吗',
				content: '作业上交后将无法继续作答，如需继续作答，请切换至下一题',
				confirmText: '上交',
        success(res) {
          if (res.confirm) {
            that.endExamAction()
          }
          if (res.cancel) {
						uni.showModal({
							title: '提示',
							content: '是否需要查看操作指引？',
							confirmText: '需要',
							cancelText: '不需要',
              success(resp) {
                if (resp.confirm) {
                  that.startAnswerGuide()
                }
              }
						})
						console.log(that.submitFlag)
            if (that.submitFlag === 1) {
            	that.submitFlag = -1
            }
          }
        }
			})
		},
		// 用户认证成功回调
		authLoginSuccess() {
			this.needLogin = false
			this.initExam()
		},
		startAnswerGuide() {
			this.showAnswerGuide = true
			this.answerGuideChangeStep(0)
		},
		answerGuideChangeStep(index) {
			this.answerGuideIndex = index
		},
		hideAnswerGuide() {
			this.answerGuideIndex = -1
			this.showAnswerGuide = false
			uni.setStorageSync('answerGuide', '1')
		}
	}
}
</script>

<style lang="scss" scoped>
.answer-panel {
  .topic-switch {
    display: flex;
    flex-flow: row;
    width: 90vw;
    background: #FFF;
    border-radius: 3vw;
    margin: 2vw 5vw;
    padding: 3vw 5vw;
    align-items: center;
		justify-content: space-between;
		position: sticky;
		top: 0;
		z-index: 2;
		box-shadow: 0px 0px 10px 0px #dce4f6;
    .switcher {
      width: 8vw;
			height: 8vw;
			flex-shrink: 0;
    }
    .topicProcess {
      font-size: 4vw;
      color: #9098B4;
      display: flex;
      justify-content: space-around;
      flex-flow: column;
      align-items: center;
      .currentIndex {
        color: #36415C;
			}
			.process, .viewAll {
				width: 100%;
				display: flex;
				flex-flow: row nowrap;
				justify-content: space-evenly;
				align-items: center;
				width: 65vw;
				.cdtime {
					color: #FF5D66;
					&::before {
						content: '';
						position: absolute;
						width: 4vw;
						height: 4vw;
						background: url('../../static/images/icon_timeLimit.png') no-repeat;
						background-size: 100% 100%;
						margin: .8vw 5vw 0 -5vw;
					}
				}
			}
    }
  }
	.topic-tab {
		background: #FFF;
		box-shadow: 0px 0px 10px 0px rgba(220,228,246,1);
		font-family:Arial-BoldMT,Arial;
		font-weight: normal;
		width: 90vw;
		margin: 3vw 5vw;
		padding: 2vw;
		border-radius: 3vw;
		display: flex;
		flex-flow: column;
		text-align: center;
		position: sticky;
		top: 17vw;
		z-index: 2;
		.topic-index {
			display: flex;
			flex-wrap: wrap;
			color: #666D88;
			.item, .correct, .error {
				width: 10vw;
				height: 10vw;
				border-radius: 50%;
				display: flex;
				justify-content: center;
				align-items: center;
				border: 1px solid #F3F6FC;
				font-size: normal;
				margin: 2vw;
			}
			.correct {
				color: #13C6B2;
				border: 1px solid #13C6B2;
			}
			.error {
				color: #FF5D66;
				border: 1px solid #FF5D66;
			}
			.selected {
				color: #4184FF;
				background: rgba(112,166,255,0.2);
				border: 1px solid #70A6FF;
			}
		}
	}
	.topic-list {
		position: relative;
		z-index: 0;
		box-shadow: 0px 0px 10px 0px rgba(220,228,246,1);
		width: 90vw;
		margin: 2vw 5vw 15vh 5vw;
		background: #FFF;
		border-radius: 8px;
		color: $blackcolor;
		.ques-top-body {
			padding: 3vw;
			// background: linear-gradient(135deg, #4edbab 0%, #90e2a9 100%);
			background: #FFF;
			border-radius: 8px 8px 0 0;
			border-bottom: $default-bgcolor 1px solid;
			.ques-type {
				padding: 1vw 1.5vw;
				border-radius: 20px;
				// border: solid 1px #f7ff00;
				// color: #f7ff00;
			}
			.questBody {
				margin: 10px;
			}
		}
		.options, .fill-blank {
			display: flex;
			flex-flow: column;
			color: #666D88;
			.option {
				display: flex;
				flex-flow: row;
				padding: 3vw 4vw;
				align-items: center;
				.option-index {
					margin-right: 2vw;
					display: flex;
					flex-flow: row;
					justify-content: center;
					align-items: center;
					flex-shrink: 0;
					width: 8vw;
					height: 8vw;
					border-radius: 100%;
					color: #ACB9D1;
					background:linear-gradient(315deg,rgba(216,225,243,1) 0%,rgba(243,246,252,1) 100%);
				}
				.selected-option {
					color: #FFF;
					background: $default-bluelinearbg;
				}
				.fill-topic-img {
					border-radius: 2vw;
        	border: 1px solid #F3F6FC;
				}
			}
		}
		.true-false {
			display: flex;
			flex-flow: row;
			justify-content: space-evenly;
			padding: 1vw;
			.correct, .error {
				color: #FFF;
				font-size: 4.2vw;
				padding: 2.5vw 8vw 2.5vw 15vw;
				background: rgba(6, 6, 6, .3);
				border-radius: 5vw;
				&::before {
					content: '';
					position: absolute;
					margin: 1vw 0 0 -6vw;
					background: url('../../static/images/icon_correct.png') no-repeat;
					width: 5vw;
					height: 4vw;
					background-size: 100% 100%;
				}
			}
			.error::before {
				content: '';
				position: absolute;
				margin: 1vw 0 0 -6vw;
				background: url('../../static/images/icon_error.png') no-repeat;
				width: 4.2vw;
				height: 4.3vw;
				background-size: 100% 100%;
			}
			.upToCorrect {
				background: $default-bluelinearbg;
			}
			.upToError {
				background:linear-gradient(180deg,rgba(255,143,140,1) 0%,rgba(255,111,119,1) 100%);
			}
		}
	}
	.submit-store {
		display: flex;
		flex-flow: row nowrap;
		align-items: center;
		justify-content: space-around;
		position: fixed;
		bottom: 0;
		width: 100vw;
		padding: 5vw;
		background: #FFF;
		left: 0;
		z-index: 10;
		.submit-topic, .store-submit {
			padding: 0 15vw;
			color: #FFF;
			border-radius: 10vw;
			border: none;
		}
		.store-submit {
			background:linear-gradient(180deg,rgba(215,222,241,1) 0%,rgba(193,205,229,1) 100%);
		}
		.submit-topic {
			background: $default-bluelinearbg;
		}
	}
}
.exit {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 201;
  background: rgba(0,0,0, .3);
  display: flex;
  align-items: center;
  justify-content: center;
  .exitBtn {
    color: #FFF;
    padding: 2vw 10vw;
    border-radius: 8vw;
    background: $default-bluelinearbg;
  }
}
</style>