import { formatCurrency } from '../lib/format'

export default function MetricCard({ title, value, helper, tone = 'default', currency = false }) {
  const display = currency ? formatCurrency(value) : value
  return (
    <div className={`metric-card metric-${tone}`}>
      <span className="metric-title">{title}</span>
      <strong className="metric-value">{display}</strong>
      {helper && <small className="metric-helper">{helper}</small>}
    </div>
  )
}
