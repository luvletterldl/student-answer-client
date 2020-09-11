import { QuestionType } from './Enumerate'
import Main from './Main'
import { header } from './Api'

export function parseParamsFromUrl(url) {
  if (url !== undefined && url !== '') {
    let paramsList = url.split('?')[1]
    Main.host = url.split('?')[0]
    paramsList ? paramsList = paramsList.split('&') : console.error(`没有合适的传参: url: ${url}, options.q: ${options.q}`)
    let params = {}
    for (let i = 0; i < paramsList.length; i++) {
      params[paramsList[i].split('=')[0]] = paramsList[i].split('=')[1]
    }
    console.log(params)
    return params
  } else {
    return ''
  }
}

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
    // throw new TypeError('必须是数字类型')
    return ''
  } else {
    return {
      hour: Math.floor(time / 3600) >= 0 ? Math.floor(time / 3600) : 0,
      min: Math.floor(time % 3600 / 60) >= 0 ? Math.floor(time % 3600 / 60) : 0,
      second: Math.floor(time % 3600 % 60) >=0 ? Math.floor(time % 3600 % 60) : 0
    }
  }
}
export function fmtSecToMin(time) {
  if (time !== undefined) {
    const fmtTime = formatSecondToHHmmss(time)
    return `${fmtTime.min}:${fmtTime.second}`
  } else {
    return '0:0'
  }
}

export function formatRichTextImg(nodes) {
  if (nodes === undefined) {
    return ''
  } else {
    const width = uni.getSystemInfoSync().windowWidth * 0.72
    return nodes.replace(/width=/g, '').replace(/<p>&nbsp;<img/g, `<p>&nbsp;<img width="${width}"`).replace(/><img/, '><img style="max-width: 80vw;"').replace(/ <img/, ' <img style="max-width: 72vw;"')
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

// 授权相机提示
export function authCameraTips() {
  uni.showModal({
    title: '提示',
    content: '为了完成您的答题，请授权您的相机！',
    showCancel: false
  }).then((res) => {
    getApp().globalData.legalHideAction = true
    res[1].confirm ? uni.openSetting() : () => {}
  })
}

export function dataURItoBlob(base64Data) {
  let byteString;
  if (base64Data.split(',')[0].indexOf('base64') >= 0) {
    byteString = atob(base64Data.split(',')[1]);
  } else {
    byteString = unescape(base64Data.split(',')[1]);
  }
  const mimeString = base64Data.split(',')[0].split(':')[1].split(';')[0];
  let ia = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ia], {type:mimeString});
}

export function resetContentType() {
  header['Content-Type'] = 'application/json;charset=UTF-8'
}