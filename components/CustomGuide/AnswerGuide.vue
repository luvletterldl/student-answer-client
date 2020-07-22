<template>
  <view v-if="showAnswerGuide" class="answer-guide">
    <view v-if="guideIndex === 0" class="baseInfo">
      <view class="title">收起展开按钮</view>
      <view class="desc">点击可以收起或展开课程、课次信息</view>
      <view class="options">
        <button size='mini' @click="closeGuide">关闭</button>
        <button size='mini' @click="prevStep">上一步</button>
        <button size='mini'  @click="nextStep">下一步</button>
      </view>
    </view>
    <view v-if="guideIndex === 1" class="topicSwitch">
      <view class="title">题目控制面板</view>
      <view class="desc">当前题目耗时/限时，总耗时/总限时，当前题号/总题目数量，点击左右两个按钮可以切换上下题目，点击查看总览可以展示所有题目</view>
      <view class="options">
        <button size='mini' @click="closeGuide">关闭</button>
        <button size='mini' @click="prevStep">上一步</button>
        <button size='mini' @click="nextStep">下一步</button>
      </view>
    </view>
    <view v-if="guideIndex === 2" class="topicBody">
      <view class="title">题干及选项等</view>
      <view class="desc">此处展示题干、选项等信息</view>
      <view class="options">
        <button size='mini' @click="closeGuide">关闭</button>
        <button size='mini' @click="prevStep">上一步</button>
        <button size='mini' @click="nextStep">下一步</button>
      </view>
    </view>
    <view v-if="guideIndex === 3" class="submitStore">
      <view class="title">上交和暂存按钮</view>
      <view class="desc">点击上交可以结束考试并提交答案，点击暂存可以保存已作答的信息</view>
      <view class="options">
        <button size='mini' @click="closeGuide">关闭</button>
        <button size='mini' @click="prevStep">上一步</button>
        <button size='mini' @click="nextStep">完成</button>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'AnswerGuide',
  props: {
    showAnswerGuide: {
      type: Boolean,
      required: true,
      default: false
    },
    answerGuideChangeStep: {
      type: Function,
    },
    hideAnswerGuide: {
      type: Function,
    }
  },
  data() {
    return {
      guideIndex: 0,
    }
  },
  methods: {
    closeGuide() {
      this.$emit('hideAnswerGuide')
    },
    nextStep() {
      const newIndex = this.guideIndex + 1
      if (newIndex > 3) {
        this.closeGuide()
        return
      } else {
        this.guideIndexChange(newIndex)
      }
    },
    prevStep() {
      const newIndex = this.guideIndex - 1
      if (newIndex < 0) {
        return
      } else {
        this.guideIndexChange(newIndex)
      }
    },
    guideIndexChange(index) {
      this.guideIndex = index
      this.$emit('answerGuideChangeStep', index)
    }
  }
}
</script>

<style lang="scss" scoped>
$guideZIndex: 100;
$highLightZIndex: 101;
.answer-guide {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.5);
  z-index: $guideZIndex;
  .baseInfo, .topicSwitch, .topicBody, .submitStore {
    background: #FFF;
    border-radius: 8px;
    width: 90vw;
    margin: 0 5vw;
    padding: 5vw;
    display: flex;
    flex-flow: column nowrap;
    align-items: flex-start;
    position: fixed;
    top: 30vw;
    .title {
      font-size: large
    }
    .desc {
      margin: 3px 0;
    }
    .options {
      display: flex;
      flex-flow: row nowrap;
    }
  }
  .topicSwitch {
    top: 50vw;
  }
  .topicBody {
    top: 5vw;
  }
  .submitStore {
    top: 90vw;
  }
}
</style>