import { removeBackground } from '@imgly/background-removal'

self.onmessage = async (e) => {
  try {
    const blob = await removeBackground(e.data, {
      output: { format: 'image/png' },
      progress: (key, current, total) => {
        self.postMessage({ type: 'progress', key, current, total })
      },
    })
    self.postMessage({ type: 'done', blob })
  } catch (err) {
    self.postMessage({ type: 'error', message: err.message || 'Failed' })
  }
}
