<template>
	<view class="container">
		{{ options }}
	</view>
</template>

<script>
export default {
	data() {
		return {
			options: ''
		}
	},
	onLoad(options) {
		console.log(options)
		this.options = options
	},
	methods: {
		
	}
}
</script>

<style lang="scss" scoped>

</style>