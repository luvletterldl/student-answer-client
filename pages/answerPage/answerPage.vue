<template>
	<view class="container">
		<ClassTopBaseInfo
			:className='className'
			:courseName='courseName'
			:currentLessonNumber='currentLessonNumber'
		/>
		<view class="answer-panel">
			<view class="topic-switch">
				<image @click='switchTopic(false)' src='../../static/images/icon_prevTopic.png' class='switcher' />
				<view class='topicProcess'>
					<view class='process'>
						<text class="time-limit"><text class="cdtime">{{ currentTopicTimeCost }}</text>/{{ fmtSecToMin(currentTopic.timeLimit) }}</text>
						<text class='currentIndex'>{{ questionList.length > 0 ? currentTopicIndex + 1 : 0 }}/{{ questionList.length }}</text>
					</view>
					<text @click="showTopicOverview" class='viewAll'>点击查看总览</text>
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
			<view class="topic-list">
				<view v-if="currentTopic.hasSub === true" class="topic-body">
					<view class="ques-top-body">
						<text class="ques-type">{{ fmtQuestionType }}</text>
						<text class="quest-index">{{ currentTopicIndex + 1 }}、</text>
						<view class="questBody" v-html="currentTopic.quesBody"></view>
						<custom-audio v-if="currentTopic.audioLink !== null" :audioSrc="currentTopic.audioLink" />
						<topic-body
							v-for="(ques, index) in currentTopic.subQuestions"
							:key="index"
							:questionIndex='index'
							:question='ques'
							v-on:updateQuestionList='updateQuestionList'
							:clsId='clsId'
							:examId='examId'
							:examRecordId='examRecordId'
							:studentId='studentId'
							:time='questionList[currentTopicIndex]'
						/>
					</view>
				</view>
				<view v-else-if="currentTopic.hasSub === false" class="topic-body">
					<topic-body
						:question='currentTopic'
						:questionIndex="currentTopicIndex"
						v-on:updateQuestionList='updateQuestionList'
						:clsId='clsId'
						:examId='examId'
						:examRecordId='examRecordId'
						:studentId='studentId'
						:time='questionList[currentTopicIndex]'
					/>
				</view>
			</view>
			<view class="submit-store">
				<button @click="submitTopic" class="submit-topic">上交</button>
				<button @click="storeTopic" class="store-submit">暂存</button>
			</view>
		</view>
	</view>
</template>

<script>
import ClassTopBaseInfo from '../../components/ClassTopBaseInfo/ClassTopBaseInfo';
import CustomAudio from '../../components/CustomAudio/CustomAudio';
import RecorderPanel from '../../components/RecorderPanel/RecorderPanel'
import TopicBody from '../../components/TopicBody/TopicBody'
import { QuestionType, ChoiceOption } from '../../lib/Enumerate';
import { formatQuestionType, formatSecondToMinSecond } from '../../lib/Utils';
import Main from '../../lib/Main';
import { findClsAndCourseByClassIdAndCourseId, pageAssignment, startExam, getQuestions, findExamQuestionList, uploadImageToAliOss, examSubmit, currentServerTime } from '../../lib/Api'
export default {
	components: {
		ClassTopBaseInfo,
		CustomAudio,
		RecorderPanel,
		TopicBody,
	},
	data() {
		return {
			userId: 0,
			clsId: 0,
			courseId: 0,
			lessonId: 0,
			id: 0,
			studentId: 0,
			examRecordId: 0,
			examId: 0,
			className: '',
			courseName: '',
			currentLessonNumber: '',
			showAnswerPanel: false, // 展示答题面板
			showTopicTab: false, // 展示题目Tab
			order: 0, // 题目order
			assignmentInfo: {}, 
			questionList: [], // 题目列表
			currentTopicIndex: 0, // 当前题目索引
			QuestionType: {}, // 题目类型
			ChoiceOption: [],
			selectedOptions: [], // 选择题选中的索引列表
			boolStudentAnswer: null, // 判断题
			timeLimitList: [], // 限时列表
			timer: 0, // 计时器
		}
	},
	computed: {
		currentTopic() {
			return this.questionList.length > 0 ? this.questionList[this.currentTopicIndex] : ''
		},
		fmtQuestionType() {
		 	return formatQuestionType(this.currentTopic)
		},
		currentTopicTimeCost() {
			return this.fmtSecToMin(this.timeLimitList[this.currentTopicIndex])
		}
	},
	onLoad(options) {
		this.QuestionType = QuestionType
		this.ChoiceOption = ChoiceOption
		const {clsId, courseId, lessonId, id, studentId, ecExamRecordId} = JSON.parse(options.data)
		if (uni.getStorageSync(Main.userInfo) !== '') {
			const userInfo = JSON.parse(uni.getStorageSync(Main.userInfo))
			this.userId = userInfo.userId
		}
		this.clsId = clsId
		this.courseId = courseId
		this.lessonId = lessonId
		this.id = id
		this.studentId = studentId
		this.examRecordId = ecExamRecordId
		this.showAnswerPanel = true
		console.log(JSON.parse(options.data))
		findClsAndCourseByClassIdAndCourseId(clsId, courseId, 4, id).then((res) => {
			console.log('res', res)
			const { className, courseName, currentLessonNumber } = res
			this.className = className
			this.courseName = courseName
			this.currentLessonNumber = currentLessonNumber
		})
		pageAssignment(this.clsId, this.lessonId, '待完成', this.studentId, 0, 5).then((res) => {
			console.log('pageAssignment', res)
			this.assignmentInfo = res.list[0]
			console.log(this.assignmentInfo)
			const courseId = this.assignmentInfo.courseId;
			const classId = this.assignmentInfo.classId;
			const examId = this.assignmentInfo.ecExamId;
			this.examId = examId
			const id = this.assignmentInfo.id;
			const ecExamRecordId = this.assignmentInfo.ecExamRecordId;
			startExam(examId, this.userId).then(() => {
				this.updateQuestionList().then(() => {
					this.timeLimitList = new Array(this.questionList.length).fill(0)
					this.timer = setInterval(() => {
						const newTime = this.timeLimitList[this.currentTopicIndex] + 1
						this.timeLimitList.splice(this.currentTopicIndex, 1, newTime)
					}, 1000)
				})
				// findExamQuestionList(examId, this.userId).then((res) => {
				// 	console.log('findExamQuestionList', res)
				// })
			})
		})
	},
	onShow() {
		if(this.examId !== 0) {
			this.updateQuestionList()
		}
	},
  beforeDestroy() {
    clearInterval(this.timer)
  },
	methods: {
		updateQuestionList() {
			return getQuestions(this.examId, this.userId).then((res) => {
				console.log('getQuestions', res)
				this.questionList = res.data
			})
		},
		// 左右切换题目
		switchTopic(dir) {
			let newIndex = this.currentTopicIndex
			const questionList = this.questionList
			const questionLength = this.questionList.length
			if (dir) {
				newIndex += 1
			} else {
				newIndex -= 1
			}
			if (newIndex > questionLength - 1 || newIndex < 0) {
				return
			} else {
				const oldQuestion = this.questionList[this.currentTopicIndex]
				this.submitAnswer(oldQuestion)
				this.currentTopicIndex = newIndex
				this.order = questionList[newIndex].order
				// TODO 更换题目
				// this.updateExamRecordData(this.state.examRecordDataId, newIndex, 0)
			}
		},
		// 提交答案代理方法
		submitAnswer(question) {
			const type = question.questionType
			if (type === QuestionType.SINGLE_ANSWER_QUESTION || type === QuestionType.MULTIPLE_ANSWER_QUESTION) {
				this.submitChoiceAnswer(question)
			} else if (type === QuestionType.BOOL_ANSWER_QUESTION) {
				this.submitBoolAnswer(question)
			} else if (type === QuestionType.FILL_BLANK_QUESTION) {
				return
			} else if (type === QuestionType.TEXT_ANSWER_QUESTION) {
				return
			} else if (type === QuestionType.SPOKEN_ANSWER_QUESTION) {
				return
			} else if (type === QuestionType.NESTED_ANSWER_QUESTION) {
				// TODO
			}
		},
		showTopicOverview() {
			this.showTopicTab = this.showTopicTab ? false : true
		},
		// 选择某一题
		chooseQuestion(index) {
			const oldQuestion = this.questionList[this.currentTopicIndex]
			this.submitAnswer(oldQuestion)
			this.currentTopicIndex = index
			this.showTopicOverview()
		},
		showQuestionOptions(question) {
			return question.questionType === QuestionType.SINGLE_ANSWER_QUESTION || question.questionType === QuestionType.MULTIPLE_ANSWER_QUESTION ? true : false
		},
		selectedItem(index) {
			const type = this.currentTopic.questionType
			const answer = this.currentTopic.studentAnswer
			if (type === QuestionType.SINGLE_ANSWER_QUESTION || type === QuestionType.MULTIPLE_ANSWER_QUESTION) {
				if (this.selectedOptions.length > 0) {
					return this.selectedOptions.includes(index) ? true : false
				} else if (answer === null || answer === '') {
					return false
				} else {
					const list = Array.from(answer.replace(/,/g, ''), (v) => { return parseInt(v)})
					this.selectedOptions = list
					return list.includes(index) ? true : false
				}
			}
		},
		chooseSelectItem(question, index) {
			if (this.selectedOptions.length === 0) {
				this.selectedOptions.push(index)
			} else if (question.questionType === QuestionType.SINGLE_ANSWER_QUESTION) {
				this.selectedOptions = [index]
			} else if (question.questionType === QuestionType.MULTIPLE_ANSWER_QUESTION) {
				const i = this.selectedOptions.findIndex((v) => v === index)
				if (i !== -1) {
          this.selectedOptions.splice(i, 1)
        } else {
          this.selectedOptions.push(index)
        }
			}
		},
		selectBoolAnswer(bool, question) {
			this.boolStudentAnswer = bool
		},
		trueOrFalse(question) {
			if (this.boolStudentAnswer !== null) {
				return this.boolStudentAnswer
			} else if (question.questionType === QuestionType.BOOL_ANSWER_QUESTION) {
				if (question.studentAnswer === 'true') {
					return true
				} else if (question.studentAnswer === 'false') {
					return false
				}
			}
		},
		fmtFillAnswer(question) {
			if (question.questionType !== QuestionType.FILL_BLANK_QUESTION || question.studentAnswer === null) {
				return []
			} else {
				const answerFmt = question.studentAnswer.replace(/null/gm, '')
				let answerList = answerFmt.split('##')
				answerList.map((v, i) => {
					if (v.substr(-4) === '.png') {
						answerList[i] = v
					}
				})
				return answerList
			}
		},
		combineUrl(url) {
			return `${Main.host}/api/k12/wx/getImage?filePath=${url}`
		},
		toFillAnswer(question, index) {
			const time = this.timeLimitList[this.currentTopicIndex]
			uni.navigateTo({
			  url: `/pages/fillTopicAnswer/fillTopicAnswer?userId=${this.userId}&order=${question.order}&classId=${this.clsId}&examId=${this.examId}&studentId=${this.studentId}&index=${index}&time=${time}`
			})
		},
		submitBoolAnswer(question) {
			if (this.boolStudentAnswer !== null) {
				currentServerTime().then(time => {
					examSubmit(this.examId, this.studentId, time, [{
						order: question.order,
						studentAnswer: this.boolStudentAnswer.toString(),
						time: this.timeLimitList[this.currentTopicIndex],
					}]).then((res) => {
						this.boolStudentAnswer = null
						this.updateQuestionList()
					})
				})
			}
		},
		submitChoiceAnswer(question) {
			if (this.selectedOptions.length > 0) {
				currentServerTime().then(time => {
					examSubmit(this.examId, this.studentId, time, [{
						order: question.order,
						studentAnswer: this.selectedOptions.toString(),
						time: this.timeLimitList[this.currentTopicIndex],
					}]).then((res) => {
						this.selectedOptions = []
						this.updateQuestionList()
					})
				})
			}
		},
		uploadTextAnswer(question) {
			uni.chooseImage({
			  count: 1,
        sizeType: ['compressed'],
			}).then((res) => {
        if (res[0] === null) {
					const filePath = res[1].tempFilePaths[0]
					console.log(res, this.clsId, this.examId, filePath)
          uploadImageToAliOss(this.clsId, this.examId, filePath).then((resp) => {
						console.log('uploadImageToAliOss', resp, question)
						currentServerTime().then(time => {
							console.log(time)
							examSubmit(this.examId, this.studentId, time, [{
								order: question.order,
								studentAnswer: resp,
								time: this.timeLimitList[this.currentTopicIndex],
							}]).then((res) => {
								this.updateQuestionList()
							})
						})
          }).catch((err) => {
						console.log('uploadImageToAliOss error', err)
					})
        } else {
          throw new Error(res[0])
        }
      })
		},
		fmtSecToMin(time) {
			if (this.timeLimitList.length > 0) {
				const fmtTime = formatSecondToMinSecond(time)
				return `${fmtTime.min}:${fmtTime.second}`
			} else {
				return '0:0'
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
    .switcher {
      width: 8vw;
      height: 8vw;
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
			.process {
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
					background:linear-gradient(180deg,rgba(123,191,255,1) 0%,rgba(112,166,255,1) 100%);
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
				background:linear-gradient(180deg,rgba(123,191,255,1) 0%,rgba(112,166,255,1) 100%);
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
			background:linear-gradient(180deg,rgba(123,191,255,1) 0%,rgba(112,166,255,1) 100%);
		}
	}
}
</style>