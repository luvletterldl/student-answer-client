<template>
	<view class="container">
		<canvas class="canvas"
      canvas-id="canId"
      @touchstart="touchStart"
      @touchmove="touchMove"
      @touchend="touchEnd"
      @touchcancel="touchCancel"
    />
		<view class="options">
			<button class="option" @click="clear">清除</button>
			<button class="option" @click="save">保存</button>
		</view>
		<button class="option back" @click="back">返回</button>
	</view>
</template>

<script>
import Main from '../../lib/Main.js'
import { uploadImageToAliOss, currentServerTime, examSubmit, findExamQuestionList } from '../../lib/Api.js'
const windowWidth = uni.getSystemInfoSync().windowWidth
const imgPreUrl = `${Main.host}api/k12/wx/getImage?filePath=`
export default {
	data() {
		return {
      ctx: undefined,
			studentAnswer: '',
			order: 0,
			userId: 0,
			index: 0,
			paintX: 0,
			paintY: 0,
			classId: 0,
			studentId: 0,
			examId: 0,
			time: 0,
		}
	},
  onLoad(options) {
		console.log(options, 'onLoad')
		this.order = Number(options.order)
		this.userId = Number(options.userId)
		this.index = Number(options.index)
		this.classId = Number(options.classId)
		this.studentId = Number(options.studentId)
		this.examId = Number(options.examId)
		this.time = Number(options.time)
  },
	onReady(){
		this.ctx = uni.createCanvasContext('canId')
		findExamQuestionList(this.examId, this.userId).then((res) => {
			console.log('findExamQuestionList', res)
			res.filter((v, i) => {
				if (v.order === this.order) {
					this.studentAnswer = v.studentAnswer
				}
			})
			const studentAnswer = this.studentAnswer || ''
			let studentAnswerList = studentAnswer.split('##')
			if (studentAnswerList[this.index] !== '') {
				console.log(studentAnswerList[this.index])
				uni.getImageInfo({
					src: `${imgPreUrl}${studentAnswerList[this.index]}`
				}).then((res) => {
					console.log(res)
					this.ctx.drawImage(res[1].path, 0, 0, windowWidth, 400)
					this.ctx.draw(true)
				})
			}
		})
	},
	methods: {
    touchStart(e) {
      this.paintX = e.touches[0].x
			this.paintY = e.touches[0].y
			this.ctx.moveTo(this.paintX, this.paintY)
		},
		touchMove(e) {
			const { x, y } = e.touches[0]
			this.ctx.setStrokeStyle('#36415C')
      this.ctx.setLineWidth(3)
      this.ctx.lineCap = 'round'
      this.ctx.lineJoin = 'round'
      this.ctx.moveTo(this.paintX, this.paintY)
      this.ctx.lineTo(x, y)
			this.ctx.stroke()
			this.paintX = x
			this.paintY = y
			this.ctx.draw(true)
		},
		touchEnd(e) {

		},
		touchCancel(e) {

		},
		clear() {
			this.ctx.clearRect(0, 0, windowWidth, 400)
      this.ctx.draw(true)
		},
		save() {
      uni.canvasToTempFilePath({
        x: 0,
        y: 0,
        width: windowWidth,
        height: 400,
        canvasId: 'canId',
      }).then((res) => {
        console.log('first', res[1].tempFilePath)
        const tempFilePath = res[1].tempFilePath
        this.ctx.drawImage(tempFilePath, 0, 0, windowWidth, 400)
        uploadImageToAliOss(this.classId, this.examId, tempFilePath).then((res) => {
					console.log('uploadImageToAliOss', res)
					const studentAnswerList = this.studentAnswer.split('##')
					studentAnswerList[this.index] = res
					studentAnswerList.forEach((v, i) => {
						if (i !== 0) {
							studentAnswerList[i] = `##${v}`
						}
					})
					currentServerTime().then(serverTime => {
						examSubmit(this.examId, this.studentId, serverTime, [{
							order: this.order,
							studentAnswer: studentAnswerList.toString().replace(/,/g, ''),
							time: this.time,
						}]).then(() => {
							this.back()
						})
					})
        })
        // this.draw(true)
        // this.saveImgUseTempCanvas()
      })
		},
		back() {
			uni.navigateBack()
		}
	}
}
</script>

<style lang="scss" scoped>
.canvas {
	width: 100vw;
	height: 400px;
	background: #FFF;
}
.options {
	display: flex;
	flex-flow: row nowrap;
	width: 80vw;
	margin: 5vw 10vw;
	align-items: center;
	justify-content: space-between;
}
.option {
	background: linear-gradient(180deg,rgba(123,191,255,1) 0%,rgba(112,166,255,1) 100%);
	color: #FFF;
	padding: 0vw 10vw;
	border-radius: 6vw;
}
.back {
	width: 70vw;
	margin: 0 15vw;
  text-align: center;
}
</style>
