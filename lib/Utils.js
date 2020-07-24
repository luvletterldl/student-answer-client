import { QuestionType } from './Enumerate'
import { unix } from 'dayjs'

export function formatQuestionType(question) {
  if (question === undefined || question === null) {
    return new Error('不合法的题目')
  }
  const type = question.questionType || ''
  if (type === QuestionType.SPOKEN_ANSWER_QUESTION) {
    return '口语题'
  } else if (type === QuestionType.SINGLE_ANSWER_QUESTION) {
    return '单选题'
  } else if (type === QuestionType.MULTIPLE_ANSWER_QUESTION) {
    return '多选题'
  } else if (type === QuestionType.FILL_BLANK_QUESTION) {
    return '填空题'
  } else if (type === QuestionType.TEXT_ANSWER_QUESTION) {
    return '简答题'
  } else if (type === QuestionType.BOOL_ANSWER_QUESTION) {
    return '判断题'
  } else if (type === QuestionType.NESTED_ANSWER_QUESTION) {
    return '套题'
  } else {
    return new Error('没有此类型的题目')
  }
}

export function formatSecondToHHmmss(time) {
  if (typeof time !== 'number') {
    throw new TypeError('必须是数字类型')
  } else {
    return {
      hour: Math.floor(time / 3600) >= 0 ? Math.floor(time / 3600) : 0,
      min: Math.floor(time % 3600 / 60) >= 0 ? Math.floor(time % 3600 / 60) : 0,
      second: Math.floor(time % 3600 % 60) >=0 ? Math.floor(time % 3600 % 60) : 0
    }
  }
}

export function formatRichTextImg(nodes) {
  if (nodes === undefined) {
    return ''
  } else {
    const width = uni.getSystemInfoSync().windowWidth * 0.65
    return nodes.replace(/width=/g, '').replace(/<img/g, `<img width="${width}"`)
  }
}

export function afterAudioRecord() {
  getApp().globalData.audioRecording = false
}

export function afterAudioPlay() {
  getApp().globalData.audioPlaying = false
}

/**
 * 判断是否可以录音或者播放
 * @param {string} type play || record
 */
export function beforeAudioRecordOrPlay(type) {
  const audioPlaying = getApp().globalData.audioPlaying
  const audioRecording = getApp().globalData.audioRecording
  if (audioPlaying ||audioRecording) {
    uni.showToast({
      title: audioPlaying ? '请先暂停其他音频播放' : '请先结束其他录音',
      icon: 'none'
    })
    return false
  } else {
    if (type === 'play') {
      getApp().globalData.audioPlaying = true
    } else if (type === 'record') {
      getApp().globalData.audioRecording = true
    } else {
      throw new Error('type Error', type)
    }
    return true
  }
}