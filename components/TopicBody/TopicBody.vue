<template>
  <view class="topic-body">
    <view class="ques-top-body">
      <text class="ques-type">{{ fmtQuestionType }}</text>
      <text class="quest-index">{{ questionIndex + 1 }}、</text>
      <rich-text class="questBody" :nodes="question.quesBody" />
      <custom-audio v-if="question.audioLink !== null" :audioSrc="question.audioLink" />
    </view>
    <view v-if="question.questionType === QuestionType.SINGLE_ANSWER_QUESTION || question.questionType === QuestionType.MULTIPLE_ANSWER_QUESTION" class="options">
      <view @click="chooseSelectItem(question, index)" v-for="(option, index) in question.quesOptions" :key="index" class="option">
        <view class="option-index" :class="selectedOptions.includes(index) ? 'selected-option' : ''">{{ ChoiceOption[index] }}</view>
        <rich-text :nodes="option.optionBody" />
      </view>
    </view>
    <view v-if="question.questionType === QuestionType.BOOL_ANSWER_QUESTION" class="true-false">
      <view @click='selectBoolAnswer(true, question)' class='correct' :class="trueOrFalse(question) === true ? 'upToCorrect' : ''">正确</view>
      <view @click='selectBoolAnswer(false, question)' class='error' :class="trueOrFalse(question) === true ? '' : 'upToError'">错误</view>
    </view>
    <view v-if="question.questionType === QuestionType.FILL_BLANK_QUESTION" class='fill-blank'>
      <view @click="toFillAnswer(index)" v-for="(item, index) in fmtFillAnswer(question)" :key="index" class="option">
        <view class="option-index">{{ index + 1 }}</view>
        <text v-if='item === ""'>点击输入</text>
        <image v-else-if="item !== ''" :src='combineUrl(item)' class="fill-topic-img" />
      </view>
    </view>
    <view v-if="question.questionType === QuestionType.TEXT_ANSWER_QUESTION" class="text-answer">
      <view @click="uploadTextAnswer(question)" v-if="question.studentAnswer === null || question.studentAnswer === ''" class="default-view">点击拍照上传</view>
      <image mode='aspectFit' @click="uploadTextAnswer(question)" v-else :src="combineUrl(question.studentAnswer)" alt="">
    </view>
    <view v-if="question.questionType === QuestionType.SPOKEN_ANSWER_QUESTION" class="recorder-panel">
      <view class="record-part">
        <image @click="recordAction" :src="recordImg" class="record"/>
        <text class="record-desc">{{ recordDesc }}</text>
        <custom-audio
          v-if="question.studentAnswer !== null"
          class="custom-audio"
          :audioSrc='question.studentAnswer'
        />
      </view>
      <view class="audio-evoluation">
        <view class="audio-text">
          <text>音频文本: {{ question.audioText }}</text>
        </view>
        <view class="evoluation">
          <text>口语评价: {{ evaluationAccuracy }}分</text>
          <rich-text class="words" :nodes="evaluationResult" />
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import Main from '../../lib/Main'
import { QuestionType, ChoiceOption } from '../../lib/Enumerate'
import CustomAudio from '../CustomAudio/CustomAudio'
import { uploadMp3ToAliOss, getSpokenAnswerResult, examSubmit, currentServerTime, uploadImageToAliOss } from '../../lib/Api'
import { formatQuestionType } from '../../lib/Utils';
import iconRecord from '../../static/images/icon_record.png'
import iconRecording from '../../static/images/icon_recording.png'
export default {
  name: 'TopicBody',
  props: {
    question: {
      type: Object,
      reuqired: true
    },
    questionIndex: {
      type: Number,
      reuqired: true,
    },
    updateQuestionList: {
      type: Function,
      reuqired: true
    },
    clsId: {
      type: Number,
      reuqired: true,
    },
    examId: {
      type: Number,
      reuqired: true,
    },
    examRecordId: {
      type: Number,
      reuqired: true,
    },
    studentId: {
      type: Number,
      reuqired: true,
    },
    time: {
      type: Number,
      reuqired: true,
    }
  },
  components: {
    CustomAudio
  },
  data() {
    return {
      QuestionType: QuestionType,
      ChoiceOption: ChoiceOption,
      userId: 0,
      selectedOptions: [],
      boolStudentAnswer: null,
      oldBoolStudentAnswer: null,
      rm: undefined,
      recordImg: iconRecord,
      recordStatus: 0,
      spokenResult: undefined,
      oldTime: 0,
      oldSelectedOpts: [],
    }
  },
  watch: {
    question: {
      handler(newQues, oldQues) {
        if (oldQues) {
          console.log('oldQues', oldQues, 'oldQues.questionType', oldQues.questionType)
          if (oldQues.questionType === QuestionType.SINGLE_ANSWER_QUESTION || oldQues.questionType === QuestionType.MULTIPLE_ANSWER_QUESTION) {
            this.submitChoiceAnswer(oldQues)
          } else if (oldQues.questionType === QuestionType.BOOL_ANSWER_QUESTION) {
            this.submitBoolAnswer(oldQues)
          }
        }
        if (newQues) {
           console.log('newQues', newQues, 'newQues.questionType', newQues.questionType)
          const type = newQues.questionType
          const answer = newQues.studentAnswer
          if (type === QuestionType.SINGLE_ANSWER_QUESTION || type === QuestionType.MULTIPLE_ANSWER_QUESTION) {
            if (answer !== null || answer !== '') {
              this.selectedOptions = Array.from(answer.replace(/,/g, ''), (v) => { return parseInt(v)})
            } else {
              this.selectedOptions = []
            }
          }
          if (type === QuestionType.BOOL_ANSWER_QUESTION) {
            this.boolStudentAnswer = answer === 'true' ? true : answer === 'false' ? false : null
          }
        }
      },
      deep: true,
      immediate: true,
    },
    time: {
      handler(newTime, oldTime) {
        this.oldTime = oldTime
      }
    },
    // boolStudentAnswer: {
    //   handler(newBoolStudentAnswer, oldBoolStudentAnswer) {
    //     this.oldBoolStudentAnswer = newBoolStudentAnswer
    //   }
    // },
    // selectedOptions: {
    //   handler(newSelectedOpts, oldSelectedOpts) {
    //     this.oldSelectedOpts = newSelectedOpts
    //   },
    //   deep: true
    // }
  },
  computed: {
    fmtQuestionType() {
		 	return formatQuestionType(this.question)
		},
    recordDesc() {
      const status = this.recordStatus
      if (status === 0 || status === 2) {
        this.recordImg = iconRecord
      } else if (status === 1) {
        this.recordImg = iconRecording
      }
      return status === 0 ? '点击开始录音' : status === 1 ? '录音中' : status === 2 ? '点击开始录音' : ''
    },
    evaluationAccuracy() {
      const result = this.question.evaluation
      if (result !== null) {
        return Math.floor(result.pronAccuracy)
      } else {
        return 0
      }
    },
    evaluationResult() {
      const result = this.question.evaluation
      if (result !== null) {
        const body = result.wordsEvaluation.reduce((total, v) => {
          return `${total}<span style="color: ${v.pronAccuracy < 30 ? 'red' : v.pronAccuracy >= 60 ? 'green' : 'orange'};">${v.word} &ensp;</span>`
        }, '')
        return `<div style="display: flex; flex-flow: row wrap;>${body}</div>`
      } else {
        return ''
      }
    }
  },
  mounted() {
		if (uni.getStorageSync(Main.userInfo) !== '') {
			const userInfo = JSON.parse(uni.getStorageSync(Main.userInfo))
			this.userId = userInfo.userId
    }   
    if (this.rm === undefined) {
      this.rm = uni.getRecorderManager()
    }
    this.rm.onStart((e) => this.onStart(e))
    this.rm.onPause((e) => this.onPause(e))
    this.rm.onResume((e) => this.onResume(e))
    this.rm.onStop((e) => this.onStop(e))
    this.rm.onInterruptionBegin((e) => this.onInterruptionBegin(e))
    this.rm.onInterruptionEnd((e) => this.onInterruptionEnd(e))
    this.rm.onError((e) => this.onError(e))
  },
  beforeUpdate() {
    console.log('beforeUpdate', this.question, this.question.questionType)
  },
  updated() {
    console.log('updated', this.question, this.question.questionType)
  },
  beforeDestroy() {
    console.log('beforeDestroy', this.question, this.question.questionType, this.oldBoolStudentAnswer, this.oldSelectedOpts)
    const type = this.question.questionType
    if (type === QuestionType.SINGLE_ANSWER_QUESTION || type === QuestionType.MULTIPLE_ANSWER_QUESTION) {
      this.submitChoiceAnswer(this.question)
    } else if (type === QuestionType.BOOL_ANSWER_QUESTION) {
      this.submitBoolAnswer(this.question)
    }
  },
  methods: {
    combineUrl(url) {
      return `${Main.host}/api/k12/wx/getImage?filePath=${url}`
    },
    submitChoiceAnswer(question) {
			if (this.oldSelectedOpts.length > 0) {
        console.log(this.selectedOptions, this.oldSelectedOpts)
				return currentServerTime().then(serverTime => {
					return examSubmit(this.examId, this.studentId, serverTime, [{
						order: question.order,
						studentAnswer: this.oldSelectedOpts.toString(),
						time: this.oldTime,
					}]).then((res) => {
            this.oldSelectedOpts = []
						this.$emit('updateQuestionList')
					})
				})
			}
    },
    submitBoolAnswer(question) {
			if (this.oldBoolStudentAnswer !== null) {
        console.log(this.boolStudentAnswer, this.oldBoolStudentAnswer)
				currentServerTime().then(serverTime => {
					examSubmit(this.examId, this.studentId, serverTime, [{
						order: question.order,
						studentAnswer: this.oldBoolStudentAnswer.toString(),
						time: this.oldTime,
					}]).then((res) => {
            this.oldBoolStudentAnswer = null
						this.$emit('updateQuestionList')
					})
				})
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
      this.oldSelectedOpts = this.selectedOptions
      console.log(this.selectedOptions, this.oldSelectedOpts)
    },
    selectBoolAnswer(bool) {
			this.boolStudentAnswer = bool
      this.oldBoolStudentAnswer = bool
      console.log(bool, this.boolStudentAnswer, this.oldBoolStudentAnswer)
    },
    trueOrFalse() {
			if (this.boolStudentAnswer !== null) {
				return this.boolStudentAnswer
			} else if (this.question.questionType === QuestionType.BOOL_ANSWER_QUESTION) {
				if (this.question.studentAnswer === 'true') {
					return true
				} else if (this.question.studentAnswer === 'false') {
					return false
				} else {
          return null
        }
			}
		},
    toFillAnswer(index) {
			uni.navigateTo({
			  url: `/pages/fillTopicAnswer/fillTopicAnswer?userId=${this.userId}&order=${this.question.order}&classId=${this.clsId}&examId=${this.examId}&studentId=${this.studentId}&index=${index}&time=${this.time}`
			})
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
						currentServerTime().then(serverTime => {
							examSubmit(this.examId, this.studentId, serverTime, [{
								order: question.order,
								studentAnswer: resp,
								time: this.time,
							}]).then((res) => {
								this.$emit('updateQuestionList')
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
    recordAction() {
      if (this.recordStatus === 0 || this.recordStatus === 2) {
        this.rm.start({
          duration: 600000,
          format: 'mp3',
          sampleRate: 22050,
        })
        this.recordStatus = 1
      } else if (!this.stop) {
        this.rm.stop()
        this.recordStatus = 2
      }
    },
    onStart(e) {
      console.log(e)
    },
    onPause(e) {
      console.log(e)
    },
    onResume(e) {
      console.log(e)
    },
    onStop(e) {
      console.log(e)
      uni.showLoading({
        title: '录音上传中...'
      })
      uploadMp3ToAliOss(this.examRecordId, this.question.order, this.question.audioText, e.tempFilePath).then((res) => {
        const data = JSON.parse(res)
        uni.hideLoading()
        uni.showLoading({
          title: '评测中...'
        })
        const answerNormalLink = data.data.answerNormalLink
        console.log('uploadMp3ToAliOss', data)
        const getResult = () => getSpokenAnswerResult(data.data.id).then((resp) => {
          console.log('getSpokenAnswerResult', resp)
          const status = resp.data.status
          if (status === 'Evaluating') {
            setTimeout(() => {
              getResult()
            }, 3000)
          } else if (status === 'Finished') {
            this.spokenResult = resp.data.evaluation
            uni.hideLoading()
            currentServerTime().then((time) => {
              examSubmit(this.examId, this.studentId, time, [{
                order: this.question.order,
                time: this.time,
                mediaId: data.data.id,
                audioText: this.question.audioText,
                studentAnswer: answerNormalLink
              }]).then((res) => {
                this.$emit('updateQuestionList')
              })
            })
          }
        }).catch((err) => {
          throw new Error(err)
        })
        getResult();
      }).catch((err) => {
        throw new Error(err)
      })
    },
    onInterruptionBegin(e) {
      console.log(e)
    },
    onInterruptionEnd(e) {
      console.log(e)
    },
    onError(e) {
      console.log(e)
    },
  }
}
</script>

<style lang="scss" scoped>
.topic-body {
  .ques-top-body {
    padding: 3vw;
    // background: linear-gradient(135deg, #4edbab 0%, #90e2a9 100%);
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
  .recorder-panel {
    display: flex;
    flex-flow: column nowrap;
    align-items: center;
    padding: 3vw;
    color: $blackcolor;
    .record-part {
      display: flex;
      flex-flow: row nowrap;
      align-items: center;
      justify-content: flex-start;
      width: 100%;
      .record {
        border-radius: 100%;
        border: #c0c0c0 solid 1px;
        width: 10vw;
        height: 10vw;
        flex-shrink: 0;
        margin-right: 3vw;
      }
      .record-desc {
        width: 45%;
      }
    }
    .audio-evoluation {
      display: flex;
      flex-flow: column;
      align-items: center;
      width: 100%;
      .audio-text, .evoluation {
        width: 100%;
        margin-top: 2vw;
        text-align: left;
      }
    }
  }
}
</style>