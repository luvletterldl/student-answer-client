<template>
  <view class="topic-switch" :style="answerGuideIndex === 1 ? 'z-index: 101' : 'z-index: 2'">
    <image @click='switchTopicAction(false)' src='../../static/images/icon_prevTopic.png' class='switcher' />
    <view class='topicProcess'>
      <view class='process'>
        <text class="time-limit"><text class="cdtime">{{ currentTopicTimeCost }}</text>/{{ timeLimit }}</text>
        <text class='currentIndex'>{{ questionList.length > 0 ? currentTopicIndex + 1 : 0 }}/{{ questionList.length }}</text>
      </view>
      <view @click="showOrHideTopicOverviewAction" class='viewAll'>
        <text v-if="duration !== null">剩余时间：{{ remineTime }}</text>
        <text>{{ showTopicTab ? '点击收起总览' : '点击查看总览' }}</text>
      </view>
    </view>
    <image @click='switchTopicAction(true)' src='../../static/images/icon_nextTopic.png' class='switcher' />
  </view>
</template>

<script>
import { fmtSecToMin } from '../../lib/Utils'
export default {
  name: 'topic-switch',
  props: {
    answerGuideIndex: {
      type: Number
    },
    switchTopic: {
      type: Function
    },
    showOrHideTopicOverview: {
      type: Function
    },
    currentTopicTimeCost: {
      type: String
    },
    questionList: {
      type: Array
    },
    currentTopic: {
      type: Object
    },
    currentTopicIndex: {
      type: Number
    },
    duration: {
      type: Number | null,
      default: null
    },
    remineTime: {
      type: String,
      default: ''
    },
    showTopicTab: {
      type: Boolean,
      default: false
    }
  },
  watch: {
    currentTopic: {
      handler(newTopic, oldTopic) {
        if (newTopic && newTopic.timeLimit) {
          this.timeLimit = fmtSecToMin(newTopic.timeLimit)
        } else {
          return ''
        }
      },
      deep: true
    }
  },
  data() {
    return {
      timeLimit: ''
    }
  },
  methods: {
    switchTopicAction(bool) {
      this.$emit('switchTopic', bool)
    },
    showOrHideTopicOverviewAction() {
      this.$emit('showOrHideTopicOverview')
    }
  }
}
</script>

<style lang="scss" scoped>
.topic-switch {
  display: flex;
  flex-flow: row;
  width: 90vw;
  background: #FFF;
  border-radius: 3vw;
  margin: 2vw 5vw;
  padding: 3vw 5vw;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 2;
  box-shadow: 0px 0px 10px 0px #dce4f6;
  .switcher {
    width: 8vw;
    height: 8vw;
    flex-shrink: 0;
  }
  .topicProcess {
    font-size: 4vw;
    color: #9098B4;
    display: flex;
    justify-content: space-around;
    flex-flow: column;
    align-items: center;
    .currentIndex {
      color: #36415C;
    }
    .process, .viewAll {
      width: 100%;
      display: flex;
      flex-flow: row nowrap;
      justify-content: space-evenly;
      align-items: center;
      width: 65vw;
      .cdtime {
        color: #FF5D66;
        &::before {
          content: '';
          position: absolute;
          width: 4vw;
          height: 4vw;
          background: url('../../static/images/icon_timeLimit.png') no-repeat;
          background-size: 100% 100%;
          margin: .8vw 5vw 0 -5vw;
        }
      }
    }
  }
}
</style>