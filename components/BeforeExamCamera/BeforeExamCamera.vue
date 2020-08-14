<template>
  <view class='before-exam-camera'>
    <camera
      v-if="showCamera"
      class="check-face"
      device-position='front'
      flash='off'
      @error='binderror'
      @initdone='bindinitdone'
    />
    <cover-image v-if="tempPath !== ''" :src='tempPath' class="temp-photo" />
    <cover-view class="take-photo-tips">请{{ isRepeat }}点击拍照进行人脸验证</cover-view>
    <cover-view class="take-photo-action u-flex u-row-center u-col-center">
      <button size='mini' type="warn" v-if="tempPath !== ''" @click="reTakePhoto" class='re-take' >重拍</button>
      <button size='mini' v-if="tempPath === ''" @click="takePhoto" class='take-photo' >拍照</button>
      <button size='mini' type="primary" v-if="tempPath !== ''" @click='usePhoto' class='use-photo' >确认</button>
    </cover-view>
  </view>
</template>

<script>
import { header, uploadImageToAliOss, comparePortrait } from '../../lib/Api'
import { authCameraTips } from '../../lib/Utils'
import Main from '../../lib/Main'
export default {
  name: 'BeforeExamCamera',
  props: {
    examRecordDataId: {
      type: Number,
    },
    account: {
      type: String
    },
    initExam: {
      type: Function,
    },
    onShow: {
      type: Number,
      default: false
    }
  },
  watch: {
    onShow(newStatus, oldStatus) {
      if (newStatus) {
        const that = this
        uni.authorize({
					scope: 'scope.camera',
					success(resp) {
            that.showCamera = true
            getApp().globalData.legalHideAction = false
					},
					fail(err) {
            that.showCamera = false
            getApp().globalData.legalHideAction = true
            authCameraTips()
					}
				})
      }
    }
  },
  data() {
    return {
      tempPath: '',
      isRepeat: '',
      cameraCtx: null,
      showCamera: true,
    }
  },
  methods: {
    reTakePhoto() {
      this.tempPath = ''
    },
    takePhoto() {
      if (this.cameraCtx === null) {
        this.cameraCtx = uni.createCameraContext()
      }
      this.cameraCtx.takePhoto().then((res) => {
        console.log('cameraCtx', res.tempImagePath)
        this.tempPath = res.tempImagePath
      })
    },
    usePhoto() {
      uni.showLoading()
      uploadImageToAliOss(this.examRecordDataId, this.tempPath).then((path) => {
        console.log('uploadImageToAliOss', path)
        const url = `${Main.host}/api/k12/wx/getImage?filePath=${path}`
        this.tempPath = ''
        comparePortrait(this.account, url).then((resp) => {
          console.log('comparePortrait', resp)
          if (resp.code) {
            this.isRepeat = '重新'
          } else {
            const { key, token } = resp.user
            header.key = key
            header.token = token
            getApp().globalData.authStatus = true
            this.$emit('initExam')
          }
          uni.hideLoading()
        })
      })
    },
    binderror(e) {
      console.log('binderror', e)
      authCameraTips()
    },
    bindinitdone(e) {
      console.log('bindinitdone', e)
    }
  }
}
</script>

<style lang="scss" scoped>
.before-exam-camera {
	width: 100vw;
	height: 100vh;
	position: fixed;
	top: 0;
	left: 0;
	z-index: 100;
	.check-face {
		width: 100vw;
		height: 100vh;
		z-index: 101;
		.photo-guide {
			width: 100vw;
			height: 100vh;
			z-index: 102;
		}
  }
  .default-view {
    width: 100vw;
		height: 100vh;
		z-index: 101;
    background: #333;
  }
  .temp-photo {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 103;
  }
  .take-photo-tips {
    position: fixed;
    z-index: 103;
    width: 100vw;
    top: 78vh;
    left: 0;
    color: #FFF;
    text-align: center;
  }
	.take-photo-action {
		background: rgba(0, 0, 0, .6);
    position: fixed;
    top: 82vh;
    height: 18vh;
		border-radius: 8px 8px 0 0;
		width: 100vw;
    z-index: 104;
    .re-take, .take-photo, .use-photo {
      padding: 0 5vw;
    }
    .re-take {
      margin-right: 20vw;
    }
    .use-photo {
      margin-left: 20vw;
    }
	}
}
</style>