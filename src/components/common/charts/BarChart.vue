<template>
  <apexchart type="bar" :height="height" :options="options" :series="series" />
</template>

<script setup>
import { computed } from 'vue'
import apexchart from 'vue3-apexcharts'
import { CHART_COLORS, useChartTheme } from './_theme'

const props = defineProps({
  series:     { type: Array, required: true },
  categories: { type: Array, default: () => [] },
  height:     { type: Number, default: 300 },
  horizontal: { type: Boolean, default: false },
  colors:     { type: Array, default: () => CHART_COLORS },
  formatY:    { type: Function, default: v => v },
})

const { grid, label, mode } = useChartTheme()

const options = computed(() => ({
  chart: { toolbar: { show: false }, animations: { enabled: true, speed: 700 }, fontFamily: 'Inter, sans-serif' },
  plotOptions: { bar: { horizontal: props.horizontal, borderRadius: 8, borderRadiusApplication: 'end', columnWidth: '46%' } },
  dataLabels: { enabled: false },
  colors: props.colors,
  fill: {
    type: 'gradient',
    gradient: { shade: 'dark', type: props.horizontal ? 'horizontal' : 'vertical', shadeIntensity: 0.25, opacityFrom: 1, opacityTo: 0.85, stops: [0, 100] },
  },
  grid: { borderColor: grid.value, strokeDashArray: 4 },
  xaxis: {
    categories: props.categories,
    labels: { style: { colors: label.value, fontSize: '11px', fontWeight: 600 } },
    axisBorder: { show: false }, axisTicks: { show: false },
  },
  yaxis: {
    labels: { style: { colors: label.value, fontSize: '11px', fontWeight: 600 }, formatter: props.formatY },
  },
  tooltip: { theme: mode.value, y: { formatter: props.formatY } },
  legend: { fontSize: '12px', fontWeight: 600, labels: { colors: label.value } },
}))
</script>
