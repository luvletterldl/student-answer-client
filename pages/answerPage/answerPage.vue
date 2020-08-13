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
		<view v-if="showExitBtn" class="exit u-flex u-col-center u-row-around">
			<navigator class="exitBtn" open-type="exit" target="miniProgram">退出答题</navigator>
			<text v-if="canRestart" @click="restartAction(true)" class="exitBtn">重做</text>
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
		<cover-view v-if="cameraCtx !== null" @touchmove='cameraTouchMove' :style='{top: cameraTop, right: cameraRight}' class="snap-camera">
			<camera
				v-if="cameraCtx !== null"
				class="capture-face"
				device-position='front'
				flash='off'
				@error='binderror'
				@initdone='bindinitdone'
			/>
		</cover-view>
		<before-exam-camera
			v-if="faceCheckStatus"
			:examRecordDataId='examRecordDataId'
			:account='account'
			:cameraCtx='cameraCtx'
			v-on:initExam='initExam'
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
import BeforeExamCamera from '../../components/BeforeExamCamera/BeforeExamCamera'
import { QuestionType, ChoiceOption } from '../../lib/Enumerate';
import { parseParamsFromUrl, formatQuestionType, formatSecondToHHmmss, formatRichTextImg, authCameraTips } from '../../lib/Utils';
import Main from '../../lib/Main';
import { findClsAndCourseByClassIdAndCourseId, pageAssignment, startExam, getQuestions, findExamQuestionList, examSubmit, currentServerTime, endExam, examHeartbeat, header, restartExam, checkExamInProgress, uploadImageToAliOss, comparePortrait, lockTerminalLock, uploadFaceToAliOss, isFaceCheck, examFaceEnable, examFaceCheck } from '../../lib/Api'
const { windowWidth, windowHeight } = uni.getSystemInfoSync()
export default {
	components: {
		ClassTopBaseInfo,
		CustomAudio,
		RecorderPanel,
		TopicBody,
		DefaultAnswerPageView,
		BeforeExamCamera,
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
			QuestionType, // 题目类型
			questionType: '', // 传进来的题目类型，如果isAnswering是true，过滤掉除此之外的其他类型的题目
			ChoiceOption,
			selectedOptions: [], // 选择题选中的索引列表
			boolStudentAnswer: null, // 判断题
			timeLimitList: [], // 限时列表
			duration: null, // 剩余考试时间（分钟）
			durationSeconds: 1, // 剩余考试时间（秒）
			remineTime: '', // 剩余考试时间
			timer: 0, // 计时器,
			countdownTimer: 0, // 考试剩余时间计时器
			snapshotTimer: 0, // 抓拍计时器
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
			examType: '', // 考试类型,
			canRestart: false, // 是否展示可以重做
			cameraCtx: null, // 获取相机实例
			cameraTop: '0vh', // 悬浮相机距离顶部距离
			cameraRight: '0vw', // 悬浮相机距离右侧距离
			beforeExamFaceEnable: false, // 是否开启监考
			beforeExamFaceCheck: false, // 是否要在登录后考试前进行人脸检查
			faceCheckStatus: false, // 人脸检测是否展示
		}
	},
	computed: {
		// 当前题目
		currentTopic() {
			if (this.questionList === null || this.questionList.length === 0 || this.questionList === undefined || this.questionList[this.currentTopicIndex] === undefined) {
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
		// 如果是套题 需要把submitFlag重置为-1
		currentTopicIndex(newIndex, oldIndex) {
			this.questionList.length > 0 ? this.submitFlag = -1 : console.log('submitFlag', this.submitFlag)
		},
		// 如果全部提交成功就交卷
		submitFlag(newFlag, oldFlag) {
			typeof newFlag === 'number' && newFlag === 1 ? this.submitTopicAction() : console.log('watch submitFlag number', newFlag)
		},
		// 如果有总限时的话到时自动交卷
		durationSeconds(newSec, oldSec) {
			newSec <= 0 && this.duration !== null ? () => {
				uni.showToast({
					title: '答题时间到！',
					icon: 'none'
				})
				this.endExamAction()
			} : () => {}
		},
		// 当开始或者重开或者断点续考之后获取人脸识别对比数据
		examRecordDataId(newId, oldId) {
			getApp().globalData.examRecordDataId = newId !== 0 ? newId : 0 // 更新全局数据
		}
	},
	onLoad(options) {
		// this.beforeExamFaceCheck = true
		uni.getStorageSync('answerGuide') === '' ? this.startAnswerGuide() : () => {} // 判断是否是第一次使用
		uni.setKeepScreenOn({ keepScreenOn: true }) // 保持屏幕常亮
		// 调试时打开这句注释下句
		const url = 'https://test.xiaocongkj.com/?token=29cc010c6cd44d43885f83fbdc0eef71&key=U_E_17_11933&userId=11933&studentId=11964&examId=2686&mainNum=1&className=0731一班&courseName=0731教研一（考试）&currentLessonNumber=第3课次&isAnswering=false&account=15911111109&source=OE&examType=Exercise&restart=false'
		// const url = decodeURIComponent(options.q)
		const q = decodeURIComponent(url)
		console.log('options', q)
		const p = q !== undefined && q !== '' && q !== null ? parseParamsFromUrl(q) : ''
		if (
			'token' in p &&
			'key' in p &&
			'mainNum' in p &&
			'className' in p &&
			'courseName' in p &&
			// 'currentLessonNumber' in p &&
			'examId' in p &&
			// 'examRecordDataId' in p &&
			'studentId' in p &&
			'userId' in p &&
			'isAnswering' in p &&
			'source' in p
		) {
			const { token, key, mainNum, className, currentLessonNumber, courseName, examId, studentId, userId, isAnswering, source } = p
			header.key = key
			header.token = token
			this.showDefaultView = false
			this.currentTopicIndex = Number(mainNum) - 1
			this.className = className
			this.courseName = courseName
			this.currentLessonNumber = currentLessonNumber
			this.examId = Number(examId)
			this.examRecordDataId = 'examRecordDataId' in p ? Number(p.examRecordDataId) : 0
			this.studentId = Number(studentId)
			this.userId = Number(userId)
			this.isAnswering = isAnswering === 'true' ? true : isAnswering === 'false' ? false : null
			this.source = source
			// 如果属于预习，作业，进门测，课堂练习中的一种则当前考试可以重做
			this.examType = 'examType' in p ? p.examType : ''
			this.canRestart = ['Assignment', 'Preview', 'Enter', 'Exercise'].includes(this.examType) ? true : false
			this.restart = 'restart' in p && p.restart === 'true' ? true : null // 如果restart是true，则赋值
			this.questionType = 'questionType' in p && this.isAnswering ? p.questionType : ''
			getApp().globalData.isAnswering = this.isAnswering
			getApp().globalData.source = source // 全局指定题目来源
			getApp().globalData.authStatus = this.isAnswering ? true : null // 如果isAnswing是true，则全局验证字段为true
			if (this.account === null) {
				if (!this.isAnswering && 'account' in p) {
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
		clearInterval(this.snapshotTimer)
  },
	methods: {
		// 考试初始化
		initExam() {
			this.faceCheckStatus = false
			if (this.source === 'OE' && this.isAnswering) {
				if (this.examRecordDataId === 0) {
					findExamQuestionList(this.examId, this.userId).then((res) => {
						this.examRecordDataId = res[0].examRecordDataId
						if (this.isAnswering) {
							this.lockTerminalAction()
						}
					})
				} else {
					this.lockTerminalAction()
				}
			} else {
				this.examInProgressHandler()
			}
		},
		// 锁终端操作，成功后继续考试
		lockTerminalAction() {
			lockTerminalLock(this.userId, this.studentId, this.examId, this.examRecordDataId, this.examType, this.questionType).then((resp) => {
				console.log('lockTerminalLock', resp)
				// 加锁成功后加载考试的数据，开始作答
				this.continueExam()
			})
		},
		// 检测当前考试是否需要断点续考
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
						this.snapshotHandler(res.snapshotInterval)
						this.continueExam()
					}
				} else {
					this.startOrRestartAction()
				}
			})
		},
		// 继续考试
		continueExam() {
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
		},
		// 开始或者重做
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
		// 重做
		restartAction(isEndExam) {
			clearInterval(this.countdownTimer)
			clearInterval(this.timer)
			if (isEndExam) {
				restartExam(this.examId, this.userId).then((resp) => {
					this.questionList = []
					this.currentTopicIndex = 0
					this.startOrRestartExamCallback(resp)
					this.showExitBtn = false
					getApp().globalData.authStatus = true
				})
			} else {
				uni.showModal({
					title: '提示',
					content: '当前答案会被上交，确定要重做吗？',
					success: (res) => {
						if (res.confirm) {
							clearInterval(this.timer)
							clearInterval(this.countdownTimers)
							console.log('confirm')
							this.endExamAction(true).then(() => {
								restartExam(this.examId, this.userId).then((resp) => {
									this.questionList = []
									this.currentTopicIndex = 0
									this.startOrRestartExamCallback(resp)
									uni.showToast({
										title: '开始重做',
										icon: 'success'
									})
									this.showOrHideTopicOverview()
									getApp().globalData.authStatus = true
								})
							})
						}
					}
				})
			}
		},
		// 开始或者重做的回调
		startOrRestartExamCallback(res) {
			console.log('startExam', res)
			if (res.code !== undefined && res.code !== '0' && res.code !== 0) {
			} else {
				const { examRecordDataId, duration, showSoe, snapshotInterval } = res
				this.examRecordDataId = examRecordDataId
				this.duration = duration
				this.snapshotHandler(snapshotInterval)
				if (this.examType === 'K12_ONLINE_EXAM') {
					this.showSpokenAnswer = showSoe
				}
				if (duration > 0) {
					this.durationSeconds = duration * 60
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
		// 更新考试题目列表数据
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
				console.log('questionList', questionList)
			} else {
				return getQuestions(this.examId, this.userId).then((res) => {
					console.log('getQuestions', res)
					const { code, data } = res
					if (code === "E_K12-OE_S2001") {
						uni.showToast({ title: desc, icon: 'none' })
						return
					} else {
						// 如果是从网考答题中扫码进来过滤出扫码题目类型的题
						const type = this.questionType
						if (this.isAnswering && type !== '') {
							this.questionList = data.filter((question) => {
								if (question.hasSub) {
									const subQuesList = question.subQuestions
									const filteredSubQuesList = subQuesList.filter((subQues) => {
										if (subQues.questionType === type) return subQues
									})
									if (filteredSubQuesList.length > 0) return filteredSubQuesList
								} else if (question.questionType === type) {
									return question
								}
							})
							this.currentTopicIndex = this.questionList.findIndex((question) => {
								return this.currentTopicIndex === question.mainNum
							})
							if (this.currentTopicIndex === -1) {
								this.currentTopicIndex = 0
							}
						} else {
							this.questionList = data
						}
					}
				})
			}
		},
		// 左右切换题目
		switchTopic(dir) {
			const { audioPlaying, audioRecording } = getApp().globalData
			if (audioPlaying || audioRecording) {
				const title = audioRecording ? '请先结束录音' : '请先暂停音频播放'
				uni.showToast({ title, icon: 'none' })
				return false
			} else {
				const newIndex = dir ? this.currentTopicIndex + 1 : this.currentTopicIndex - 1
				this.currentTopicIndex = newIndex > this.questionList.length - 1 ? 0 : newIndex < 0 ? this.questionList.length - 1 : newIndex
			}
		},
		// 展示或隐藏总览
		showOrHideTopicOverview() {
			this.showTopicTab = !this.showTopicTab
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
			if (this.timeLimitList.length > 0 && time !== undefined) {
				const fmtTime = formatSecondToHHmmss(time)
				return `${fmtTime.min}:${fmtTime.second}`
			} else {
				return '0:0'
			}
		},
		// 子组件暂存成功重置状态
		storedTopic() {
			this.storeFlag = false
		},
		// 触发子组件暂存
    storeTopic() {
			this.switchTopic(true)
			uni.showToast({
				title: '暂存成功',
				icon: 'success'
			})
		},
		// 点击上交
		submitTopic() {
			if (this.isAnswering) {
				uni.showModal({ title: '提示', content: '请在原终端进行提交!', showCancel: false })
        return false
			}
			console.log('submitTopic', this.submitFlag)
			this.submitFlag === -1 ? this.submitFlag = 0 : this.submitTopicAction()
		},
		// 子组件提交题目完成后调用改变submitFlag为1，触发watch中的结束考试操作
		updateSubmitFlag(data) {
			console.log('updateSubmitFlag', data, this.submitFlag)
			this.submitFlag === 0 ? this.submitFlag = 1 : () => {}
		},
		// 结束考试
		endExamAction(unShowExit) {
			uni.showLoading({ title: '上交中...' })
			return endExam(this.examId, this.userId).then((res) => {
				uni.hideLoading()
				if (res.code === 'E_K12-OE_M3001') {
					uni.showToast({ title: res.desc, icon: 'none' })
					return
				} else {
					uni.showToast({ title: '提交成功', icon: 'success' })
					clearInterval(this.countdownTimer)
					clearInterval(this.timer)
					if (!unShowExit) {
						this.showExitBtnAction()
						getApp().globalData.authStatus = null
					}
					typeof this.submitFlag === 'number' ? this.submitFlag = -1 : () => {}
				}
				console.log('endExam', res)
			})
		},
		showExitBtnAction(){
			this.showExitBtn = true
		},
		// 上交前拦截判断
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
								resp.confirm ? that.startAnswerGuide() : () => {}
              }
						})
						that.submitFlag === 1 ? that.submitFlag = -1 : () => {}
          }
        }
			})
		},
		// 用户认证成功回调
		authLoginSuccess() {
			// 如果需要考试前认证先不初始化
			this.needLogin = false
			uni.showLoading()
			// 检查考试是否需要开启监考，是否需要开启人脸检查
			examFaceEnable(2709).then((res) => {
				console.log('examFaceEnable', res)
				if (res === 1) {
					const that = this
					uni.authorize({
						scope: 'scope.camera',
						success(res) {
							that.cameraCtx = uni.createCameraContext()
						},
						fail(err) {
							console.log('authorize fail', err)
							authCameraTips()
						}
					})
					examFaceCheck(2709).then((res) => {
						console.log('examFaceCheck', res)
						if (res === 1) {
							this.faceCheckStatus = true
						}
					})
				} else {
					this.initExam()
				}
				uni.hideLoading()
			})
		},
		// 考试引导
		startAnswerGuide() {
			this.showAnswerGuide = true
			this.answerGuideChangeStep(0)
		},
		// 引导步数
		answerGuideChangeStep(index) {
			this.answerGuideIndex = index
		},
		// 隐藏引导
		hideAnswerGuide() {
			this.answerGuideIndex = -1
			this.showAnswerGuide = false
			uni.setStorageSync('answerGuide', '1')
		},
		takePhoto() {
			const takePhotoAction = () => {
				return this.cameraCtx.takePhoto().then((res) => {
					const tempPath = res.tempImagePath
					console.log('takePhoto', tempPath)
					uploadFaceToAliOss(this.examRecordDataId, tempPath).then((path) => {
						console.log('uploadFaceToAliOss', path)
					})
					return res.tempImagePath
				}).catch((err) => {
					console.log('takePhoto Err', err)
				})
			}
			if (this.cameraCtx === null) {
				this.cameraCtx = uni.createCameraContext()
			}
			return takePhotoAction()
		},

		binderror(e) {
			console.log('binderror', e)
			authCameraTips()
		},
		bindinitdone(e) {
			console.log('bindinitdone', e)
		},
		// 相机移动事件处理
		cameraTouchMove(e) {
			const { clientX, clientY, pageX, pageY } = e.touches[0]
			const x = Math.floor(clientX === 0 ? pageX : clientX)
			const y = Math.floor(clientY === 0 ? pageY : clientY)
			if (Math.abs(x) % 2 === 0 || Math.abs(y) % 3 === 0) {
				this.cameraRight = x >= 0.8 * windowWidth ? '0vw' : x <= 0.2 * windowWidth ? '80vw' : Math.floor(((windowWidth - x) / windowWidth) * 100) + 'vw'
				this.cameraTop = y >= 0.8 * windowHeight ? '80vh' : y <= 0.2 * windowHeight ? '0vh' : Math.floor((y / windowHeight) * 100) + 'vh'
			}
		},
		snapshotHandler(snapshotInterval) {
			// if (snapshotInterval && snapshotInterval > 0) {
			console.log('snapshotHandler', snapshotInterval)
			if (true) {
				this.snapshotTimer = setInterval(() => {
					// TODO 每隔minutes分钟抓拍一次
					this.takePhoto()
				}, Math.floor(100 * 60))
				// }, Math.floor(1 * 60) * 1000)
			}
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
		.extra-options {
			color: #666D88;
			padding: 9px 0;
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
			background: #FFF;
			border-radius: 8px 8px 0 0;
			border-bottom: $default-bgcolor 1px solid;
			.ques-type {
				padding: 1vw 1.5vw;
				border-radius: 20px;
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
		margin: 0 3vw;
    padding: 2vw 10vw;
    border-radius: 8vw;
    background: $default-bluelinearbg;
  }
}
.snap-camera {
	position: fixed;
	z-index: 20;
	width: 20vw;
	height: 20vh;
	border-radius: 8px;
	box-shadow: 0 0 0 2.5vw #FFF inset;
	border: solid 1px rgba(0,0,0, .3);
	.capture-face {
		z-index: 10;
		margin: 2.5vw;
		width: 15vw;
		height: calc(20vh - 5vw);
	}
}

</style>