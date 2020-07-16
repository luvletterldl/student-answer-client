<template>
  <view class="default-answer-page-view">
    <view>优学达在线作答，一个方便快捷的答题小程序！</view>
    <view>界面色彩更丰富，综合便捷的作答单选题、多选题、判断题、填空题、简答题、套题、口语题。</view>
    <view>点点手指，轻松完成预习、进门测、课堂练习及课后作业。</view>
  </view>
</template>

<script>
export default {
  name: 'DefaultAnswerPageView'
}
</script>

<style lang="scss" scoped>
.default-answer-page-view {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 99;
  font-size: large;
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-flow: column;
  padding: 5vh 5vw;
  align-items: center;
  justify-content: space-evenly;
  background: $default-bgcolor;
  color: $blackcolor;
}
</style>