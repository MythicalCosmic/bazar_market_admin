<template>
  <apexchart type="radialBar" :height="height" :options="options" :series="[clamped]" />
</template>

<script setup>
import { computed } from 'vue'
import apexchart from 'vue3-apexcharts'
import { useChartTheme } from './_theme'

const props = defineProps({
  value:  { type: Number, default: 0 },   // 0..100
  label:  { type: String, default: '' },
  color:  { type: String, default: '#10B981' },
  height: { type: Number, default: 220 },
})

const { isDark, label: labelColor } = useChartTheme()
const clamped = computed(() => Math.max(0, Math.min(100, Math.round(props.value))))

const options = computed(() => ({
  chart: { fontFamily: 'Inter, sans-serif', sparkline: { enabled: true }, animations: { speed: 800 } },
  plotOptions: {
    radialBar: {
      startAngle: -135, endAngle: 135,
      hollow: { size: '66%' },
      track: { background: isDark.value ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)', strokeWidth: '100%' },
      dataLabels: {
        name:  { offsetY: 22, fontSize: '12px', fontWeight: 600, color: labelColor.value },
        value: { offsetY: -16, fontSize: '30px', fontWeight: 800, color: isDark.value ? '#F1F5F9' : '#0B1220', formatter: v => `${Math.round(v)}%` },
      },
    },
  },
  fill: {
    type: 'gradient',
    gradient: { shade: 'dark', type: 'horizontal', gradientToColors: [props.color], stops: [0, 100], opacityFrom: 1, opacityTo: 1 },
  },
  colors: [props.color],
  stroke: { lineCap: 'round' },
  labels: [props.label],
}))
</script>
