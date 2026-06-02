<template>
  <apexchart type="donut" :height="height" :options="options" :series="series" />
</template>

<script setup>
import { computed } from 'vue'
import apexchart from 'vue3-apexcharts'
import { CHART_COLORS, useChartTheme } from './_theme'

const props = defineProps({
  series: { type: Array, required: true },
  labels: { type: Array, required: true },
  colors: { type: Array, default: () => CHART_COLORS },
  height: { type: Number, default: 300 },
  total:  { type: [Number, String], default: null },
  totalLabel: { type: String, default: 'Jami' },
})

const { isDark, label, mode } = useChartTheme()

const options = computed(() => ({
  chart: { animations: { enabled: true, speed: 600 }, fontFamily: 'Inter, sans-serif' },
  labels: props.labels,
  colors: props.colors,
  stroke: { width: 2, colors: [isDark.value ? '#0E1626' : '#FFFFFF'] },
  legend: { position: 'bottom', fontSize: '12px', fontWeight: 600, labels: { colors: label.value }, markers: { width: 10, height: 10, radius: 4 } },
  dataLabels: { enabled: false },
  plotOptions: {
    pie: {
      donut: {
        size: '74%',
        labels: {
          show: true,
          name:  { fontSize: '11px', fontWeight: 700, color: label.value, offsetY: 20 },
          value: { fontSize: '24px', fontWeight: 800, color: isDark.value ? '#F1F5F9' : '#0B1220', offsetY: -14, formatter: v => Number(v).toLocaleString('ru-RU') },
          total: {
            show: true,
            label: props.totalLabel,
            color: label.value,
            fontSize: '11px',
            fontWeight: 700,
            formatter: () => props.total !== null
              ? Number(props.total).toLocaleString('ru-RU')
              : props.series.reduce((a,b) => a + b, 0).toLocaleString('ru-RU'),
          },
        },
      },
    },
  },
  tooltip: { theme: mode.value, y: { formatter: v => Number(v).toLocaleString('ru-RU') } },
}))
</script>
