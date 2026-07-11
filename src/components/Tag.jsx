export default function Tag({ label, color = 'teal', small = false }) {
  if (!label) return null
  return <span className={`moa-tag moa-tag--${color} ${small ? 'moa-tag--small' : ''}`}>{label}</span>
}
