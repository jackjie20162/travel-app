<template>
  <div class="pickup-range-map">
    <div ref="mapEl" class="pickup-map-container"></div>
    <div v-if="error" class="pickup-map-fallback">{{ error }}</div>
  </div>
</template>

<script setup>
/**
 * 接送范围只读地图：将商户绘制的 WGS84 多边形在高德地图上展示（C 端）
 */
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { loadAMap } from '../utils/amap'
import { wgs84ToGcj02 } from '../utils/coordTransform'

const props = defineProps({
  // WGS84 顶点数组，元素支持 {lng,lat} 或 [lng,lat]
  polygon: {
    type: Array,
    default: () => [],
  },
})

const mapEl = ref(null)
const error = ref('')
let map = null

function normPoint(p) {
  if (Array.isArray(p)) return { lng: Number(p[0]), lat: Number(p[1]) }
  return { lng: Number(p.lng), lat: Number(p.lat) }
}

async function render() {
  if (!props.polygon || props.polygon.length < 3) return
  try {
    const AMap = await loadAMap()
    if (!mapEl.value) return
    map = new AMap.Map(mapEl.value, { zoom: 12, viewMode: '2D' })
    const path = props.polygon.map(p => {
      const w = normPoint(p)
      const g = wgs84ToGcj02(w.lng, w.lat)
      return new AMap.LngLat(g.lng, g.lat)
    })
    const polygonOverlay = new AMap.Polygon({
      path,
      strokeColor: '#2563eb',
      strokeWeight: 2,
      strokeOpacity: 0.9,
      fillColor: '#2563eb',
      fillOpacity: 0.18,
    })
    map.add(polygonOverlay)
    map.setFitView([polygonOverlay], false, [20, 20, 20, 20])
  } catch (e) {
    console.error('接送范围地图加载失败', e)
    error.value = '接送范围地图加载失败'
  }
}

onMounted(() => nextTick(render))
onBeforeUnmount(() => {
  if (map) {
    map.destroy()
    map = null
  }
})
</script>

<style scoped>
.pickup-range-map {
  margin-top: 8px;
}
.pickup-map-container {
  width: 100%;
  height: 200px;
  border-radius: 8px;
  overflow: hidden;
  background: #f3f4f6;
}
.pickup-map-fallback {
  margin-top: 6px;
  font-size: 12px;
  color: #999;
}
</style>
