<template>
  <apexchart type="area" :height="height" :options="options" :series="series" />
</template>

<script setup>
import { computed } from 'vue'
import apexchart from 'vue3-apexcharts'
import { CHART_COLORS, useChartTheme } from './_theme'

const props = defineProps({
  series:     { type: Array, required: true },
  categories: { type: Array, default: () => [] },
  height:     { type: Number, default: 300 },
  colors:     { type: Array, default: () => CHART_COLORS },
  formatY:    { type: Function, default: v => v },
})

const { grid, label, mode } = useChartTheme()

const options = computed(() => ({
  chart: {
    toolbar: { show: false },
    animations: { enabled: true, easing: 'easeinout', speed: 700, dynamicAnimation: { speed: 400 } },
    zoom: { enabled: false },
    parentHeightOffset: 0,
    fontFamily: 'Inter, sans-serif',
    dropShadow: { enabled: true, top: 6, left: 0, blur: 10, opacity: 0.35, color: props.colors[0] },
  },
  stroke: { curve: 'smooth', width: 3, lineCap: 'round' },
  fill: {
    type: 'gradient',
    gradient: { shadeIntensity: 1, opacityFrom: 0.42, opacityTo: 0.02, stops: [0, 95, 100] },
  },
  colors: props.colors,
  dataLabels: { enabled: false },
  grid: { borderColor: grid.value, strokeDashArray: 4, padding: { left: 8, right: 8 } },
  markers: { size: 0, hover: { size: 5 }, strokeWidth: 0 },
  xaxis: {
    categories: props.categories,
    labels: { style: { colors: label.value, fontSize: '11px', fontWeight: 600 } },
    axisBorder: { show: false }, axisTicks: { show: false },
  },
  yaxis: {
    labels: { style: { colors: label.value, fontSize: '11px', fontWeight: 600 }, formatter: props.formatY },
  },
  tooltip: { theme: mode.value, y: { formatter: props.formatY } },
  legend: { fontSize: '12px', fontWeight: 600, labels: { colors: label.value }, markers: { width: 10, height: 10, radius: 4 } },
}))
</script>
