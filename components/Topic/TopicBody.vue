<template>
  <view class="topic-body">
    <view class="ques-top-body">
      <text class="ques-type">{{ fmtQuestionType }}</text>
      <text class="quest-index">{{ questionIndex + 1 }}、</text>
      <!--  #ifndef H5 -->
      <rich-text class="questBody" :nodes="fmtRichTextImg(question.quesBody)" />
      <!--  #endif -->
      <!--  #ifdef H5 -->
      <view class="questBody" v-html="fmtRichTextImg(question.quesBody)" />
      <!--  #endif -->
      <custom-audio
        v-if="question.audioLink !== null && question.audioLink !== ''"
        :audioSrc="question.audioLink"
      />
    </view>
    <view
      v-if="
        question.questionType === QuestionType.SINGLE_ANSWER_QUESTION ||
        question.questionType === QuestionType.MULTIPLE_ANSWER_QUESTION
      "
      class="options"
    >
      <view
        @click="chooseSelectItem(question, index)"
        v-for="(option, index) in question.quesOptions"
        :key="index"
        class="option"
      >
        <view
          class="option-index"
          :class="selectedOptions.includes(index) ? 'selected-option' : ''"
          >{{ ChoiceOption[index] }}</view
        >
        <!--  #ifndef H5 -->
        <rich-text
          :nodes="fmtRichTextImg(option.quesBody || option.optionBody)"
        />
        <!--  #endif -->
        <!--  #ifdef H5 -->
        <view v-html="fmtRichTextImg(option.quesBody || option.optionBody)" />
        <!--  #endif -->
      </view>
    </view>
    <view
      v-if="question.questionType === QuestionType.BOOL_ANSWER_QUESTION"
      class="true-false"
    >
      <view
        @click="selectBoolAnswer(true, question)"
        class="correct"
        :class="trueOrFalse(question) === true ? 'upToCorrect' : ''"
        >正确</view
      >
      <view
        @click="selectBoolAnswer(false, question)"
        class="error"
        :class="trueOrFalse(question) === false ? 'upToError' : ''"
        >错误</view
      >
    </view>
    <view
      v-if="question.questionType === QuestionType.FILL_BLANK_QUESTION"
      class="fill-blank"
    >
      <view
        @click="toFillAnswer(fmtFillAnswer(question), index)"
        v-for="(item, index) in fmtFillAnswer(question)"
        :key="index"
        class="option"
      >
        <view class="option-index">{{ index + 1 }}</view>
        <text v-if="item === ''">点击输入</text>
        <image
          v-else-if="isImage(item)"
          :src="`${Main.host}/api/k12/wx/getImage?filePath=${item}`"
          class="fill-topic-img"
        />
        <view v-else-if="!isImage(item)" class="text-text">{{
          fillAnswer[index]
        }}</view>
      </view>
    </view>
    <view
      v-if="question.questionType === QuestionType.TEXT_ANSWER_QUESTION"
      class="text-answer"
    >
      <view
        @click="uploadTextAnswer(question)"
        v-if="question.studentAnswer === null || question.studentAnswer === ''"
        class="default-view"
        >点击拍照上传</view
      >
      <image
        mode="aspectFit"
        @click="uploadTextAnswer(question)"
        v-else-if="isImage(question.studentAnswer)"
        :src="`${Main.host}/api/k12/wx/getImage?filePath=${question.studentAnswer}`"
        alt=""
      />
      <view
        v-else-if="!isImage(question.studentAnswer)"
        class="text-text"
        @click="uploadTextAnswer(question)"
        >{{ question.studentAnswer }}</view
      >
    </view>
    <view
      v-if="question.questionType === QuestionType.SPOKEN_ANSWER_QUESTION"
      class="recorder-panel"
    >
      <view class="record-part">
        <text>音频文本: {{ question.audioText }}</text>
      </view>
      <view class="audio-evoluation">
        <view class="record-desc">{{ recordDesc }}</view>
        <view class="audio-text">
          <custom-audio
            class="recorder-audio"
            v-if="
              question.studentAnswer !== '' && question.studentAnswer !== null
            "
            :audioSrc="question.studentAnswer"
            :showTime="false"
          />
          <image @click="recordAction" :src="recordImg" class="record" />
          <text v-if="showSpokenAnswer === 1" class="evaluationAccuracy">{{
            evaluationAccuracy
          }}</text>
        </view>
        <view v-if="showSpokenAnswer === 1" class="evoluation">
          <!--  #ifndef H5 -->
          <rich-text class="words" :nodes="fmtRichTextImg(evaluationResult)" />
          <!--  #endif -->
          <!--  #ifdef H5 -->
          <view class="words" v-html="fmtRichTextImg(evaluationResult)" />
          <!--  #endif -->
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { QuestionType, ChoiceOption } from "../../lib/Enumerate";
import CustomAudio from "../CustomAudio/CustomAudio";
import {
  uploadMp3ToAliOss,
  getSpokenAnswerResult,
  examSubmit,
  currentServerTime,
  uploadImageToAliOss,
  endExam,
  findExamQuestionList,
  header,
} from "../../lib/Api";
import {
  formatQuestionType,
  formatRichTextImg,
  beforeAudioRecordOrPlay,
  afterAudioRecord,
  resetContentType,
} from "../../lib/Utils";
import iconRecord from "../../static/images/icon_record.png";
import iconRecording from "../../static/images/icon_recording.png";
import Main from "../../lib/Main";
//#ifdef H5
import Recorder from "recorder-core/recorder.mp3.min";
//#endif
export default {
  name: "TopicBody",
  props: {
    question: {
      type: Object,
      reuqired: true,
    },
    subQuesIndex: {
      type: Number,
      reuqired: false,
      default: undefined,
    },
    questionIndex: {
      type: Number,
      reuqired: true,
    },
    updateQuestionList: {
      type: Function,
      reuqired: true,
    },
    examId: {
      type: Number,
      reuqired: true,
    },
    examRecordDataId: {
      type: Number,
      reuqired: true,
    },
    studentId: {
      type: Number,
      reuqired: true,
    },
    userId: {
      type: Number,
      reuqired: true,
    },
    time: {
      type: Number,
      reuqired: true,
    },
    storeFlag: {
      type: Boolean,
      reuqired: true,
    },
    storedTopic: {
      type: Function,
      reuqired: true,
    },
    submitFlag: {
      type: Number,
      reuqired: false,
      default: -1,
    },
    updateSubmitFlag: {
      type: Function,
      reuqired: true,
    },
    showSpokenAnswer: {
      type: Number,
      reuqired: false,
      default: 1,
    },
    showExitBtnAction: {
      type: Function,
    },
  },
  components: {
    CustomAudio,
  },
  data() {
    return {
      QuestionType,
      ChoiceOption,
      selectedOptions: [], // 选择题选中的选项
      boolStudentAnswer: null, // 判断题
      oldBoolStudentAnswer: null, // 判断题之前的作答结果
      rm: undefined, //recordManager
      recordImg: iconRecord,
      recordStatus: 0,
      spokenResult: undefined,
      oldTime: 0,
      oldSelectedOpts: [],
      isNestedAnswer: null,
      Main,
    };
  },
  watch: {
    question: {
      handler(newQues, oldQues) {
        console.log(
          "watchQuestion handler",
          newQues,
          oldQues,
          this.storeFlag,
          this.submitFlag,
          this.isNestedAnswer
        );
        // 防止因为提交 或者套题中提交答案导致无限刷的死循环
        if (!this.storeFlag && this.submitFlag !== 0 && this.submitFlag !== 1) {
          if (oldQues && this.isNestedAnswer === null) {
            console.log(
              "oldQues",
              oldQues,
              "oldQues.questionType",
              oldQues.questionType
            );
            if (
              oldQues.questionType === QuestionType.SINGLE_ANSWER_QUESTION ||
              oldQues.questionType === QuestionType.MULTIPLE_ANSWER_QUESTION
            ) {
              this.submitChoiceAnswer(oldQues);
            } else if (
              oldQues.questionType === QuestionType.BOOL_ANSWER_QUESTION
            ) {
              this.submitBoolAnswer(oldQues);
            }
          }
          if (newQues) {
            console.log(
              "newQues",
              newQues,
              "newQues.questionType",
              newQues.questionType
            );
            const type = newQues.questionType;
            const answer = newQues.studentAnswer;
            if (
              type === QuestionType.SINGLE_ANSWER_QUESTION ||
              type === QuestionType.MULTIPLE_ANSWER_QUESTION
            ) {
              if (answer !== "" && answer !== null && answer !== undefined) {
                console.log("newQues aa", newQues, answer);
                this.selectedOptions = Array.from(
                  answer.replace(/,/g, ""),
                  (v) => {
                    return parseInt(v);
                  }
                );
                console.log("newQues bb", this.selectedOptions);
              } else {
                this.selectedOptions = [];
              }
            }
            if (type === QuestionType.BOOL_ANSWER_QUESTION) {
              this.boolStudentAnswer =
                answer === "true" ? true : answer === "false" ? false : null;
            }
          } else {
            console.log("newQues false", newQues);
          }
        }
      },
      deep: true,
      immediate: true,
    },
    time: {
      handler(newTime, oldTime) {
        this.oldTime = oldTime;
      },
    },
    subQuesIndex: {
      handler(newIndex, oldIndex) {
        if (newIndex !== undefined && newIndex !== 0 && newIndex !== "0") {
          this.isNestedAnswer = true;
        }
      },
      immediate: true,
    },
    submitFlag: {
      handler(newFlag, oldFlag) {
        if (newFlag === 0) {
          const type = this.question.questionType;
          if (
            type === QuestionType.SINGLE_ANSWER_QUESTION ||
            type === QuestionType.MULTIPLE_ANSWER_QUESTION ||
            type === QuestionType.BOOL_ANSWER_QUESTION
          ) {
            this.submitTopicWhenBoolOrChoice();
          }
        }
      },
    },
  },
  computed: {
    fillAnswer() {
      if (this.question.questionType === QuestionType.FILL_BLANK_QUESTION) {
        if (this.question.studentAnswer === null) {
          return "";
        } else {
          return this.question.studentAnswer.split("##");
        }
      }
    },
    fmtQuestionType() {
      return formatQuestionType(this.question);
    },
    recordDesc() {
      const status = this.recordStatus;
      if (status === 0 || status === 2) {
        this.recordImg = iconRecord;
      } else if (status === 1) {
        this.recordImg = iconRecording;
      }
      return status === 0
        ? "点击录音按钮开始录音"
        : status === 1
        ? "录音中，再次点击录音按钮结束录音"
        : status === 2
        ? "点击录音按钮开始录音"
        : "";
    },
    evaluationAccuracy() {
      const result = this.question.evaluation;
      if (result !== null) {
        return Math.floor(result.pronAccuracy);
      } else {
        return 0;
      }
    },
    evaluationResult() {
      const result = this.question.evaluation;
      if (result !== null) {
        const body = result.wordsEvaluation.reduce((total, v) => {
          return `${total}<span style="color: ${
            v.pronAccuracy < 30
              ? "red"
              : v.pronAccuracy >= 60
              ? "green"
              : "orange"
          };">${v.word} &ensp;</span>`;
        }, "");
        return `<div style="display: flex; flex-flow: row wrap;">${body}</div>`;
      } else {
        return "";
      }
    },
  },
  mounted() {
    //#ifndef H5
    if (this.rm === undefined) {
      this.rm = uni.getRecorderManager();
    }
    this.rm.onStart((e) => this.onStart(e));
    this.rm.onPause((e) => this.onPause(e));
    this.rm.onResume((e) => this.onResume(e));
    // this.rm.onStop((e) => this.onStop(e))
    this.rm.onInterruptionBegin((e) => this.onInterruptionBegin(e));
    this.rm.onInterruptionEnd((e) => this.onInterruptionEnd(e));
    this.rm.onError((e) => this.onError(e));
    //#endif
    //#ifdef H5
    this.recOpen();
    //#endif
  },
  beforeUpdate() {
    if (getApp().globalData.authStatus === false) {
      this.$emit("showExitBtnAction");
    }
  },
  onHide() {
    console.log("onHide");
    this.submitTopicWhenBoolOrChoice();
  },
  beforeDestroy() {
    console.log(
      "beforeDestroy",
      this.question,
      this.question.questionType,
      this.oldBoolStudentAnswer,
      this.oldSelectedOpts
    );
    this.submitTopicWhenBoolOrChoice();
  },
  methods: {
    fmtRichTextImg(nodes) {
      return formatRichTextImg(nodes);
    },
    isImage(answer) {
      if (answer === "" || answer === null) {
        return false;
      } else if (
        answer.indexOf(".png") !== -1 ||
        answer.indexOf(".jpg") !== -1
      ) {
        return true;
      } else {
        return false;
      }
    },
    isNeedUpdateSubmitFlag() {
      if (this.submitFlag === 0) {
        this.$emit("updateSubmitFlag", this.subQuesIndex);
      }
    },
    afterStoreTopic(order, studentAnswer) {
      this.$emit(
        "updateQuestionList",
        JSON.stringify({ order, studentAnswer })
      );
      if (this.storeFlag) {
        this.$emit("storedTopic");
      }
      this.isNeedUpdateSubmitFlag();
    },
    submitTopicWhenBoolOrChoice() {
      // 如果是套题的非首子题 直接return
      if (this.isNestedAnswer) {
        return;
      } else {
        const type = this.question.questionType;
        if (
          type === QuestionType.SINGLE_ANSWER_QUESTION ||
          type === QuestionType.MULTIPLE_ANSWER_QUESTION
        ) {
          this.submitChoiceAnswer(this.question);
        } else if (type === QuestionType.BOOL_ANSWER_QUESTION) {
          this.submitBoolAnswer(this.question);
        }
      }
    },
    /**
     * 提交选择题
     */
    submitChoiceAnswer(question) {
      console.log(this.selectedOptions, this.oldSelectedOpts);
      const submitAction = () => {
        currentServerTime().then((serverTime) => {
          examSubmit(this.examId, this.userId, serverTime, [
            {
              order: question.order,
              studentAnswer: this.oldSelectedOpts.toString(),
              time: this.storeFlag === true ? this.time : this.oldTime,
            },
          ]).then((res) => {
            this.afterStoreTopic(
              question.order,
              this.oldSelectedOpts.toString()
            );
            this.oldSelectedOpts = []; // 修复因为多选题点击过快导致的最后一次生效的问题
          });
        });
      };
      if (
        (question.questionType === QuestionType.MULTIPLE_ANSWER_QUESTION ||
          question.questionType === QuestionType.SINGLE_ANSWER_QUESTION) &&
        this.oldSelectedOpts.length > 0
      ) {
        submitAction();
      } else {
        this.afterStoreTopic(question.order, question.studentAnswer);
      }
    },
    submitBoolAnswer(question) {
      console.log(this.boolStudentAnswer, this.oldBoolStudentAnswer);
      if (this.oldBoolStudentAnswer !== null) {
        console.log("submitBoolAnswer !== null");
        currentServerTime().then((serverTime) => {
          examSubmit(this.examId, this.userId, serverTime, [
            {
              order: question.order,
              studentAnswer: this.oldBoolStudentAnswer.toString(),
              time: this.storeFlag === true ? this.time : this.oldTime,
            },
          ]).then((res) => {
            this.afterStoreTopic(
              question.order,
              this.oldBoolStudentAnswer.toString()
            );
            this.oldBoolStudentAnswer = null;
          });
        });
      } else {
        console.log("submitBoolAnswer is null");
        this.afterStoreTopic(question.order, question.studentAnswer);
      }
    },
    chooseSelectItem(question, index) {
      if (this.selectedOptions.length === 0) {
        this.selectedOptions.push(index);
      } else if (
        question.questionType === QuestionType.SINGLE_ANSWER_QUESTION
      ) {
        this.selectedOptions = [index];
      } else if (
        question.questionType === QuestionType.MULTIPLE_ANSWER_QUESTION
      ) {
        const i = this.selectedOptions.findIndex((v) => v === index);
        if (i !== -1) {
          if (this.selectedOptions.length > 1) {
            this.selectedOptions.splice(i, 1);
          }
        } else {
          this.selectedOptions.push(index);
        }
      }
      this.oldSelectedOpts = this.selectedOptions;
      // 如果是套题中的第一小题之后的题，点击选项就提交
      if (
        this.isNestedAnswer === true &&
        JSON.stringify(this.selectedOptions) !==
          JSON.stringify(this.question.studentAnswer)
      ) {
        this.submitChoiceAnswer(this.question);
      }
      console.log(this.selectedOptions, this.oldSelectedOpts);
    },
    selectBoolAnswer(bool) {
      this.boolStudentAnswer = bool;
      this.oldBoolStudentAnswer = bool;
      // 如果是套题中的第一小题之后的题，更改对或错就提交
      if (
        this.isNestedAnswer === true &&
        this.boolStudentAnswer.toString() !== this.question.studentAnswer
      ) {
        this.submitBoolAnswer(this.question);
      }
      console.log(bool, this.boolStudentAnswer, this.oldBoolStudentAnswer);
    },
    trueOrFalse() {
      if (this.boolStudentAnswer !== null) {
        return this.boolStudentAnswer;
      } else if (
        this.question.questionType === QuestionType.BOOL_ANSWER_QUESTION
      ) {
        if (this.question.studentAnswer === null) {
          return null;
        } else if (this.question.studentAnswer === "true") {
          return true;
        } else if (this.question.studentAnswer === "false") {
          return false;
        } else {
          return null;
        }
      }
    },
    toFillAnswer(urls, index) {
      getApp().globalData.legalHideAction = true;
      uni.navigateTo({
        url: `/pages/fillTopicAnswer/fillTopicAnswer?userId=${
          this.userId
        }&order=${this.question.order}&examId=${this.examId}&studentId=${
          this.studentId
        }&index=${index}&time=${this.time}&urls=${JSON.stringify(urls)}`,
      });
    },
    fmtFillAnswer(question) {
      if (question === null) {
        return;
      } else {
        const answerFmt = question.studentAnswer || "";
        let answerList = answerFmt.split("##");
        answerList.map((v, i) => {
          if (v.substr(-4) === ".png") {
            answerList[i] = v;
          }
        });
        answerList.length = question.quesBody.split("______").length - 1;
        const arrList = new Array(answerList.length).fill("");
        arrList.forEach((v, i) => {
          answerList[i] = answerList[i] || v;
        });
        return answerList;
      }
    },
    uploadTextAnswer(question) {
      // 标识此操作导致的onHide为合法
      getApp().globalData.legalHideAction = true;
      uni
        .chooseImage({
          count: 1,
          sizeType: ["compressed"],
        })
        .then((res) => {
          console.log(res);
          if (res[0] === null) {
            uni.showLoading({
              title: "上传中...",
            });
            console.log("uploadTextAnswer", res, this.examId, filePath);
            //#ifndef H5
            const filePath = res[1].tempFilePaths[0];
            //#endif
            //#ifdef H5
            const filePath = new FormData();
            filePath.append("image", res[1].tempFiles[0], "image.png");
            //#endif
            console.log("uploadTextAnswer", res, this.examId, filePath);
            // 此操作完成后重置为false
            getApp().globalData.legalHideAction = false;
            uploadImageToAliOss(this.examId, filePath)
              .then((resp) => {
                //#ifdef H5
                resetContentType();
                const respData = resp.data;
                //#endif
                //#ifndef H5
                const respData = resp;
                //#endif
                uni.hideLoading();
                uni.showLoading({ title: "提交中..." });
                console.log("uploadImageToAliOss", respData, question);
                currentServerTime().then((serverTime) => {
                  examSubmit(this.examId, this.userId, serverTime, [
                    {
                      // 这里学生id要用userId ...
                      order: question.order,
                      studentAnswer: respData,
                      time: this.time,
                    },
                  ])
                    .then((res) => {
                      uni.hideLoading();
                      this.$emit(
                        "updateQuestionList",
                        JSON.stringify({
                          order: question.order,
                          studentAnswer: respData,
                        })
                      );
                    })
                    .catch((err) => {
                      uni.hideLoading();
                    });
                });
              })
              .catch((err) => {
                console.log("uploadImageToAliOss error", err);
                uni.hideLoading();
              });
          } else {
            throw new Error(res);
          }
        });
    },
    recordAction() {
      if (this.recordStatus === 0 || this.recordStatus === 2) {
        if (beforeAudioRecordOrPlay("record")) {
          //#ifndef H5
          this.rm.start({
            duration: 600000,
            format: "mp3",
            sampleRate: 22050,
          });
          this.rm.onStop((e) => this.onStop(e));
          //#endif
          //#ifdef H5
          this.recStart();
          //#endif
          this.recordStatus = 1;
        }
      } else if (this.recordStatus === 1) {
        //#ifndef H5
        this.rm.stop();
        //#endif
        //#ifdef H5
        this.recStop();
        //#endif
        this.recordStatus = 2;
        afterAudioRecord();
      }
    },
    uploadMp3ToAliAction(e) {
      //#ifdef H5
      const audio = e;
      //#endif
      //#ifndef H5
      const audio = e.tempFilePath;
      //#endif
      uploadMp3ToAliOss(
        this.examRecordDataId,
        this.question.order,
        this.question.audioText,
        audio
      )
        .then((res) => {
          //#ifdef H5
          const data = res.data;
          resetContentType();
          //#endif
          //#ifndef H5
          const data = JSON.parse(res);
          //#endif
          console.log("uploadMp3ToAliOss", data);
          if (data.code !== undefined && data.code !== "0") {
            uni.hideLoading();
            uni.showModal({
              title: "提示",
              content:
                data.code === "403"
                  ? "登录状态失效，请在其他终端操作"
                  : data.desc,
              showCancel: false,
            });
            if (data.code === "403") {
              getApp().globalData.authStatus = false;
            }
            return false;
          } else {
            uni.hideLoading();
            uni.showLoading({
              title: "评测中...",
            });
            const answerNormalLink = data.data.answerNormalLink;
            console.log("uploadMp3ToAliOss", data);
            const getResult = () =>
              getSpokenAnswerResult(data.data.id)
                .then((resp) => {
                  console.log("getSpokenAnswerResult", resp);
                  const status = resp.data.status;
                  if (status === "Evaluating") {
                    setTimeout(() => {
                      getResult();
                    }, 3000);
                  } else if (status === "Finished") {
                    this.spokenResult = resp.data.evaluation;
                    uni.hideLoading();
                    currentServerTime().then((serverTime) => {
                      examSubmit(this.examId, this.userId, serverTime, [
                        {
                          order: this.question.order,
                          time: this.time,
                          mediaId: data.data.id,
                          audioText: this.question.audioText,
                          studentAnswer: answerNormalLink,
                        },
                      ]).then((res) => {
                        this.$emit(
                          "updateQuestionList",
                          JSON.stringify({
                            order: this.question.order,
                            studentAnswer: answerNormalLink,
                            evaluation: this.spokenResult,
                          })
                        );
                      });
                    });
                  }
                })
                .catch((err) => {
                  throw new Error(err);
                });
            getResult();
          }
        })
        .catch((err) => {
          throw new Error(err);
        });
    },
    recOpen(success) {
      this.rec = Recorder({
        type: "mp3",
        sampleRate: 22050,
        onProcess: (
          buffers,
          powerLevel,
          bufferDuration,
          bufferSampleRate,
          newBufferIdx,
          asyncEnd
        ) => {
          // console.log(buffers,powerLevel,bufferDuration,bufferSampleRate,newBufferIdx,asyncEnd)
        },
      });
      //var dialog=createDelayDialog(); 我们可以选择性的弹一个对话框：为了防止移动端浏览器存在第三种情况：用户忽略，并且（或者国产系统UC系）浏览器没有任何回调，此处demo省略了弹窗的代码
      this.rec.open(
        () => {
          //打开麦克风授权获得相关资源
          //dialog&&dialog.Cancel(); 如果开启了弹框，此处需要取消
          //rec.start() 此处可以立即开始录音，但不建议这样编写，因为open是一个延迟漫长的操作，通过两次用户操作来分别调用open和start是推荐的最佳流程
          success && success();
        },
        (msg, isUserNotAllow) => {
          //用户拒绝未授权或不支持
          //dialog&&dialog.Cancel(); 如果开启了弹框，此处需要取消
          console.log(
            (isUserNotAllow ? "UserNotAllow，" : "") + "无法录音:" + msg
          );
        }
      );
    },
    recStart() {
      this.rec.start();
    },
    recStop() {
      this.rec.stop(
        (blob, duration) => {
          console.log(
            blob,
            (window.URL || webkitURL).createObjectURL(blob),
            "时长:" + duration + "ms"
          );
          // this.rec.close();//释放录音资源，当然可以不释放，后面可以连续调用start；但不释放时系统或浏览器会一直提示在录音，最佳操作是录完就close掉
          // this.rec=null;
          //已经拿到blob文件对象想干嘛就干嘛：立即播放、上传

          /*** 【立即播放例子】 ***/
          // var audio=document.createElement("audio");
          // audio.controls=true;
          // document.body.appendChild(audio);
          // // //简单利用URL生成播放地址，注意不用了时需要revokeObjectURL，否则霸占内存
          // audio.src=(window.URL||webkitURL).createObjectURL(blob);
          // audio.play();
          const form = new FormData();
          form.append("audio", blob, "audio.mp3");
          this.uploadMp3ToAliAction(form);
        },
        (msg) => {
          console.log("录音失败:" + msg);
          this.rec.close(); //可以通过stop方法的第3个参数来自动调用close
          this.rec = null;
        }
      );
    },
    onStart(e) {
      console.log("开始录音", this.question, this.subQuesIndex);
      console.log(e);
    },
    onPause(e) {
      console.log(e);
      afterAudioRecord();
    },
    onResume(e) {
      console.log(e);
    },
    onStop(e) {
      console.log(e);
      afterAudioRecord();
      uni.showLoading({
        title: "录音上传中...",
      });
      console.log("录音上传中", this.question, this.subQuesIndex);
      console.log(
        "上传录音参数",
        this.examRecordDataId,
        this.question.order,
        this.question.audioText,
        e.tempFilePath
      );
      this.uploadMp3ToAliAction(e);
      // uploadMp3ToAliOss(this.examRecordDataId, this.question.order, this.question.audioText, e.tempFilePath).then((res) => {
      //   const data = JSON.parse(res)
      //   console.log('uploadMp3ToAliOss', data)
      //   if (data.code !== undefined && data.code !== '0') {
      //     uni.hideLoading()
      //     uni.showModal({
      //       title: '提示',
      //       content: data.code === '403' ? '登录状态失效，请在其他终端操作' : data.desc,
      //       showCancel: false,
      //     })
      //     if (data.code === '403') {
      //       getApp().globalData.authStatus = false
      //     }
      //     return false
      //   } else {
      //     uni.hideLoading()
      //     uni.showLoading({
      //       title: '评测中...'
      //     })
      //     const answerNormalLink = data.data.answerNormalLink
      //     console.log('uploadMp3ToAliOss', data)
      //     const getResult = () => getSpokenAnswerResult(data.data.id).then((resp) => {
      //       console.log('getSpokenAnswerResult', resp)
      //       const status = resp.data.status
      //       if (status === 'Evaluating') {
      //         setTimeout(() => {
      //           getResult()
      //         }, 3000)
      //       } else if (status === 'Finished') {
      //         this.spokenResult = resp.data.evaluation
      //         uni.hideLoading()
      //         currentServerTime().then((serverTime) => {
      //           examSubmit(this.examId, this.userId, serverTime, [{
      //             order: this.question.order,
      //             time: this.time,
      //             mediaId: data.data.id,
      //             audioText: this.question.audioText,
      //             studentAnswer: answerNormalLink
      //           }]).then((res) => {
      //             this.$emit('updateQuestionList', JSON.stringify({order: this.question.order, studentAnswer: answerNormalLink, evaluation: this.spokenResult}))
      //           })
      //         })
      //       }
      //     }).catch((err) => {
      //       throw new Error(err)
      //     })
      //     getResult();
      //   }
      // }).catch((err) => {
      //   throw new Error(err)
      // })
    },
    onInterruptionBegin(e) {
      console.log(e);
    },
    onInterruptionEnd(e) {
      console.log(e);
    },
    onError(e) {
      console.log(e);
    },
  },
};
</script>

<style lang="scss" scoped>
.topic-body {
  .ques-top-body {
    padding: 3vw;
    // background: linear-gradient(135deg, #4edbab 0%, #90e2a9 100%);
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
        background: linear-gradient(
          180deg,
          rgba(123, 191, 255, 1) 0%,
          rgba(112, 166, 255, 1) 100%
        );
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
      background: linear-gradient(
        180deg,
        rgba(123, 191, 255, 1) 0%,
        rgba(112, 166, 255, 1) 100%
      );
    }
    .upToError {
      background: linear-gradient(
        180deg,
        rgba(255, 143, 140, 1) 0%,
        rgba(255, 111, 119, 1) 100%
      );
    }
  }
  .default-view {
    text-align: center;
    padding: 10vw 0;
    border-radius: 8px;
    background: $default-bgcolor;
  }
  .text-answer {
    text-align: center;
  }
  .recorder-panel {
    display: flex;
    flex-flow: column nowrap;
    align-items: center;
    padding: 3vw;
    color: $blackcolor;
    border-bottom: 2px solid $default-bgcolor;
    .record-part {
      display: flex;
      flex-flow: row nowrap;
      align-items: center;
      justify-content: flex-start;
      width: 100%;
      .record-desc {
        width: 45%;
      }
    }
    .audio-evoluation {
      display: flex;
      flex-flow: column;
      align-items: center;
      width: 100%;
      padding: 2vw;
      border: $default-bgcolor 1px solid;
      .audio-text,
      .evoluation {
        width: 100%;
        margin-top: 2vw;
        text-align: left;
        display: flex;
        flex-flow: row nowrap;
        align-items: center;
        justify-content: space-between;
        .custom-audio {
          border-radius: 100%;
          padding: 2vw;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .record {
          border-radius: 100%;
          border: #c0c0c0 solid 1px;
          width: 10vw;
          height: 10vw;
          flex-shrink: 0;
        }
        .evaluationAccuracy {
          border-radius: 100%;
          width: 10vw;
          height: 10vw;
          border: #c0c0c0 solid 1px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        ::v-deep .recorder-audio {
          max-width: 30vw;
          overflow: hidden;
          .uni-audio-right {
            width: 16vw;
          }
        }
      }
    }
  }
}
</style>