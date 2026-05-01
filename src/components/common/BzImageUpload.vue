<template>
  <div>
    <slot :pick="openPicker" :uploading="uploading" :progress="progress">
      <div
        class="bz-img-upload-zone"
        :class="{ 'bz-img-upload-active': dragOver }"
        @click="openPicker"
        @dragover.prevent="dragOver = true"
        @dragleave="dragOver = false"
        @drop.prevent="onDrop"
      >
        <v-icon size="32" color="primary" style="opacity:0.5">mdi-cloud-upload-outline</v-icon>
        <div style="font-weight:700;font-size:13px;margin-top:6px">Rasmlarni shu yerga tashlang</div>
        <div style="font-size:12px;color:var(--bz-text-3);margin-top:2px">yoki bosib tanlang</div>
      </div>
    </slot>

    <input ref="fileInput" type="file" accept="image/*" :multiple="multiple" hidden @change="onFilesPicked" />

    <!-- Preview / BG-removal dialog -->
    <v-dialog v-model="previewDialog" max-width="600" persistent>
      <v-card rounded="xl">
        <div style="padding:20px 24px 14px;display:flex;align-items:center;justify-content:space-between">
          <div class="d-flex align-center ga-3">
            <div style="width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:rgba(139,92,246,0.12)">
              <v-icon color="purple" size="20">mdi-image-edit-outline</v-icon>
            </div>
            <div>
              <div style="font-weight:800;font-size:16px">Rasmni tayyorlash</div>
              <div style="font-size:12px;color:var(--bz-text-3)">Orqa fonni olib tashlash yoki asl holatda qoldirish</div>
            </div>
          </div>
          <v-btn icon variant="text" size="small" @click="cancelPreview"><v-icon>mdi-close</v-icon></v-btn>
        </div>
        <v-divider />

        <v-card-text class="pa-5">
          <!-- Processing -->
          <div v-if="removing" class="text-center py-8">
            <v-progress-circular indeterminate color="purple" size="48" width="4" />
            <div style="font-weight:700;font-size:14px;margin-top:16px">Orqa fon olib tashlanmoqda...</div>
            <div style="font-size:12px;color:var(--bz-text-3);margin-top:4px">{{ progressText }}</div>
            <v-btn variant="text" size="small" color="error" class="mt-3" @click="cancelBgRemoval">Bekor qilish</v-btn>
          </div>

          <!-- Comparison -->
          <div v-else class="d-flex ga-4" style="justify-content:center">
            <div
              class="bz-img-option"
              :class="{ 'bz-img-option-selected': selectedVersion === 'original' }"
              @click="selectedVersion = 'original'"
            >
              <img :src="originalPreview" class="bz-img-preview" />
              <div class="bz-img-option-label">
                <v-icon size="14" class="mr-1">mdi-image-outline</v-icon> Asl rasm
              </div>
              <v-icon v-if="selectedVersion === 'original'" class="bz-img-check" color="success" size="22">mdi-check-circle</v-icon>
            </div>

            <div
              v-if="removedPreview"
              class="bz-img-option"
              :class="{ 'bz-img-option-selected': selectedVersion === 'removed' }"
              @click="selectedVersion = 'removed'"
            >
              <div class="bz-img-checker">
                <img :src="removedPreview" class="bz-img-preview" />
              </div>
              <div class="bz-img-option-label">
                <v-icon size="14" class="mr-1">mdi-auto-fix</v-icon> Fonsiz
              </div>
              <v-icon v-if="selectedVersion === 'removed'" class="bz-img-check" color="success" size="22">mdi-check-circle</v-icon>
            </div>

            <div v-if="removeFailed" class="d-flex align-center" style="opacity:0.5">
              <div class="text-center pa-4">
                <v-icon size="28" color="grey">mdi-image-broken-variant</v-icon>
                <div style="font-size:12px;margin-top:4px">Fon olib tashlanmadi</div>
              </div>
            </div>
          </div>
        </v-card-text>

        <v-divider />
        <v-card-actions class="pa-4">
          <v-btn v-if="!removing && !removedPreview && !removeFailed" variant="tonal" color="purple" rounded="lg" size="small" @click="runBgRemoval">
            <v-icon start size="16">mdi-auto-fix</v-icon> Fonni olib tashlash
          </v-btn>
          <v-spacer />
          <v-btn variant="text" @click="cancelPreview">Bekor</v-btn>
          <v-btn color="primary" rounded="lg" :disabled="removing" @click="acceptImage">
            <v-icon start>mdi-check</v-icon> Tasdiqlash
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-progress-linear v-if="uploading" :model-value="progress" color="primary" rounded class="mt-2" />
  </div>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue'
import { useFileUpload } from '@/composables/useFileUpload'

const props = defineProps({
  multiple: { type: Boolean, default: false },
})
const emit = defineEmits(['uploaded'])

const fileInput      = ref()
const dragOver       = ref(false)
const { upload, uploading, progress } = useFileUpload()

// Preview state
const previewDialog   = ref(false)
const originalPreview = ref('')
const removedPreview  = ref('')
const removeFailed    = ref(false)
const removing        = ref(false)
const progressText    = ref('Bu bir necha soniya davom etishi mumkin')
const selectedVersion = ref('original')
const currentFile     = ref(null)
const pendingFiles    = ref([])
let bgWorker = null

function openPicker() {
  fileInput.value?.click()
}

function onFilesPicked(e) {
  const files = Array.from(e.target.files || [])
  e.target.value = ''
  if (!files.length) return
  if (props.multiple) {
    pendingFiles.value = files.slice(1)
  }
  showPreview(files[0])
}

function onDrop(e) {
  dragOver.value = false
  const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
  if (!files.length) return
  if (props.multiple) {
    pendingFiles.value = files.slice(1)
  }
  showPreview(files[0])
}

function showPreview(file) {
  currentFile.value     = file
  originalPreview.value = URL.createObjectURL(file)
  removedPreview.value  = ''
  removeFailed.value    = false
  selectedVersion.value = 'original'
  progressText.value    = 'Bu bir necha soniya davom etishi mumkin'
  previewDialog.value   = true
}

function runBgRemoval() {
  if (!currentFile.value) return
  removing.value = true
  removeFailed.value = false
  progressText.value = 'Model yuklanmoqda...'

  bgWorker = new Worker(
    new URL('@/workers/bgRemoval.js', import.meta.url),
    { type: 'module' }
  )

  bgWorker.onmessage = (e) => {
    const msg = e.data
    if (msg.type === 'progress') {
      const pct = msg.total ? Math.round((msg.current / msg.total) * 100) : 0
      progressText.value = msg.key === 'downloading'
        ? `Model yuklanmoqda... ${pct}%`
        : `Qayta ishlanmoqda... ${pct}%`
    } else if (msg.type === 'done') {
      removedPreview.value  = URL.createObjectURL(msg.blob)
      selectedVersion.value = 'removed'
      removing.value = false
      terminateWorker()
    } else if (msg.type === 'error') {
      console.warn('BG removal failed:', msg.message)
      removeFailed.value = true
      removing.value = false
      terminateWorker()
    }
  }

  bgWorker.onerror = (err) => {
    console.warn('BG worker error:', err)
    removeFailed.value = true
    removing.value = false
    terminateWorker()
  }

  bgWorker.postMessage(currentFile.value)
}

function cancelBgRemoval() {
  terminateWorker()
  removing.value = false
}

function terminateWorker() {
  if (bgWorker) { bgWorker.terminate(); bgWorker = null }
}

async function acceptImage() {
  previewDialog.value = false

  let fileToUpload = currentFile.value
  if (selectedVersion.value === 'removed' && removedPreview.value) {
    const res  = await fetch(removedPreview.value)
    const blob = await res.blob()
    const name = (currentFile.value?.name || 'image').replace(/\.\w+$/, '') + '.png'
    fileToUpload = new File([blob], name, { type: 'image/png' })
  }

  const url = await upload(fileToUpload)
  if (url) emit('uploaded', url)
  cleanup()

  // Process next file if multiple
  if (pendingFiles.value.length) {
    const next = pendingFiles.value.shift()
    showPreview(next)
  }
}

function cancelPreview() {
  previewDialog.value = false
  pendingFiles.value  = []
  terminateWorker()
  cleanup()
}

function cleanup() {
  if (originalPreview.value) URL.revokeObjectURL(originalPreview.value)
  if (removedPreview.value)  URL.revokeObjectURL(removedPreview.value)
  originalPreview.value = ''
  removedPreview.value  = ''
  currentFile.value     = null
}

onBeforeUnmount(() => { terminateWorker(); cleanup() })

defineExpose({ openPicker })
</script>

<style scoped>
.bz-img-upload-zone {
  border: 2px dashed var(--bz-border);
  border-radius: 14px;
  padding: 24px 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--bz-surface-2);
}
.bz-img-upload-zone:hover,
.bz-img-upload-active {
  border-color: var(--bz-primary);
  background: var(--bz-primary-soft);
}

.bz-img-option {
  position: relative;
  border: 2px solid var(--bz-border);
  border-radius: 16px;
  padding: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  max-width: 260px;
  flex: 1;
}
.bz-img-option:hover { border-color: var(--bz-primary); }
.bz-img-option-selected {
  border-color: #16A34A !important;
  box-shadow: 0 0 0 2px rgba(22,163,74,0.25);
}
.bz-img-preview {
  width: 100%;
  aspect-ratio: 1;
  object-fit: contain;
  border-radius: 12px;
  display: block;
}
.bz-img-option-label {
  text-align: center;
  font-size: 12px;
  font-weight: 700;
  padding: 8px 0 4px;
  color: var(--bz-text-2);
  display: flex;
  align-items: center;
  justify-content: center;
}
.bz-img-check {
  position: absolute;
  top: 10px;
  right: 10px;
}

.bz-img-checker {
  background-image:
    linear-gradient(45deg, var(--bz-surface-3) 25%, transparent 25%),
    linear-gradient(-45deg, var(--bz-surface-3) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, var(--bz-surface-3) 75%),
    linear-gradient(-45deg, transparent 75%, var(--bz-surface-3) 75%);
  background-size: 16px 16px;
  background-position: 0 0, 0 8px, 8px -8px, -8px 0;
  border-radius: 12px;
}
</style>
