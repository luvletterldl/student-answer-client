<template>
  <view>
    <!-- #ifndef H5 -->
    <view class="custom-audio">
      <image v-if="audioSrc !== undefined && audioSrc !== null && audioSrc !== ''" @click="playOrStopAudio" :src="audioImg" class="audio-btn" />
      <text v-else @click="tips" class="audio-btn">无音源</text>
      <text v-if="showTime">{{ fmtSecond(currentTime) }}/{{ fmtSecond(duration) }}</text>
    </view>
    <!--  #endif -->
    <!-- #ifdef H5 -->
    <audio v-if="audioSrc !== undefined && audioSrc !== null && audioSrc !== ''" :src='audioSrc' controls />
    <!--  #endif -->
  </view>
</template>

<script>
import { formatSecondToHHmmss, afterAudioPlay, beforeAudioRecordOrPlay } from '../../lib/Utils'
const iconPaused = '../../static/images/icon_paused.png'
const iconPlaying = '../../static/images/icon_playing.png'
const iconStop = '../../static/images/icon_stop.png'
const iconLoading = '../../static/images/icon_loading.gif'
export default {
  name: 'CustomAudio',
  props: {
    audioSrc: {
      type: String,
      default: ''
    },
    showTime: {
      type: Boolean,
      required: false,
      default: true
    }
  },
  data() {
    return {
      audioCtx: undefined,
      duration: 0,
      currentTime: 0,
      audioImg: iconLoading,
    }
  },
  watch: {
    audioSrc: {
      handler(newSrc, oldSrc) {
        console.log('watch', newSrc, oldSrc)
        this.audioImg = iconLoading
        this.currentTime = 0
        this.duration = 0
        if (this.audioCtx === undefined) {
          this.audioCtx = uni.createInnerAudioContext()
          this.onTimeUpdate = this.audioCtx.onTimeUpdate
          this.bindAuidoCallback(this.audioCtx)
        } else {
          this.audioCtx.src = newSrc
        }
        if (this.audioCtx.play) {
          this.audioCtx.stop()
          getApp().globalData.audioPlaying = false
        }
      }
    }
  },
  mounted() {
    //#ifndef H5
    this.audioCtx = uni.createInnerAudioContext()
    this.audioCtx.src = this.audioSrc
    this.audioCtx.startTime = 0
    this.bindAuidoCallback(this.audioCtx)
    // console.log('onLoad', this.audioCtx, this.audioSrc)
    //#endif
  },
  methods: {
    bindAuidoCallback(ctx) {
      ctx.onTimeUpdate((e) => {
        this.onTimeUpdate(e)
      })
      ctx.onCanplay((e) => {
        this.onCanplay(e)
      })
      ctx.onWaiting((e) => {
        this.onWaiting(e)
      })
      ctx.onPlay((e) => {
        this.onPlay(e)
      })
      ctx.onPause((e) => {
        this.onPause(e)
      })
      ctx.onEnded((e) => {
        this.onEnded(e)
      })
      ctx.onError((e) => {
        this.onError(e)
      })
    },
    tips(){
      uni.showToast({
        title: '无效音源,请先录音',
        icon: 'none'
      })
    },
    playOrStopAudio() {
      if (this.audioCtx === undefined) {
        this.audioCtx = uni.createInnerAudioContext()
        this.audioCtx.src = this.audioSrc
        this.bindAuidoCallback(this.audioCtx)
      }
      if (this.audioCtx.paused) {
        if (beforeAudioRecordOrPlay('play')) {
          this.audioCtx.play()
          this.audioImg = iconPlaying
        }
      } else {
        this.audioCtx.pause()
        afterAudioPlay()
        this.audioImg = iconPaused
      }
    },
    onTimeUpdate(e) {
      console.log('onTimeUpdate', this.audioCtx.duration, this.audioCtx.currentTime)
      // this.audioImg = iconPlaying
      if (this.audioCtx.currentTime > 0 && this.audioCtx.currentTime <= 1) {
        this.currentTime = 1
      } else if (this.currentTime !== Math.floor(this.audioCtx.currentTime)) {
        this.currentTime = Math.floor(this.audioCtx.currentTime)
      }
      const duration = Math.floor(this.audioCtx.duration)
      if (this.duration !== duration) {
        this.duration = duration
      }
    },
    onCanplay(e) {
      if (this.audioImg === iconLoading) {
        this.audioImg = iconPaused
      }
      console.log('onCanplay', e)
    },
    onWaiting(e) {
      if (this.audioImg !== iconLoading) {
        this.audioImg = iconLoading
      }
    },
    onPlay(e) {
      console.log('onPlay', e, this.audioCtx.duration)
      this.audioImg = iconPlaying
      if (this.audioCtx.duration > 0 && this.audioCtx.duration <= 1) {
        this.duration = 1
      } else {
        this.duration = Math.floor(this.audioCtx.duration)
      }
    },
    onPause(e) {
      console.log('onPause', e)
      this.audioImg = iconPaused
    },
    onEnded(e) {
      console.log('onEnded', e)
      if (this.audioImg !== iconPaused) {
        this.audioImg = iconPaused
      }
      afterAudioPlay()
    },
    onError(e) {
      uni.showToast({
        title: '音频加载失败',
        icon: 'none'
      })
      throw new Error(e.errMsg, e.errCode)
    },
    fmtSecond(sec) {
      const { min, second } = formatSecondToHHmmss(sec)
      return `${min}:${second}`
    }
  }
}
</script>

<style lang="scss" scoped>
.custom-audio {
  border-radius: 8vw;
  border: #CCC 1px solid;
  background: $default-bgcolor;
  color: #333;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-between;
  padding: 2vw;
  font-size: 14px;
  .audio-btn {
    width: 10vw;
    height: 10vw;
    white-space: nowrap;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>