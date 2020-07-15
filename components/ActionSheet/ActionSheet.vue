<template name='ActionSheet'>
  <view v-if="actionSheetStatus" class="action-sheet">
    <view @click="hideActionSheet" class="action-sheet-mask"></view>
    <view class="action-sheet-content">
      <view class="action-sheet-content-header">
        <slot name="action-header" />
        <img @click="hideActionSheet" src="../../static/images/icon_closeActionSheet.png" class="closeIcon" />
      </view>
      <view class="action-items">
        <slot name='action-sheet-item' />
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'ActionSheet',
  props: {
    actionSheetStatus: {
      type: Boolean,
      default: false
    },
    showOrHideActionSheet: {
      type: Function
    }
  },

  methods: {
    hideActionSheet() {
      this.$emit('showOrHideActionSheet')
    }
  }
}
</script>

<style lang="scss" scoped>
.action-sheet {
  width: 100vw;
  height: 100vh;
  position: fixed;
  overflow: scroll;
  bottom: 0;
  left: 0;
  z-index: 10;
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  // padding: 3vw 5vw;
  box-sizing: content-box;
  .action-sheet-mask {
    background: rgba(0,0,0,.4);
    width: 100vw;
    height: 100vh;
  }
  .action-sheet-content {
    position: fixed;
    bottom: 0;
    width: 100vw;
    background: #FFF;
    max-height: 65vh;
    overflow: scroll;
    .action-sheet-content-header {
      width: 100%;
      display: flex;
      border-radius: 6px 6px 0 0;
      flex-flow: row nowrap;
      align-items: center;
      justify-content: space-between;
      padding: 5vw;
      background: #FFF;
      position: fixed;
      .action-header {
        width: 80vw;
      }
      .closeIcon {
        width: 5vw;
        height: 5vw;
      }
    }
    .action-items {
      margin-top: 15vw;
      display: flex;
      flex-flow: column nowrap;
      align-items: center;
    }
  }
}
</style>
