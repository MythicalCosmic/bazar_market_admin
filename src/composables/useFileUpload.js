import { ref } from 'vue'
import { useSnackStore } from '@/stores/snack'

const FILE_URL  = import.meta.env.VITE_FILE_SERVICE_URL || 'https://files.bazarmarket.org'
const FILE_TOKEN = import.meta.env.VITE_FILE_API_TOKEN || ''

export function useFileUpload() {
  const uploading = ref(false)
  const progress  = ref(0)

  async function upload(file) {
    if (!file) return null
    uploading.value = true
    progress.value  = 0

    const form = new FormData()
    form.append('file', file)

    try {
      const xhr = new XMLHttpRequest()
      const result = await new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', e => {
          if (e.lengthComputable) progress.value = Math.round((e.loaded / e.total) * 100)
        })
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText))
          } else {
            let msg = 'Yuklash xatosi'
            try { msg = JSON.parse(xhr.responseText).message || msg } catch {}
            reject(new Error(msg))
          }
        })
        xhr.addEventListener('error', () => reject(new Error('Tarmoq xatosi')))
        xhr.open('POST', `${FILE_URL}/files`)
        xhr.setRequestHeader('X-API-TOKEN', FILE_TOKEN)
        xhr.send(form)
      })
      return result.url
    } catch (e) {
      useSnackStore().error(e.message || 'Fayl yuklanmadi')
      return null
    } finally {
      uploading.value = false
      progress.value  = 0
    }
  }

  return { upload, uploading, progress }
}
