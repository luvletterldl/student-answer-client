import { QuestionType } from './Enumerate'

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

export function formatSecondToMinSecond(time) {
  if (time < 60) {
    return {
      min: 0,
      second: time
    }
  } else {
    return {
      min: Math.floor(time / 60),
      second: time % 60
    }
  }
}

export function formatRichTextImg(nodes) {
  return nodes.replace(/<img/g, '<img style="width: 80vw"')
}