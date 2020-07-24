<template>
  <view class="topBaseInfo" :style="answerGuideIndex === 0 ? 'z-index: 101' : 'z-index: 0'">
    <view class='lessonName'>
      <!-- <text class="lessonNumber">{{ currentLessonNumber }}</text>
      <text class="courseName">{{ courseName }}</text> -->
      <view class='clsName'>{{ className }}</view>
      <img @click="showOrHideCCName" class="showOrHide" :class="showCCName ? '' : 'hideStatus'" src="../../static/images/icon_answerSOH.png" />
    </view>
    <!-- <view v-show="showCCName" class='clsName'>{{ className }}</view> -->
    <view v-show="showCCName" class='lessonNumber'>{{ currentLessonNumber === 'undefined' ? '' : currentLessonNumber }}</view>
    <view v-show="showCCName" class='courseName'>{{ courseName === 'undefined' ? '' : courseName }}</view>
  </view>
</template>

<script>
export default {
  name: 'ClassTopBaseInfo',
  props: {
    className:{
      type: String,
      required: true,
    },
    courseName: {
      type: String,
      required: true,
      default: ''
    },
    currentLessonNumber: {
      type: String,
      required: true,
      default: ''
    },
    answerGuideIndex: {
      type: Number,
      required: false,
    }
  },
  data() {
    return {
      showCCName: false
    }
  },
  methods: {
    showOrHideCCName() {
      this.showCCName = !this.showCCName
    }
  }
}
</script>

<style lang='scss' scoped>
.topBaseInfo {
  position: relative;
  z-index: 0;
  width: 90vw;
  padding: 5vw;
  margin: 2vw 5vw;
  background: linear-gradient(180deg, #55a9ff 0%, #4184ff 100%);
  color: #FFF;
  display: flex;
  flex-flow: column;
  align-items: flex-start;
  border-radius: 3vw;
  .lessonName {
    width: 80vw;
    display: flex;
    flex-flow: row;
    justify-content: space-between;
    align-items: center;
    .courseName {
      font-size: 3.6vw;
      font-weight: normal;
      max-width: 50vw;
    }
    .showOrHide {
      width: 6vw;
      height: 6vw;
      transform: rotate(0deg);
    }
    .hideStatus {
      transform: rotate(-90deg);
    }
  }
  .lessonNumber {
    background: linear-gradient(180deg,#FED57B 0%,#FEB039 100%);
    border-radius: 2vw;
    font-size: 3vw;
    padding: 1.5vw 2vw;
    margin: 1.5vw 0;
    box-shadow: 0 1vw 1.5vw rgba(254,213,123, .5);
  }
  .clsName {
    font-size: 4.6vw;
    font-weight: 600;
  }
}
</style>