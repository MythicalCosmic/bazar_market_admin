<template>
  <apexchart type="donut" :height="height" :options="options" :series="series" />
</template>

<script setup>
import { computed } from 'vue'
import apexchart from 'vue3-apexcharts'

const props = defineProps({
  series: { type: Array, required: true },
  labels: { type: Array, required: true },
  colors: { type: Array, default: () => ['#16A34A','#3B82F6','#F59E0B','#8B5CF6','#22C55E','#EF4444','#64748B'] },
  height: { type: Number, default: 300 },
  total:  { type: [Number, String], default: null },
  totalLabel: { type: String, default: 'Jami' },
})

const options = computed(() => ({
  chart: { animations: { enabled: true, speed: 500 } },
  labels: props.labels,
  colors: props.colors,
  stroke: { width: 0 },
  legend: { position: 'bottom', fontSize: '12px', fontWeight: 600, markers: { width: 10, height: 10, radius: 4 } },
  dataLabels: { enabled: false },
  plotOptions: {
    pie: {
      donut: {
        size: '72%',
        labels: {
          show: true,
          name:  { fontSize: '11px', fontWeight: 700, color: '#94A3B8', offsetY: 6 },
          value: { fontSize: '22px', fontWeight: 800, color: '#0F172A', offsetY: -8, formatter: v => Number(v).toLocaleString('ru-RU') },
          total: {
            show: true,
            label: props.totalLabel,
            color: '#94A3B8',
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
  tooltip: { y: { formatter: v => Number(v).toLocaleString('ru-RU') } },
}))
</script>
