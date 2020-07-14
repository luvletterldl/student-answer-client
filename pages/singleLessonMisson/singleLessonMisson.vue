<template>
	<view class="container">
		<view class="class-evaluation">
			<text>课堂评价</text>
			<view class="evalutaion">
        <view>
          <text>听讲：{{ rates.listen !== '暂无数据' ? '' : rates.listen }}</text>
          <u-rate v-if="rates.listen !== '暂无数据'" :value="rates.listen" active-color="#FED57B" color="#FED57B" max="5"></u-rate>
        </view>
        <view>
          <text>回答：{{ rates.answer !== '暂无数据' ? '' : rates.answer }}</text>
          <u-rate v-if="rates.answer !== '暂无数据'" :value="rates.answer" active-color="#FED57B" color="#FED57B" max="5"></u-rate>
        </view>
        <view>
          <text>纪律：{{ rates.discipline !== '暂无数据' ? '' : rates.discipline }}</text>
          <u-rate v-if="rates.discipline !== '暂无数据'" :value="rates.discipline" active-color="#FED57B" color="#FED57B" max="5"></u-rate>
        </view>
			</view>
		</view>
		<view class="items">
			<view class="item">
				<text>预习</text>
				<button @click="toAnswer('prev')">去完成</button>
			</view>
			<view class="item">
				<text>作业</text>
				<button @click="toAnswer('homework')">去完成</button>
			</view>
			<view class="item">
				<text>进门测</text>
				<button @click="toAnswer('enter')">去完成</button>
			</view>
			<view class="item">
				<text>课堂练习</text>
				<button @click="toAnswer('exe')">去完成</button>
			</view>
		</view>
	</view>
</template>

<script>
import { getMyClassLesson } from '../../lib/Api'
export default {
	data() {
		return {
			studentId: 0,
			courseId: 0,
			index: 0,
			classLesson: {},
			rates: {
				listen: null,
				answer: null,
				discipline: null
			}
		}
	},
	watch: {
		classLesson: {
      handler(newcl, oldcl) {
				const evoData = newcl.lessonInfo.kClassCourseEvolutionEntity
				console.log('Rates', evoData)
				this.rates = {
					listen: evoData.listen || '暂无数据',
					answer: evoData.answer || '暂无数据',
					discipline: evoData.discipline || '暂无数据',
				}
			},
			deep: true,
    }
	},
	onLoad(options) {
		const { studentId, courseId, index } = options
		this.studentId = Number(studentId)
		this.courseId = Number(courseId)
		this.index = Number(index)
	},
	onShow() {
		// const params = getCurrentInstance().params
		getMyClassLesson(this.studentId, 0, this.courseId).then((res) => {
			this.classLesson = res.data[this.index]
		})
	},
	methods: {
		toAnswer(type) {
			const lessonInfo = this.classLesson.lessonInfo
			const data = type === 'prev' ? lessonInfo.kClassCoursePrepEntity
				: type === 'homework' ? lessonInfo.kClassCourseAssignmentEntity
					: type === 'exe' ? lessonInfo.kClassCourseExerciseEntity
						: type === 'enter' ? lessonInfo.kClassCourseEnterEntity : ''
			uni.navigateTo({
				url: `/pages/answerPage/answerPage?data=${JSON.stringify(data)}`
			})
		}
	}
}
</script>

<style lang='scss' scoped>
.class-evaluation {
	width: 90vw;
	padding: 5vw;
	margin: 5vw;
	border-radius: 8px;
	background: #FFF;
	.evalutaion {
		display: flex;
		flex-flow: column nowrap;
		align-items: center;
	}
}
.items {
	width: 100vw;
	display: flex;
	flex-flow: row wrap;
	align-items: center;
	.item {
		width: 46vw;
		margin: 2vw;
		border-radius: 6px;
		background: #FFF;
		display: flex;
		flex-flow: column nowrap;
		padding: 2vw;
	}
}
</style>
