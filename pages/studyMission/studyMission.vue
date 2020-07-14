<template>
	<view class="container">
    <text @click="showOrHideActionSheet">{{ selectedCourse.courseName }}</text>
    <view class="courses">
      <view @click="toCourseDetail(item, index)" v-for="(item, index) in courseList" :key="index" class="course">
        <text>{{ item.lessonName }}</text>
        <view class="courseInfo">
          <text>课程：{{ item.courseName }}</text>
          <text>班级：{{ item.className }}</text>
          <text>校区：{{ item.campusName }}</text>
          <text>任课老师： {{ item.teacher }} | 下发时间：{{ item.lessonInfo.sendTime }}</text>
        </view>
      </view>
    </view>
    <action-sheet
      :actionSheetStatus='actionSheetStatus'
      v-on:showOrHideActionSheet='showOrHideActionSheet'
      class='actionSheet'
    >
      <template v-slot:action-header>
        <text>选择报读课程</text>
      </template>
      <template v-slot:action-sheet-item>
        <view @click="chooseCourse(item, index)" v-for="(item, index) in courseInfoList" :key="index" class="courseName">
          {{ item.courseName }}
        </view>
      </template>
    </action-sheet>
	</view>
</template>

<script>
import ActionSheet from '../../components/ActionSheet/ActionSheet.vue'
import { getCourseInfoByStudentId, getMyClassLesson } from '../../lib/Api'
import Main from '../../lib/Main'
let studentId = 0
let userId = 0
const studentInfo = uni.getStorageSync(Main.studentInfo)
const userInfo = uni.getStorageSync(Main.userInfo)
if (studentInfo !== '' && userInfo !== '') {
  studentId = JSON.parse(studentInfo).id
  userId = JSON.parse(userInfo).userId
}
export default {
  components: {
    ActionSheet,
  },
  data() {
    return {
      courseInfoList: [],
      courseList: [],
      selectedIndex: 0,
      actionSheetStatus: false
    };
  },
  computed: {
    selectedCourse() {
      return this.courseInfoList[this.selectedIndex]
    }
  },
  watch: {
    selectedIndex: {
      handler(newIndex, oldIndex) {
        if (this.courseInfoList.length === 0) {
          this.initCourseInfo().then(() => { this.getClassLessonInfo() })
        } else {
          this.getClassLessonInfo()
        }
      },
      immediate: true
    }
  },
  methods: {
    initCourseInfo() {
      return getCourseInfoByStudentId(studentId).then((res) => {
        this.courseInfoList = res.data
      })
    },
    getClassLessonInfo() {
      getMyClassLesson(studentId, 0, this.selectedCourse.courseId).then((res) => {
        this.courseList = res.data
      })
    },
    showOrHideActionSheet() {
      this.actionSheetStatus = !this.actionSheetStatus
      console.log('hideActionSheet')
    },
    changeSelectedCourse(i) {
      this.selectedIndex = i
    },
    chooseCourse(item, i) {
      console.log(item)
      this.selectedIndex = i
      this.showOrHideActionSheet()
    },
    toCourseDetail(_, index) {
      uni.navigateTo({
        url: `/pages/singleLessonMisson/singleLessonMisson?studentId=${studentId}&courseId=${this.selectedCourse.courseId}&index=${index}`
      })
    }
  }
}
</script>

<style lang='scss' scoped>
.container {
  width: 100vw;
  min-height: 100vh;
  overflow: hidden;
  background: $default-bgcolor;
  .courses {
    width: 100vw;
    .course {
      margin: 3vw 5vw;
      padding: 5vw;
      width: 90vw;
      background: #FFF;
      border-radius: 6px;
      .courseInfo {
        display: flex;
        flex-flow: column nowrap;
        align-items: flex-start;
        justify-content: space-around;
      }
    }
  }
  .actionSheet {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100vw;
    padding: 3vw 5vw;
    max-height: 65vh;
    overflow: scroll;
    display: flex;
    flex-flow: column nowrap;
    align-items: center;
    .courseName {
      padding: 3vw 5vw;
      border-radius: 5vw;
      background: #CCC;
      text-align: center;
      margin: 2vw 5vw;
      width: 90vw;
    }
  }
}
</style>
