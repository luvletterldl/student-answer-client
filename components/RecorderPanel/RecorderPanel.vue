<template>
  <view class="recorder-panel">
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
</template>

<script>
import iconRecord from '../../static/images/icon_record.png'
import iconRecording from '../../static/images/icon_recording.png'
import CustomAudio from '../CustomAudio/CustomAudio'
import { uploadMp3ToAliOss, getSpokenAnswerResult, examSubmit, currentServerTime } from '../../lib/Api'
export default {
  name: 'RecorderPanel',
  props: {
    question: {
      type: Object,
      required: true,
    },
    examId: {
      type: Number,
      required: true
    },
    examRecordId: {
      type: Number,
      required: true
    },
    studentId: {
      type: Number,
      required: true
    },
    time: {
      type: Number,
      required: true,
    },
    updateQuestionList: {
      type: Function,
      required: true
    }
  },
  components: {
    CustomAudio
  },
  data() {
    return {
      rm: undefined,
      recordImg: iconRecord,
      recordStatus: 0,
      spokenResult: undefined,
    }
  },
  computed: {
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
  methods: {
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
        if (data.code !== '0' && data.code !== undefined) {
          uni.showModal({
            title: '提示',
            content: data.desc,
            showCancel: false
          })
          uni.hideLoading()
        }
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
</style>