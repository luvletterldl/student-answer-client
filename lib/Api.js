import Main from "./Main"
// const userInfo = uni.getStorageSync(Main.userInfo)
export const header = {
  key: '',
  token: ''
}
// if (userInfo !== '') {
//   header.key = JSON.parse(userInfo).key
//   header.token = JSON.parse(userInfo).token
// }

const formatErrOrRes = (result) => {
  console.log(result, 'formatErrOrRes')
  if (result[0] !== null) {
    console.log('formatErrOrRes', result[0])
    return result[0].data
  } else {
    const code = result[1].data.code
    let desc = result[1].data.desc
    if (result[1].statusCode === 502) {
      uni.showModal({
        title: '提示',
        content: '服务器忙',
        showCancel: false,
      })
    }
    if (code !== undefined && code !== '0' && code !== 0) {
      if (code === '403') {
        desc = '登录状态失效，请在其他终端操作'
        getApp().globalData.authStatus = false
      }
      uni.showModal({
        title: '提示',
        content: desc,
        showCancel: false,
      })
    }
    return result[1].data
  }
}

/**
 * PC网考端登录
 * @param {string} phone 
 * @param {string} pwd 
 */
export async function clientOELogin(phone, pwd) {
  const result = await uni.request({
    url: `${Main.host}api/k12/student/login`,
    method: 'POST',
    header,
    data: {
      accountType: "EXAM_STUDENT",
      ecRootOrgId: 17,
      phone,
      pwd
    }
  })
  return formatErrOrRes(result)
}
// 测试时用 微信端登录
export async function clientOALogin(phone, pwd) {
  const result = await uni.request({
    url: `${Main.host}api/k12/student/login`,
    method: 'POST',
    header,
    data: {
      ecRootOrgId: 17,
      // openId: "oBfSS51OGQ2i6TPTrcRkZ78Ct50g",
      phone,
      pwd,
      // phone: '15911111109',
      // pwd: '123456',
      // updateVersion: "v1.20.0"
    }
  })
  // const data = result[1].data
  // console.log(result[1])
  // if (data.user) {
  //   header.key = data.user.key
  //   header.token = data.user.token
  // }
  return formatErrOrRes(result)
}

export async function getCourseInfoByStudentId(studentId) {
  const option = {
    url: `${Main.host}api/k12/student/myCourse?studentId=${studentId}`,
    method: 'GET',
    header,
  }
  return formatErrOrRes(await uni.request(option))
}

/**
 * 当前学生上过的所有课次,返回课次内所有教学内容的相关信息
 * @param {number} studentId 学生ID
 * @param {number} status 0 在教
 * @param {number} courseId 
 */
export async function getMyClassLesson(studentId, status, courseId) {
  const option = {
    url: `${Main.host}api/k12/student/myClassLesson?studentId=${studentId}&status=${status}&courseId=${courseId}`,
    method: 'GET',
    header,
  }
  return formatErrOrRes(await uni.request(option))
}

/**
 * 根据课程查询班级与课程信息
 * @param {number} classId 
 * @param {number} courseId 
 * @param {number} type 
 * @param {number} id 
 */
export async function findClsAndCourseByClassIdAndCourseId(classId, courseId, type, id) {
  const option = {
    url: `${Main.host}api/k12/classCourse/findClsAndCourseByClassIdAndCourseId/${classId}/${courseId}/${type}/${id}`,
    method: 'GET',
    header,
  }
  return formatErrOrRes(await uni.request(option))
}

/**
 * 查询待完成作业
 * @param {number} classId 
 * @param {number} lessonId 
 * @param {string} state 
 * @param {number} studentId 
 * @param {number} curPage 
 * @param {number} pageSize 
 */
export async function pageAssignment(classId, lessonId, state, studentId, curPage, pageSize) {
  const option = {
    url: `${Main.host}api/k12/assignment/pageAssignment/${curPage}/${pageSize}`,
    method: 'POST',
    header,
    data: {
      classId,
      lessonId,
      state,
      studentId,
    }
  }
  return formatErrOrRes(await uni.request(option))
}

/**
 * 是否开启人脸识别(是否开启监考),0关闭,1开启
 * @param {*} examId 
 */
export async function examFaceEnable(examId) {
  const option = {
    url: `${Main.host}api/ecs_exam_work/exam/examOrgProperty/${examId}/IS_FACE_ENABLE`,
    method: 'GET',
    header,
  }
  return formatErrOrRes(await uni.request(option))
}

/**
 * 是否开启进入考试人脸检查0关闭,1开启	
 * @param {*} examId 
 */
export async function examFaceCheck(examId) {
  const option = {
    url: `${Main.host}api/ecs_exam_work/exam/examOrgProperty/${examId}/IS_FACE_CHECK`,
    method: 'GET',
    header,
  }
  return formatErrOrRes(await uni.request(option))
}

/**
 * 开始考试
 * @param {number} examId 
 * @param {number} examStudentId 
 */
export async function startExam(examId, examStudentId) {
  const option = {
    url: `${Main.host}api/k12/ecs_oe_student/examControl/startExam`,
    method: 'GET',
    header,
    data: {
      examId,
      examStudentId
    }
  }
  return formatErrOrRes(await uni.request(option))
}

/**
 * 入学测生成考生信息 重刷入学测之前调用
 * @param {*} examId 
 * @param {*} studentId 
 */
export async function createExamStudent(examId, studentId) {
  const option = {
    url: `${Main.host}api/k12/ecs_oe_student/entranceTest/createExamStudent`,
    method: 'GET',
    header,
    data: {
      examId,
      studentId
    }
  }
  return formatErrOrRes(await uni.request(option))
}

/**
 * 重刷考试
 * @param {number} examId 
 * @param {number} examStudentId 
 */
export async function restartExam(examId, examStudentId) {
  const option = {
    url: `${Main.host}api/k12/ecs_oe_student/examControl/restartExam`,
    method: 'GET',
    header,
    data: {
      examId,
      examStudentId
    }
  }
  return formatErrOrRes(await uni.request(option))
}
/**
 * 查看考试题目信息
 * @param {number} examId 
 * @param {number} examStudentId 
 */
export async function getQuestions(examId, examStudentId) {
  const option = {
    url: `${Main.host}api/k12/ecs_oe_student/exam/getQuestions/${examId}/${examStudentId}`,
    method: 'GET',
    header: header
  }
  return formatErrOrRes(await uni.request(option))
}

/**
 * 考试过程中-获取试题列表
 * @param {number} examId 
 * @param {number} examStudentId 
 */
export async function findExamQuestionList(examId, examStudentId) {
  const option = {
    url: `${Main.host}api/k12/ecs_oe_student/examQuestion/findExamQuestionList`,
    method: 'GET',
    header,
    data: {
      examId,
      examStudentId
    }
  }
  return formatErrOrRes(await uni.request(option))
}

/**
 * 上传图片到阿里云
 * @param {number} classId 
 * @param {number} examRecordDataId 
 * @param {string} filePath 
 */
export async function uploadImageToAliOss(examRecordDataId, filePath) {
  const option = {
    // url: `${Main.host}api/k12/wx/${classId}/${examRecordDataId}/uploadImageToAliOss`,
    url: `${Main.host}api/ecs_core/upload/uploadExamRecordImage/${examRecordDataId}`,
    filePath: filePath,
    header,
    formData: {
      examRecordDataId, filePath
    },
    name: 'image',
  }
  return formatErrOrRes(await uni.uploadFile(option))
}

/**
 * 上传监考图片
 * @param {*} examRecordDataId 
 * @param {*} filePath 
 */
export async function uploadFaceToAliOss(examRecordDataId, filePath) {
  const option = {
    url: `${Main.host}api/ecs_core/upload/uploadFaceToAliOss`,
    filePath: filePath,
    header,
    formData: {
      examRecordDataId, filePath
    },
    name: 'image',
  }
  return formatErrOrRes(await uni.uploadFile(option))
}

/**
 * 上传录音到阿里云
 * @param {number} examRecordDataId 
 * @param {number} order 
 * @param {string} text 
 * @param {string} filePath 
 */
export async function uploadMp3ToAliOss(examRecordDataId, order, text, filePath) {
  const option = {
    url: `${Main.host}api/k12/ecs_oe_student/soe/uploadMp3ToAliOss`,
    filePath: filePath,
    header,
    formData: {
      examRecordDataId,
      order: order,
      text: text,
      filePath
    },
    name: 'audio',
  }
  return formatErrOrRes(await uni.uploadFile(option))
}

/**
 * 获取御品评测结果
 * @param {string}} id 
 */
export async function getSpokenAnswerResult(id) {
  const option = {
    url: `${Main.host}api/k12/ecs_oe_student/soe/getResult/${id}`,
    method: 'GET',
    header,
  }
  return formatErrOrRes(await uni.request(option))
}
/**
 * 获取服务器时间
 */
export async function currentServerTime() {
  const option = {
    url: `${Main.host}api/k12/ecs_oe_student/examControl/currentServerTime`,
    method: 'GET',
    header,
  }
  return formatErrOrRes(await uni.request(option))
}

/**
 * 考试过程中提交答案 [order, studentAnswer, isSign, audioPlayTimes, time, teacherComment, teacherMarkedImages, mediaId, audioText]
 * @param {number} examId 
 * @param {number} examStudentId 
 * @param {number} currentServerTime 
 * @param {Array} answerList [order, studentAnswer, isSign, audioPlayTimes, time, teacherComment, teacherMarkedImages, mediaId, audioText]
 */
export async function examSubmit(examId, examStudentId, currentServerTime, answerList ) {
  const option = {
    url: `${Main.host}/api/k12/ecs_oe_student/exam/submit`,
    method: 'POST',
    header,
    data: {
      examId,
      examStudentId,
      currentServerTime,
      answerList
    }
  }
  return formatErrOrRes(await uni.request(option))
}

/**
 * 结束考试：交卷
 * @param {number} examId 
 * @param {number} examStudentId 
 */
export async function endExam(examId, examStudentId) {
  const option = {
    url: `${Main.host}api/k12/ecs_oe_student/examControl/endExam`,
    method: 'GET',
    header,
    data: {
      examId,
      examStudentId
    }
  }
  return formatErrOrRes(await uni.request(option))
}

/**
 * 在线考试控制接口 考试心跳
 * @param {number} examId 
 */
export async function examHeartbeat(examId) {
  const option = {
    url: `${Main.host}api/k12/ecs_oe_student/examControl/examHeartbeat/${examId}`,
    method: 'GET',
    header,
  }
  return formatErrOrRes(await uni.request(option))
}

/**
 * 断点续考:检查正在进行中的考试
 */
export async function checkExamInProgress() {
  const option = {
    url: `${Main.host}api/k12/ecs_oe_student/examControl/checkExamInProgress`,
    method: 'GET',
    header,
  }
  return formatErrOrRes(await uni.request(option))
}

/**
 * 对比学生照片
 * @param {number} phone 
 */
export async function comparePortrait(phone, portrait) {
  const option = {
    url: `${Main.host}api/k12/student/comparePortrait/17/${phone}`,
    method: 'POST',
    header,
    data: {
      portrait,
    }
  }
  return formatErrOrRes(await uni.request(option))
}

/**
 * 设置终端锁,小程序端开始答题之后调用，以保证PC端小程序端不能同时作答
 * @param {*} userId 
 * @param {*} examId 
 * @param {*} examRecordDataId 
 * @param {*} examType 
 * @param {*} questionType 
 */
export async function lockTerminalLock(userId, studentId, examId, examRecordDataId, examType, questionType) {
  const option = {
    url: `${Main.host}api/k12/ecs_oe_student/examControl/lockTerminalLock`,
    method: 'POST',
    header,
    data: {
      token: header.token,
      key: header.key,
      userId,
      studentId,
      examId,
      examRecordDataId,
      examType,
      questionType
    }
  }
  return formatErrOrRes(await uni.request(option))
}

/**
 * 解除终端锁定
 * @param {*} examRecordDataId 
 */
export async function unLockTerminal(examRecordDataId) {
  const option = {
    url: `${Main.host}api/k12/ecs_oe_student/examControl/unLockTerminal`,
    method: 'GET',
    header,
    data: {
      examRecordDataId,
    }
  }
  return formatErrOrRes(await uni.request(option))
}
