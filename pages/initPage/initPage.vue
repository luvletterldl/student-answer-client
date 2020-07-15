<template>
	<view class="container">
    <view class="content">
      <text>欢迎登录</text>
      <input class='text' placeholder="请输入账号" v-model.trim="account" type="text" />
      <input class='password' placeholder="请输入密码" v-model.trim="password" type="password" />
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
      if (this.account === '' || this.password === '') {
        uni.showToast({
          title: '手机号或密码不能为空',
          icon: 'none'
        })
        return
      }
      clientLogin(this.account, this.password).then((res) => {
        console.log(res)
        const code = res.code
        let title = ''
        if (code === 'K-000012' || code === 'K-000011') {
          title = res.desc
        }
        if (title !== '') {
          uni.showToast({
            title: title,
            icon: 'none'
          })
          return
        }
        const { student, user } = res
        if (student && user) {
          student.ecOrgId = student.ecOrgId ? student.ecOrgId : 110
          student.ecOrgName = student.ecOrgName ? student.ecOrgName : 'gt专属校区'
          uni.setStorageSync(Main.userInfo, JSON.stringify(user))
          uni.setStorageSync(Main.studentInfo, JSON.stringify(student))
          uni.navigateTo({
            url: `/pages/studyMission/studyMission?studentId=${student.id}&userId=${user.userId}`,
            success: (res) => {
              console.log('succ', res)
            },
            fail: (err) => {
              console.log('fail', err)
            }
          })
        }
      }).catch((err) => {
        console.log('client login Err', err)
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
    .text, .password {
      margin: 5vw 0;
    }
  }
}
</style>
