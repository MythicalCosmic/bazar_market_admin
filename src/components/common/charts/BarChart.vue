<template>
  <apexchart type="bar" :height="height" :options="options" :series="series" />
</template>

<script setup>
import { computed } from 'vue'
import apexchart from 'vue3-apexcharts'

const props = defineProps({
  series:     { type: Array, required: true },
  categories: { type: Array, default: () => [] },
  height:     { type: Number, default: 300 },
  horizontal: { type: Boolean, default: false },
  colors:     { type: Array, default: () => ['#16A34A', '#3B82F6'] },
  formatY:    { type: Function, default: v => v },
})

const options = computed(() => ({
  chart: { toolbar: { show: false }, animations: { enabled: true, speed: 600 } },
  plotOptions: { bar: { horizontal: props.horizontal, borderRadius: 6, columnWidth: '50%' } },
  dataLabels: { enabled: false },
  colors: props.colors,
  grid: { borderColor: 'rgba(15,23,42,0.06)', strokeDashArray: 4 },
  xaxis: {
    categories: props.categories,
    labels: { style: { colors: '#94A3B8', fontSize: '11px', fontWeight: 600 } },
    axisBorder: { show: false }, axisTicks: { show: false },
  },
  yaxis: {
    labels: { style: { colors: '#94A3B8', fontSize: '11px', fontWeight: 600 }, formatter: props.formatY },
  },
  tooltip: { theme: 'light', y: { formatter: props.formatY } },
  legend: { fontSize: '12px', fontWeight: 600 },
}))
</script>
