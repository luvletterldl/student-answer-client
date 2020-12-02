<template>
  <view class="container">
    <class-top-base-info
      :answerGuideIndex="answerGuideIndex"
      :className="className"
      :courseName="courseName"
      :currentLessonNumber="currentLessonNumber"
    />
    <view class="answer-panel">
      <topic-switch
        :answerGuideIndex="answerGuideIndex"
        @switchTopic="switchTopic"
        @showOrHideTopicOverview="showOrHideTopicOverview"
        :currentTopicTimeCost="currentTopicTimeCost"
        :questionList="questionList"
        :currentTopic="currentTopic"
        :currentTopicIndex="currentTopicIndex"
        :duration="duration"
        :remineTime="remineTime"
        :showTopicTab="showTopicTab"
      />
      <topic-tab
        v-if="showTopicTab === true"
        :questionList="questionList"
        @chooseQuestion="chooseQuestion"
      />
      <view
        class="topic-list"
        :style="answerGuideIndex === 2 ? 'z-index: 101' : 'z-index: 0'"
      >
        <view v-if="currentTopic.hasSub === true" class="topic-body">
          <view class="ques-top-body">
            <text class="ques-type">{{ fmtQuestionType }}</text>
            <text class="quest-index">{{ currentTopicIndex + 1 }}、</text>
            <!--  #ifndef H5 -->
            <rich-text
              class="questBody"
              :nodes="fmtRichTextImg(currentTopic.quesBody)"
            />
            <!--  #endif -->
            <!--  #ifdef H5 -->
            <view
              class="questBody"
              v-html="fmtRichTextImg(currentTopic.quesBody)"
            />
            <!--  #endif -->
            <custom-audio
              v-if="
                currentTopic.audioLink !== null && currentTopic.audioLink !== ''
              "
              :audioSrc="currentTopic.audioLink"
            />
            <topic-body
              v-for="(ques, index) in currentTopic.subQuestions"
              :key="index"
              :subQuesIndex="index"
              :questionIndex="index"
              :question="ques"
              v-on:updateQuestionList="updateQuestionList"
              :examId="examId"
              :examRecordDataId="examRecordDataId"
              :userId="userId"
              :studentId="studentId"
              :time="timeLimitList[currentTopicIndex]"
              :storeFlag="storeFlag"
              v-on:storedTopic="storedTopic"
              :submitFlag="submitFlag"
              v-on:updateSubmitFlag="updateSubmitFlag"
              :showSpokenAnswer="showSpokenAnswer"
              v-on:showExitBtnAction="showExitBtnAction"
            />
          </view>
        </view>
        <view v-else-if="currentTopic.hasSub === false" class="topic-body">
          <topic-body
            :question="currentTopic"
            :questionIndex="currentTopicIndex"
            v-on:updateQuestionList="updateQuestionList"
            :examId="examId"
            :examRecordDataId="examRecordDataId"
            :userId="userId"
            :studentId="studentId"
            :time="timeLimitList[currentTopicIndex]"
            :storeFlag="storeFlag"
            v-on:storedTopic="storedTopic"
            :submitFlag="submitFlag"
            v-on:updateSubmitFlag="updateSubmitFlag"
            :showSpokenAnswer="showSpokenAnswer"
            v-on:showExitBtnAction="showExitBtnAction"
          />
        </view>
      </view>
      <view
        class="submit-store"
        :style="answerGuideIndex === 3 ? 'z-index: 101' : 'z-index: 10'"
      >
        <button @click="submitTopic" class="submit-topic">上交</button>
        <button @click="storeTopic" class="store-submit">暂存</button>
      </view>
    </view>
    <default-answer-page-view v-if="showDefaultView" />
    <view v-if="showExitBtn" class="exit u-flex u-col-center u-row-around">
      <navigator class="exitBtn" open-type="exit" target="miniProgram"
        >退出答题</navigator
      >
      <text v-if="canRestart" @click="restartAction(true)" class="exitBtn"
        >重做</text
      >
    </view>
    <auth-login
      :account.sync="account"
      :examId="examId"
      :needLogin="needLogin"
      v-on:authLoginSuccess="authLoginSuccess"
      v-on:authLoginSuccessUpdateId="authLoginSuccessUpdateId"
    />
    <answer-guide
      :showAnswerGuide="showAnswerGuide"
      v-on:answerGuideChangeStep="answerGuideChangeStep"
      v-on:hideAnswerGuide="hideAnswerGuide"
    />
    <cover-view
      v-if="cameraCtx !== null && !faceCheckStatus && faceSnapshot"
      @touchmove="cameraTouchMove"
      :style="{ top: cameraTop, right: cameraRight }"
      class="snap-camera"
    >
      <camera
        v-if="cameraCtx !== null && !faceCheckStatus && faceSnapshot"
        class="capture-face"
        device-position="front"
        flash="off"
        resolution="low"
        @error="binderror"
        @initdone="bindinitdone"
      />
    </cover-view>
    <before-exam-camera
      v-if="faceCheckStatus"
      :examId="examId"
      :userId="userId"
      :examRecordDataId="examRecordDataId"
      :account="account"
      :cameraCtx="cameraCtx"
      :onShow="invokeBeforeExamCameraShow"
      v-on:initExam="initExam"
    />
  </view>
</template>

<script>
import ClassTopBaseInfo from "../../components/ClassTopBaseInfo/ClassTopBaseInfo";
import CustomAudio from "../../components/CustomAudio/CustomAudio";
import RecorderPanel from "../../components/RecorderPanel/RecorderPanel";
import TopicBody from "../../components/Topic/TopicBody";
import TopicSwitch from "../../components/Topic/TopicSwitch";
import TopicTab from "../../components/Topic/TopicTab";
import AuthLogin from "../../components/AuthLogin/AuthLogin";
import AnswerGuide from "../../components/CustomGuide/AnswerGuide";
import DefaultAnswerPageView from "../../components/DefaultAnswerPageView/DefaultAnswerPageView";
import BeforeExamCamera from "../../components/BeforeExamCamera/BeforeExamCamera";
import { QuestionType, ChoiceOption, ExamType } from "../../lib/Enumerate";
import {
  parseParamsFromUrl,
  formatQuestionType,
  formatSecondToHHmmss,
  fmtSecToMin,
  formatRichTextImg,
  authCameraTips,
} from "../../lib/Utils";
import Main from "../../lib/Main";
import {
  findClsAndCourseByClassIdAndCourseId,
  pageAssignment,
  startExam,
  getQuestions,
  findExamQuestionList,
  examSubmit,
  currentServerTime,
  endExam,
  examHeartbeat,
  header,
  restartExam,
  checkExamInProgress,
  uploadImageToAliOss,
  lockTerminalLock,
  uploadFaceToAliOss,
  isFaceCheck,
  examFaceEnable,
  examFaceCheck,
  uploadExamCapture,
  examSnapshotInterval,
  uploadFaceCheckServeCallback,
} from "../../lib/Api";
const { windowWidth, windowHeight } = uni.getSystemInfoSync();
export default {
  components: {
    ClassTopBaseInfo,
    TopicSwitch,
    TopicTab,
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
      className: "",
      courseName: "",
      currentLessonNumber: "",
      showAnswerPanel: false, // 展示答题面板
      showTopicTab: false, // 展示题目Tab
      assignmentInfo: {},
      questionList: [], // 题目列表
      currentTopicIndex: 0, // 当前题目索引
      ChoiceOption,
      QuestionType, // 题目类型
      questionType: "", // 传进来的题目类型，如果isAnswering是true，过滤掉除此之外的其他类型的题目
      selectedOptions: [], // 选择题选中的索引列表
      boolStudentAnswer: null, // 判断题
      timeLimitList: [], // 限时列表
      duration: null, // 剩余考试时间（分钟）
      durationSeconds: 1, // 剩余考试时间（秒）
      remineTime: "", // 剩余考试时间
      timer: 0, // 计时器,
      countdownTimer: 0, // 考试剩余时间计时器
      snapshotTimer: 0, // 抓拍计时器
      storeFlag: false, // 暂存标识
      submitFlag: -1, // 提交标识 默认状态：-1；上交作业中： 0；上交完毕： 1
      isAnswering: null, // true: 表明已经在其他终端开始作答，本终端不能上交； false: 在本终端开启作答，可以在本终端上交
      restart: null, // 是否是重刷
      account: "", // 用户的账户
      needLogin: false, // 是否需要先进行用户认证
      showAnswerGuide: false, // 是否显示答题引导,
      answerGuideIndex: -1, // 当前引导的步骤
      showSpokenAnswer: 1, // 1:实时显示口语题答案 0:不实时显示口语题
      source: "", // OE OA
      examType: "", // 考试类型,
      canRestart: false, // 是否展示可以重做
      cameraCtx: null, // 获取相机实例
      cameraTop: "0vh", // 悬浮相机距离顶部距离
      cameraRight: "0vw", // 悬浮相机距离右侧距离
      faceEnableStatus: false, // 是否开启监考
      faceCheckStatus: false, // 人脸检测是否展示
      faceSnapshot: false, // 是否开启抓拍
      invokeBeforeExamCameraShow: 0, // 通过在BeforeExamCamera中监听此状态是否变化来展示camera组件
      compareFaceResponse: null, // 对比人脸之后返回的数据
    };
  },
  computed: {
    // 当前题目
    currentTopic() {
      if (
        this.questionList === null ||
        this.questionList.length === 0 ||
        this.questionList === undefined ||
        this.questionList[this.currentTopicIndex] === undefined
      ) {
        return {};
      } else {
        // 改变全局变量中的当前题目类型
        getApp().globalData.currentQuestionType =
          this.questionList.length > 0
            ? this.questionList[this.currentTopicIndex].questionType
            : "";
        return this.questionList.length > 0
          ? this.questionList[this.currentTopicIndex]
          : "";
      }
    },
    // 题目类型
    fmtQuestionType() {
      return formatQuestionType(this.currentTopic);
    },
    // 当前题目耗时
    currentTopicTimeCost() {
      if (this.timeLimitList.length > 0) {
        return fmtSecToMin(this.timeLimitList[this.currentTopicIndex]);
      }
    },
  },
  watch: {
    // 如果是套题 需要把submitFlag重置为-1
    currentTopicIndex(newIndex, oldIndex) {
      this.questionList.length > 0
        ? (this.submitFlag = -1)
        : console.log("submitFlag", this.submitFlag);
    },
    // 如果全部提交成功就交卷
    submitFlag(newFlag, oldFlag) {
      typeof newFlag === "number" && newFlag === 1
        ? this.submitTopicAction()
        : console.log("watch submitFlag number", newFlag);
    },
    // 如果有总限时的话到时自动交卷
    durationSeconds(newSec, oldSec) {
      newSec <= 0 && this.duration !== null
        ? () => {
            uni.showToast({
              title: "答题时间到！",
              icon: "none",
            });
            this.endExamAction();
          }
        : () => {};
    },
    // 当开始或者重开或者断点续考之后获取人脸识别对比数据
    examRecordDataId(newId, oldId) {
      getApp().globalData.examRecordDataId = newId !== 0 ? newId : 0; // 更新全局数据
    },
  },
  onLoad(options) {
    uni.getStorageSync("answerGuide") === ""
      ? this.startAnswerGuide()
      : () => {}; // 判断是否是第一次使用
    // 调试时打开这句注释下句
    const url = "https://test.xiaocongkj.com/?token=ccdf82b60c4347f4a0eae65223dbb2b6&key=U_E_17_11933&userId=11933&studentId=11964&examId=3180&mainNum=1&className=0911四班&courseName=0831教研二&currentLessonNumber=第1课次&isAnswering=false&account=15911111109&source=OE&examType=Exercise&restart=false";
    // #ifndef H5
    // const url = decodeURIComponent(options.q);
    // #endif
    // #ifdef H5
    // const url = decodeURIComponent(location.href);
    // #endif
    const q = decodeURIComponent(url);
    console.log("options", q, options);
    const p =
      q !== undefined && q !== "" && q !== null ? parseParamsFromUrl(q) : "";
    if (
      // 'token' in p &&
      // 'key' in p &&
      "mainNum" in p &&
      "className" in p &&
      "courseName" in p &&
      // 'currentLessonNumber' in p &&
      "examId" in p &&
      // 'examRecordDataId' in p &&
      // 'studentId' in p &&
      // 'userId' in p &&
      "isAnswering" in p &&
      "source" in p
    ) {
      const {
        token,
        key,
        mainNum,
        className,
        currentLessonNumber,
        courseName,
        examId,
        studentId,
        userId,
        isAnswering,
        source,
      } = p;
      header.key = key;
      header.token = token;
      this.showDefaultView = false;
      this.currentTopicIndex = Number(mainNum) - 1;
      this.className = className;
      this.courseName = courseName;
      this.currentLessonNumber = currentLessonNumber;
      this.examId = Number(examId);
      this.examRecordDataId =
        "examRecordDataId" in p ? Number(p.examRecordDataId) : 0;
      this.studentId = "studentId" in p ? Number(studentId) : 0;
      this.userId = "userId" in p ? Number(userId) : 0;
      this.isAnswering = isAnswering.includes("true")
        ? true
        : isAnswering.includes("false")
        ? false
        : null;
      this.source = source;
      this.examType = "examType" in p ? p.examType : "";
      // 如果属于预习，作业，进门测，课堂练习中的一种则当前考试可以重做
      this.canRestart = this.examType in ExamType ? true : false;
      this.restart = "restart" in p && p.restart.includes("true") ? true : null; // 如果restart是true，则赋值
      this.questionType =
        "questionType" in p && this.isAnswering ? p.questionType : "";
      Main.examId = this.examId;
      Main.userId = this.userId;
      getApp().globalData.currentExamType = this.examType; // 全局设置当前考试类型
      getApp().globalData.isAnswering = this.isAnswering; // 全局设置当前考试是否是其他终端正在作答中
      getApp().globalData.source = source; // 全局指定题目来源
      getApp().globalData.authStatus = this.isAnswering ? true : null; // 如果isAnswing是true，则全局验证字段为true
      // 如果是正在答题中先获取是否需要开启监考，如果需要获取抓拍间隔，如果没有抓拍间隔则不抓拍
      if (this.isAnswering) {
        this.judgeIsSnapshot();
      }
      if (this.account === "") {
        if (!this.isAnswering) {
          this.account = "account" in p ? p.account : "";
          this.needLogin = true;
        } else {
          this.initExam();
        }
      }
    } else {
      this.showDefaultView = true;
    }
  },
  onShow() {
    const currentFillAnswer = getApp().globalData.currentFillAnswer;
    getApp().globalData.legalHideAction = false;
    if (currentFillAnswer.order !== 0) {
      const params = JSON.stringify({
        order: currentFillAnswer.order,
        studentAnswer: currentFillAnswer.studentAnswer,
      });
      this.updateQuestionList(params);
    }
    if (this.faceCheckStatus) {
      this.invokeBeforeExamCameraShow += 1;
    }
  },
  beforeDestroy() {
    this.clearIntervals();
  },
  methods: {
    /**
     * 考试初始化
     */
    initExam(resp) {
      this.faceCheckStatus = false;
      if (resp) {
        this.compareFaceResponse = resp;
      }
      if (this.source === "OE" && this.isAnswering) {
        if (this.examRecordDataId === 0) {
          findExamQuestionList(this.examId, this.userId).then((res) => {
            this.examRecordDataId = res[0].examRecordDataId;
            if (this.isAnswering) {
              this.lockTerminalAction();
            }
          });
        } else {
          this.lockTerminalAction();
        }
      } else {
        this.examInProgressHandler();
      }
    },
    /**
     * 更新比对人脸响应中需要的ExamRecordDataId
     */
    updateCompareFaceResponseExamRecordDataId() {
      if (this.compareFaceResponse !== null && this.examRecordDataId !== 0) {
        this.compareFaceResponse.examRecordDataId = this.examRecordDataId;
        uploadFaceCheckServeCallback(this.compareFaceResponse);
      }
    },
    /**
     *  锁终端操作，成功后继续考试
     */
    lockTerminalAction() {
      this.updateCompareFaceResponseExamRecordDataId();
      lockTerminalLock(
        this.userId,
        this.studentId,
        this.examId,
        this.examRecordDataId,
        this.examType,
        this.questionType
      ).then((resp) => {
        console.log("lockTerminalLock", resp);
        // 加锁成功后加载考试的数据，开始作答
        this.continueExam();
      });
    },
    /**
     * 检测当前考试是否需要断点续考
     */
    examInProgressHandler() {
      uni.showLoading();
      checkExamInProgress()
        .then((res) => {
          uni.hideLoading();
          console.log("checkExamInProgress", res);
          const {
            showSoe,
            examId,
            isExceed,
            maxInterruptNum,
            snapshotInterval,
          } = res;
          if (
            this.examType === ExamType.K12_ONLINE_EXAM &&
            showSoe !== undefined
          ) {
            this.showSpokenAnswer = showSoe;
          }
          if (examId === this.examId) {
            if (isExceed) {
              uni.showToast({
                title: `超出最大断点续考次数(${maxInterruptNum}),正在自动交卷...`,
                icon: "none",
              });
              setTimeout(() => {
                this.endExamAction();
              }, 2000);
            } else {
              uni.showToast({
                title: "正在进入断点续考...",
                icon: "none",
              });
              if (this.examRecordDataId === 0) {
                findExamQuestionList(this.examId, this.userId).then((resp) => {
                  this.examRecordDataId = resp[0].examRecordDataId;
                  this.judgeIsSnapshot();
                  this.updateCompareFaceResponseExamRecordDataId();
                });
              } else {
                this.judgeIsSnapshot();
                this.updateCompareFaceResponseExamRecordDataId();
              }
              this.continueExam();
            }
          } else {
            this.startOrRestartAction();
          }
        })
        .catch(() => {
          uni.hideLoading();
        });
    },
    /**
     * 继续考试
     */
    continueExam() {
      examHeartbeat(this.examId).then((resp) => {
        console.log("examHeartbeat", resp);
        this.durationSeconds = resp / 1000;
        this.duration = Math.floor(this.durationSeconds / 60);
        this.countdownTimer = setInterval(() => {
          this.durationSeconds -= 1;
          const remineTime = formatSecondToHHmmss(this.durationSeconds);
          this.remineTime = `${remineTime.hour}:${remineTime.min}:${remineTime.second}`;
        }, 1000);
      });
      this.updateQuestionList().then(() => {
        this.timeLimitList = new Array(this.questionList.length).fill(0);
        this.timer = setInterval(() => {
          const newTime = this.timeLimitList[this.currentTopicIndex] + 1;
          this.timeLimitList.splice(this.currentTopicIndex, 1, newTime);
        }, 1000);
      });
    },
    /**
     * 开始或者重做
     */
    startOrRestartAction() {
      uni.showLoading();
      if (this.restart === true) {
        restartExam(this.examId, this.userId)
          .then((res) => {
            uni.hideLoading();
            this.startOrRestartExamCallback(res);
          })
          .catch(() => {
            uni.hideLoading();
          });
      } else {
        startExam(this.examId, this.userId)
          .then((res) => {
            uni.hideLoading();
            this.startOrRestartExamCallback(res);
          })
          .catch(() => {
            uni.hideLoading();
          });
      }
    },
    /**
     * 重做
     */
    restartAction(isEndExam) {
      this.clearIntervals();
      if (isEndExam) {
        restartExam(this.examId, this.userId).then((resp) => {
          this.questionList = [];
          this.currentTopicIndex = 0;
          this.startOrRestartExamCallback(resp);
          this.showExitBtn = false;
          getApp().globalData.authStatus = true;
        });
      } else {
        uni.showModal({
          title: "提示",
          content: "当前答案会被上交，确定要重做吗？",
          success: (res) => {
            if (res.confirm) {
              this.clearIntervals();
              console.log("confirm");
              this.endExamAction(true).then(() => {
                restartExam(this.examId, this.userId).then((resp) => {
                  this.questionList = [];
                  this.currentTopicIndex = 0;
                  this.startOrRestartExamCallback(resp);
                  uni.showToast({
                    title: "开始重做",
                    icon: "success",
                  });
                  this.showOrHideTopicOverview();
                  getApp().globalData.authStatus = true;
                });
              });
            }
          },
        });
      }
    },
    /**
     * 开始或者重做的回调
     */
    startOrRestartExamCallback(res) {
      console.log("startExam", res);
      if (res.code !== undefined && res.code !== "0" && res.code !== 0) {
      } else {
        const { examRecordDataId, duration, showSoe, snapshotInterval } = res;
        this.examRecordDataId = examRecordDataId;
        this.duration = duration;
        this.judgeIsSnapshot();
        if (this.examType === ExamType.K12_ONLINE_EXAM) {
          this.showSpokenAnswer = showSoe;
        }
        if (duration > 0) {
          this.durationSeconds = duration * 60;
          this.countdownTimer = setInterval(() => {
            this.durationSeconds -= 1;
            const remineTime = formatSecondToHHmmss(this.durationSeconds);
            this.remineTime = `${remineTime.hour}:${remineTime.min}:${remineTime.second}`;
          }, 1000);
        }
        this.updateQuestionList().then(() => {
          this.timeLimitList = new Array(this.questionList.length).fill(0);
          this.timer = setInterval(() => {
            const newTime = this.timeLimitList[this.currentTopicIndex] + 1;
            this.timeLimitList.splice(this.currentTopicIndex, 1, newTime);
          }, 1000);
        });
      }
    },
    /**
     * 更新考试题目列表数据
     */
    updateQuestionList(params) {
      console.log("updateQuestionList params", params);
      if (params) {
        const data = JSON.parse(params);
        const questionList = JSON.parse(JSON.stringify(this.questionList));
        questionList.forEach((ques, i) => {
          if (ques.hasSub) {
            const subQuestions = ques.subQuestions;
            subQuestions.forEach((subQues, j, arr) => {
              if (data.order === subQues.order) {
                console.log(data, subQues);
                subQuestions[j].studentAnswer = data.studentAnswer;
                if (
                  subQuestions[j].questionType ===
                  QuestionType.SPOKEN_ANSWER_QUESTION
                ) {
                  subQuestions[j].evaluation = data.evaluation;
                }
                this.questionList.splice(i, 1, questionList[i]);
                console.log(this.questionList);
              }
            });
          } else {
            if (data.order === ques.order) {
              questionList[i].studentAnswer = data.studentAnswer;
              if (
                questionList[i].questionType ===
                QuestionType.SPOKEN_ANSWER_QUESTION
              ) {
                questionList[i].evaluation = data.evaluation;
              }
              this.questionList.splice(i, 1, questionList[i]);
            }
          }
        });
        getApp().globalData.currentFillAnswer.order = 0; // 刷新questionList后重置currentFillAnswer
        console.log("questionList", questionList, this.questionList);
      } else {
        return getQuestions(this.examId, this.userId).then((res) => {
          console.log("getQuestions", res);
          const { code, data } = res;
          if (code === "E_K12-OE_S2001") {
            uni.showToast({ title: desc, icon: "none" });
            return;
          } else {
            // 如果是从网考答题中扫码进来过滤出扫码题目类型的题
            const type = this.questionType;
            if (this.isAnswering && type !== "") {
              this.questionList = data.filter((question) => {
                if (question.hasSub) {
                  const subQuesList = question.subQuestions;
                  const filteredSubQuesList = subQuesList.filter((subQues) => {
                    if (subQues.questionType === type) return subQues;
                  });
                  console.log("filteredSubQuesList", filteredSubQuesList);
                  if (filteredSubQuesList.length > 0) {
                    question.subQuestions = filteredSubQuesList;
                    return question;
                  }
                } else if (question.questionType === type) {
                  return question;
                }
              });
              this.currentTopicIndex = this.questionList.findIndex(
                (question) => {
                  return this.currentTopicIndex === question.mainNum;
                }
              );
              if (this.currentTopicIndex === -1) {
                this.currentTopicIndex = 0;
              }
            } else {
              this.questionList = data;
            }
          }
        });
      }
    },
    /**
     * 左右切换题目
     */
    switchTopic(dir) {
      const { audioPlaying, audioRecording } = getApp().globalData;
      if (audioPlaying || audioRecording) {
        const title = audioRecording ? "请先结束录音" : "请先暂停音频播放";
        uni.showToast({ title, icon: "none" });
        return false;
      } else {
        const newIndex = dir
          ? this.currentTopicIndex + 1
          : this.currentTopicIndex - 1;
        this.currentTopicIndex =
          newIndex > this.questionList.length - 1
            ? 0
            : newIndex < 0
            ? this.questionList.length - 1
            : newIndex;
      }
    },
    /**
     * 展示或隐藏总览
     */
    showOrHideTopicOverview() {
      this.showTopicTab = !this.showTopicTab;
    },
    /**
     * 选择某一题
     */
    chooseQuestion(index) {
      this.currentTopicIndex = index;
      this.showOrHideTopicOverview();
    },
    /**
     * 对富文本中的图片进行处理
     */
    fmtRichTextImg(nodes) {
      return formatRichTextImg(nodes);
    },
    /**
     * 子组件暂存成功重置状态
     */
    storedTopic() {
      this.storeFlag = false;
    },
    /**
     * 触发子组件暂存
     */
    storeTopic() {
      this.switchTopic(true);
      uni.showToast({
        title: "暂存成功",
        icon: "success",
      });
    },
    /**
     * 点击上交
     */
    submitTopic() {
      if (this.isAnswering) {
        uni.showModal({
          title: "提示",
          content: "请在原终端进行提交!",
          showCancel: false,
        });
        return false;
      }
      console.log("submitTopic", this.submitFlag);
      this.submitFlag === -1 ? (this.submitFlag = 0) : this.submitTopicAction();
    },
    /**
     * 子组件提交题目完成后调用改变submitFlag为1，触发watch中的结束考试操作
     */
    updateSubmitFlag(data) {
      console.log("updateSubmitFlag", data, this.submitFlag);
      this.submitFlag === 0 ? (this.submitFlag = 1) : () => {};
    },
    /**
     * 结束考试
     */
    endExamAction(unShowExit) {
      uni.showLoading({ title: "上交中..." });
      return endExam(this.examId, this.userId).then((res) => {
        uni.hideLoading();
        if (res.code === "E_K12-OE_M3001") {
          uni.showToast({ title: res.desc, icon: "none" });
          return;
        } else {
          uni.showToast({ title: "提交成功", icon: "success" });
          this.clearIntervals();
          if (!unShowExit) {
            this.showExitBtnAction();
            getApp().globalData.authStatus = null;
          }
          typeof this.submitFlag === "number"
            ? (this.submitFlag = -1)
            : () => {};
        }
        console.log("endExam", res);
      });
    },
    /**
     * 展示退出按钮
     */
    showExitBtnAction() {
      this.showExitBtn = true;
    },
    /**
     * 上交前拦截判断
     */
    submitTopicAction() {
      const that = this;
      uni.showModal({
        title: "确定要上交吗",
        content: "作业上交后将无法继续作答，如需继续作答，请切换至下一题",
        confirmText: "上交",
        success(res) {
          if (res.confirm) {
            that.endExamAction();
          }
          if (res.cancel) {
            uni.showModal({
              title: "提示",
              content: "是否需要查看操作指引？",
              confirmText: "需要",
              cancelText: "不需要",
              success(resp) {
                resp.confirm ? that.startAnswerGuide() : () => {};
              },
            });
            that.submitFlag === 1 ? (that.submitFlag = -1) : () => {};
          }
        },
      });
    },
    /**
     * 登录成功后刷新studentId和userId
     */
    authLoginSuccessUpdateId(studentId, userId) {
      Main.userId = userId;
      this.studentId = studentId;
      this.userId = userId;
    },
    /**
     * 用户认证成功回调
     */
    authLoginSuccess(faceEnable) {
      // 如果需要考试前认证先不初始化
      this.needLogin = false;
      // 检查考试是否需要开启监考，是否需要开启人脸检查
      console.log("authLoginSuccess", faceEnable);
      if (faceEnable && !this.restart) {
        const that = this;
        uni.authorize({
          scope: "scope.camera",
          success(resp) {
            getApp().globalData.legalHideAction = false;
          },
          fail(err) {
            getApp().globalData.legalHideAction = true;
            authCameraTips();
          },
        });
        this.faceEnableStatus = true;
        // examFaceCheck(2709).then((res) => {
        examFaceCheck(this.examId).then((res) => {
          console.log("examFaceCheck", res);
          res === 1 ? (this.faceCheckStatus = true) : this.initExam();
        });
      } else {
        this.initExam();
      }
    },
    /**
     * 清除定时器
     */
    clearIntervals() {
      clearInterval(this.timer);
      clearInterval(this.countdownTimer);
      clearInterval(this.snapshotTimer);
    },
    /**
     * 考试引导
     */
    startAnswerGuide() {
      this.showAnswerGuide = true;
      this.answerGuideChangeStep(0);
    },
    /**
     * 引导步数
     */
    answerGuideChangeStep(index) {
      this.answerGuideIndex = index;
    },
    /**
     * 隐藏引导
     */
    hideAnswerGuide() {
      this.answerGuideIndex = -1;
      this.showAnswerGuide = false;
      uni.setStorageSync("answerGuide", "1");
    },
    /**
     * 拍照上传之后评估（uploadExamCapture）
     */
    takePhoto(needUpload = true) {
      const takePhotoAction = () => {
        return this.cameraCtx
          .takePhoto()
          .then((res) => {
            const tempPath = res.tempImagePath;
            console.log("takePhoto", tempPath);
            if (needUpload) {
              uploadFaceToAliOss(this.examRecordDataId, tempPath).then(
                (path) => {
                  console.log("uploadFaceToAliOss", path);
                  if (getApp().globalData.authStatus) {
                    uploadExamCapture(
                      this.examRecordDataId,
                      this.examId,
                      this.userId,
                      path
                    );
                  }
                }
              );
            }
            return res.tempImagePath;
          })
          .catch((err) => {
            console.log("takePhoto Err", err);
          });
      };
      if (this.cameraCtx === null) {
        this.cameraCtx = uni.createCameraContext();
      }
      return takePhotoAction();
    },
    /**
     * camera组件初始化失败回调
     */
    binderror(e) {
      console.log("binderror", e);
      this.cameraCtx = null;
      authCameraTips();
    },
    /**
     * camera组件初始化成功回调
     */
    bindinitdone(e) {
      this.cameraCtx = uni.createCameraContext();
      console.log("bindinitdone", e);
    },
    /**
     * 相机移动事件处理
     */
    cameraTouchMove(e) {
      const { clientX, clientY, pageX, pageY } = e.touches[0];
      const x = Math.floor(clientX === 0 ? pageX : clientX);
      const y = Math.floor(clientY === 0 ? pageY : clientY);
      if (Math.abs(x) % 2 === 0 || Math.abs(y) % 3 === 0) {
        this.cameraRight =
          x >= 0.8 * windowWidth
            ? "0vw"
            : x <= 0.2 * windowWidth
            ? "80vw"
            : Math.floor(((windowWidth - x) / windowWidth) * 100) + "vw";
        this.cameraTop =
          y >= 0.8 * windowHeight
            ? "80vh"
            : y <= 0.2 * windowHeight
            ? "0vh"
            : Math.floor((y / windowHeight) * 100) + "vh";
      }
    },
    /**
     * 判断当前考试要不要开启抓拍
     */
    judgeIsSnapshot() {
      if (this.restart) {
        return;
      } else {
        examFaceEnable(this.examId).then((res) => {
          if (res === 1) {
            this.faceEnableStatus = true;
            examSnapshotInterval(this.examId).then((snapshotInterval) => {
              this.snapshotHandler(snapshotInterval);
            });
          }
        });
      }
    },
    /**
     * 抓拍操作
     */
    snapshotHandler(snapshotInterval) {
      console.log("snapshotHandler", snapshotInterval);
      if (snapshotInterval && snapshotInterval > 0) {
        // if (true) {
        this.faceSnapshot = true;
        this.takePhoto(false);
        this.snapshotTimer = setInterval(() => {
          // TODO 每隔minutes分钟抓拍一次
          this.takePhoto();
        }, Math.floor(Number(snapshotInterval) * 60) * 1000);
        // }, 10000)
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.answer-panel {
  .topic-list {
    position: relative;
    z-index: 0;
    box-shadow: 0px 0px 10px 0px rgba(220, 228, 246, 1);
    width: 90vw;
    margin: 2vw 5vw 15vh 5vw;
    background: #fff;
    border-radius: 8px;
    color: $blackcolor;
    .ques-top-body {
      padding: 3vw;
      background: #fff;
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
    .options,
    .fill-blank {
      display: flex;
      flex-flow: column;
      color: #666d88;
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
          color: #acb9d1;
          background: linear-gradient(
            315deg,
            rgba(216, 225, 243, 1) 0%,
            rgba(243, 246, 252, 1) 100%
          );
        }
        .selected-option {
          color: #fff;
          background: $default-bluelinearbg;
        }
        .fill-topic-img {
          border-radius: 2vw;
          border: 1px solid #f3f6fc;
        }
      }
    }
    .true-false {
      display: flex;
      flex-flow: row;
      justify-content: space-evenly;
      padding: 1vw;
      .correct,
      .error {
        color: #fff;
        font-size: 4.2vw;
        padding: 2.5vw 8vw 2.5vw 15vw;
        background: rgba(6, 6, 6, 0.3);
        border-radius: 5vw;
        &::before {
          content: "";
          position: absolute;
          margin: 1vw 0 0 -6vw;
          background: url("../../static/images/icon_correct.png") no-repeat;
          width: 5vw;
          height: 4vw;
          background-size: 100% 100%;
        }
      }
      .error::before {
        content: "";
        position: absolute;
        margin: 1vw 0 0 -6vw;
        background: url("../../static/images/icon_error.png") no-repeat;
        width: 4.2vw;
        height: 4.3vw;
        background-size: 100% 100%;
      }
      .upToCorrect {
        background: $default-bluelinearbg;
      }
      .upToError {
        background: linear-gradient(
          180deg,
          rgba(255, 143, 140, 1) 0%,
          rgba(255, 111, 119, 1) 100%
        );
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
    background: #fff;
    left: 0;
    z-index: 10;
    .submit-topic,
    .store-submit {
      padding: 0 15vw;
      color: #fff;
      border-radius: 10vw;
      border: none;
    }
    .store-submit {
      background: linear-gradient(
        180deg,
        rgba(215, 222, 241, 1) 0%,
        rgba(193, 205, 229, 1) 100%
      );
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
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  .exitBtn {
    color: #fff;
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
  box-shadow: 0 0 0 2.5vw #fff inset;
  border: solid 1px rgba(0, 0, 0, 0.3);
  .capture-face {
    z-index: 10;
    margin: 2.5vw;
    width: 15vw;
    height: calc(20vh - 5vw);
  }
}
</style>