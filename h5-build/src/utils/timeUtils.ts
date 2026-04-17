export function toBeijingTime(timeStr: string): string {
  if (!timeStr) return ''
  try {
    const d = new Date(timeStr)
    const utc = d.getTime() + d.getTimezoneOffset() * 60000
    const beijing = new Date(utc + 8 * 3600000)
    const y = beijing.getFullYear()
    const M = (beijing.getMonth() + 1).toString().padStart(2, '0')
    const D = beijing.getDate().toString().padStart(2, '0')
    const h = beijing.getHours().toString().padStart(2, '0')
    const m = beijing.getMinutes().toString().padStart(2, '0')
    return `${y}-${M}-${D} ${h}:${m}`
  } catch (e) {
    if (timeStr.length > 16) return timeStr.substring(0, 16).replace('T', ' ')
    return timeStr
  }
}

export function toBeijingTimeShort(timeStr: string): string {
  if (!timeStr) return ''
  try {
    const d = new Date(timeStr)
    const utc = d.getTime() + d.getTimezoneOffset() * 60000
    const beijing = new Date(utc + 8 * 3600000)
    const h = beijing.getHours().toString().padStart(2, '0')
    const m = beijing.getMinutes().toString().padStart(2, '0')
    return `${h}:${m}`
  } catch (e) {
    return timeStr.substring(11, 16)
  }
}
