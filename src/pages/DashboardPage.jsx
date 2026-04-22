import MetricCard from '../components/MetricCard'
import { useStore } from '../App'
import { formatCurrency } from '../lib/format'

export default function DashboardPage() {
  const { report } = useStore()
  const critical = report.inventory.filter((item) => item.status === 'red')
  const attention = report.inventory.filter((item) => item.status === 'yellow')
  const topSales = [...report.sales].sort((a, b) => b.quantity - a.quantity).slice(0, 8)
  const needs = report.inventory.filter((item) => item.suggested_buy > 0).slice(0, 10)

  return (
    <div className="page-grid">
      <section className="page-header-card">
        <div>
          <h2>Dashboard do estoque</h2>
          <p>
            Suba os arquivos do Goomer e Ceofood, confira o faturamento e veja o que precisa comprar.
          </p>
        </div>
      </section>

      <section className="metric-grid four">
        <MetricCard title="Faturamento Goomer" value={report.revenueBySource.Goomer} currency tone="green" />
        <MetricCard title="Faturamento Ceofood" value={report.revenueBySource.Ceofood} currency tone="blue" />
        <MetricCard title="Faturamento total" value={report.totalRevenue} currency tone="orange" />
        <MetricCard title="Lucro bruto estimado" value={report.grossProfit} currency tone="purple" helper="Receita - custo teórico" />
      </section>

      <section className="metric-grid four">
        <MetricCard title="Itens críticos" value={critical.length} tone="red" helper="Precisa comprar logo" />
        <MetricCard title="Itens em atenção" value={attention.length} tone="yellow" helper="Acompanhar" />
        <MetricCard title="Sem ficha técnica" value={report.missingRecipeProducts.length} tone="red" helper="Ajuste em Ficha técnica" />
        <MetricCard title="Custo teórico do dia" value={report.totalCost} currency tone="default" />
      </section>

      <section className="card two-col">
        <div>
          <h3>O que comprar</h3>
          {needs.length ? (
            <ul className="list-grid">
              {needs.map((item) => (
                <li key={item.id} className={`status-card ${item.status}`}>
                  <strong>{item.name}</strong>
                  <span>Comprar: {item.suggested_buy} {item.unit}</span>
                  <small>Restante: {item.remaining} {item.unit} • Mínimo: {item.min_qty} {item.unit}</small>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty">Nenhum item precisando compra agora.</p>
          )}
        </div>
        <div>
          <h3>Mais vendidos</h3>
          {topSales.length ? (
            <ul className="simple-list">
              {topSales.map((sale) => (
                <li key={sale.normalized_name}>
                  <span>{sale.product_name}</span>
                  <strong>{sale.quantity} un</strong>
                  <small>{formatCurrency(sale.revenue)}</small>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty">Suba os arquivos do turno para calcular.</p>
          )}
        </div>
      </section>
    </div>
  )
}
