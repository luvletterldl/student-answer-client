<template>
	<view class="container">
    <view class="content">
      <text>欢迎登录</text>
      <input placeholder="请输入账号" v-model="account" type="text" />
      <input placeholder="请输入密码" v-model="password" type="password" />
      <button @click="submit">登录</button>
    </view>
	</view>
</template>

<script>
import { clientLogin } from '../../lib/Api'
import Main from '../../lib/Main'
export default {
  data() {
    return {
      account: '',
      password: ''
    };
  },
  onLoad() {
    if (uni.getStorageSync(Main.userInfo) !== '') {
      uni.navigateTo({
        url: '/pages/studyMission/studyMission',
      })
    }
  },
  methods: {
    submit() {
      console.log(this.account, this.password)
      clientLogin().then((res) => {
        const { student, user } = res
        if (student && user) {
          student.ecOrgId = student.ecOrgId ? student.ecOrgId : 110
          student.ecOrgName = student.ecOrgName ? student.ecOrgName : 'gt专属校区'
          uni.setStorageSync(Main.userInfo, JSON.stringify(user))
          uni.setStorageSync(Main.studentInfo, JSON.stringify(student))
          uni.navigateTo({
            url: '/pages/studyMission/studyMission',
            success: (res) => {
              console.log('succ', res)
            },
            fail: (err) => {
              console.log('fail', err)
            }
          })
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.container {
  width: 100vw;
  min-height: 100vh;
  background: $default-bgcolor;
  overflow: hidden;
  .content {
    background: #FFF;
    border-radius: 8px;
    color: #333;
    font-size: 16px;
    width: 80vw;
    padding: 5vw;
    margin: 30vh 10vw;
    u-input {
      .u-input {
        margin: 5vw 0;
      }
    }
  }
}
</style>
