import Main from "./Main"
const userInfo = uni.getStorageSync(Main.userInfo)
const header = {}
if (userInfo !== '') {
  header.key = JSON.parse(userInfo).key
  header.token = JSON.parse(userInfo).token
}

const formatErrOrRes = (result) => {
  if (result[0] !== null) {
    return result[0].data
  } else {
    return result[1].data
  }
}

export async function clientLogin(phone, pwd) {
  const result = await uni.request({
    url: `${Main.host}api/k12/student/login`,
    method: 'POST',
    header: header,
    data: {
      ecRootOrgId: 17,
      // openId: "oBfSS51OGQ2i6TPTrcRkZ78Ct50g",
      phone,
      pwd,
      // phone: '15911111101',
      // pwd: '123456',
      // updateVersion: "v1.20.0"
    }
  })
  const data = result[1].data
  console.log(result[1])
  if (data.user) {
    header.key = data.user.key
    header.token = data.user.token
  }
  return formatErrOrRes(result)
}

export async function getCourseInfoByStudentId(studentId) {
  const option = {
    url: `${Main.host}api/k12/student/myCourse?studentId=${studentId}`,
    method: 'GET',
    header: header,
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
    header: header,
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
    header: header,
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
    header: header,
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
 * 开始考试
 * @param {number} examId 
 * @param {number} examStudentId 
 */
export async function startExam(examId, examStudentId) {
  const option = {
    url: `${Main.host}api/k12/ecs_oe_student/examControl/startExam`,
    method: 'GET',
    header: header,
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
    header: header,
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
export async function uploadImageToAliOss(classId, examRecordDataId, filePath) {
  const option = {
    url: `${Main.host}api/k12/wx/${classId}/${examRecordDataId}/uploadImageToAliOss`,
    filePath: filePath,
    header: header,
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
    url: `${Main.host}/api/k12/ecs_oe_student/soe/uploadMp3ToAliOss`,
    filePath: filePath,
    header: header,
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
    header: header,
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
    header: header,
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
    header: header,
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
    header: header,
    data: {
      examId,
      examStudentId
    }
  }
  return formatErrOrRes(await uni.request(option))
}