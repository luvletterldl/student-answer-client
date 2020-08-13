<template>
  <view v-if="needLogin" class="auth-login">
    <view class="login-content">
      <text class="title">欢迎登录</text>
      <input class='text' disabled :placeholder="account" v-model.trim="account" type="text" />
      <input class='password' placeholder="请输入密码" v-model.trim="password" type="password" />
      <button class="submit" @click="submit">登录</button>
    </view>
  </view>
</template>

<script>
import { clientOELogin, header } from '../../lib/Api'
export default {
  name: 'AuthLogin',
  props: {
    account: {
      type: String,
      required: true
    },
    needLogin: {
      type: Boolean,
      required: true,
    },
    authLoginSuccess: {
      type: Function,
    }
  },
  data() {
    return {
      password: ''
    }
  },
  methods: {
    submit() {
      if (this.password === '') {
        uni.showToast({
          title: '请输入密码',
          icon: 'none'
        })
        return
      } else {
        clientOELogin(this.account, this.password).then((res) => {
          console.log('clientLogin', res)
          // console.log(res)
          // const code = res.code
          // let title = ''
          // if (code === 'K-000012' || code === 'K-000011') {
          //   title = res.desc
          // }
          if (res.code !== undefined && res.code !== '0' && res.code !== 0) {
          // }
          // if (title !== '') {
          //   uni.showToast({
          //     title: title,
          //     icon: 'none'
          //   })
          //   return
          } else {
            // 如果是OE还是用二维码中的token
            const { key, token } = res.user
            header.key = key
            header.token = token
            getApp().globalData.authStatus = true
            this.$emit('authLoginSuccess')
          }
        })
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.auth-login {
  position: fixed;
  z-index: 200;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: $default-bgcolor;
  color: $blackcolor;
  .login-content {
    background: #FFF;
    margin: 30vh 10vw;
    width: 80vw;
    padding: 5vw;
    border-radius: 8px;
    display: flex;
    flex-flow: column nowrap;
    align-items: flex-start;
    .title {
      font-size: x-large;
      font-weight: 600;
    }
    .text, .password {
      margin: 3vw 0;
      border: $default-bgcolor 2px solid;
      width: calc(66vw - 4px);
      padding: 2vw;
      border-radius: 8px;
    }
    .submit {
      border-radius: 8vw;
      color: #FFF;
      padding: 0 15vw;
      background: $default-bluelinearbg;
    }
  }
}
</style>