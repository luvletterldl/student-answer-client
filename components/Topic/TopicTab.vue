<template>
  <view class="topic-tab">
    <view class='topic-index'>
      <view @click='chooseQuestionAction(index)' v-for="(item, index) in questionList" :key="index" class="item">
        <view>{{ index + 1 }}</view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'topic-tab',
  props: {
    chooseQuestion: {
      type: Function
    },
    questionList: {
      type: Array
    }
  },
  methods: {
    chooseQuestionAction(index) {
      this.$emit('chooseQuestion', index)
    }
  }
}
</script>

<style lang="scss" scoped>
.topic-tab {
  background: #FFF;
  box-shadow: 0px 0px 10px 0px rgba(220,228,246,1);
  font-family:Arial-BoldMT,Arial;
  font-weight: normal;
  width: 90vw;
  margin: 3vw 5vw;
  padding: 2vw;
  border-radius: 3vw;
  display: flex;
  flex-flow: column;
  text-align: center;
  position: sticky;
  top: 17vw;
  z-index: 2;
  .topic-index {
    display: flex;
    flex-wrap: wrap;
    color: #666D88;
    .item, .correct, .error {
      width: 10vw;
      height: 10vw;
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      border: 1px solid #F3F6FC;
      font-size: normal;
      margin: 2vw;
    }
    .correct {
      color: #13C6B2;
      border: 1px solid #13C6B2;
    }
    .error {
      color: #FF5D66;
      border: 1px solid #FF5D66;
    }
    .selected {
      color: #4184FF;
      background: rgba(112,166,255,0.2);
      border: 1px solid #70A6FF;
    }
  }
  .extra-options {
    color: #666D88;
    padding: 9px 0;
  }
}
</style>