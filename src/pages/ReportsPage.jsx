import { useStore } from '../App'
import { exportPrintableHtml } from '../lib/inventory'
import { formatCurrency } from '../lib/format'

export default function ReportsPage() {
  const { report } = useStore()

  function printReport() {
    const popup = window.open('', '_blank', 'width=1000,height=800')
    if (!popup) return
    popup.document.write(exportPrintableHtml(report))
    popup.document.close()
    popup.focus()
    popup.print()
  }

  return (
    <div className="page-grid">
      <section className="page-header-card">
        <div>
          <h2>Relatórios</h2>
          <p>Use o botão abaixo para imprimir ou salvar em PDF um relatório visual do estoque.</p>
        </div>
        <button className="primary-button" onClick={printReport}>Imprimir / Salvar PDF</button>
      </section>

      <section className="card two-col">
        <div>
          <h3>Resumo financeiro</h3>
          <ul className="simple-list">
            <li><span>Faturamento Goomer</span><strong>{formatCurrency(report.revenueBySource.Goomer)}</strong></li>
            <li><span>Faturamento Ceofood</span><strong>{formatCurrency(report.revenueBySource.Ceofood)}</strong></li>
            <li><span>Total faturado</span><strong>{formatCurrency(report.totalRevenue)}</strong></li>
            <li><span>Custo teórico</span><strong>{formatCurrency(report.totalCost)}</strong></li>
            <li><span>Lucro bruto estimado</span><strong>{formatCurrency(report.grossProfit)}</strong></li>
          </ul>
        </div>
        <div>
          <h3>Observações</h3>
          <p>O lucro é estimado com base na ficha técnica e no custo cadastrado dos ingredientes. Quanto melhor preencher fichas e estoque, melhor fica a precisão.</p>
        </div>
      </section>

      <section className="card">
        <h3>Produtos sem ficha técnica</h3>
        {report.missingRecipeProducts.length ? (
          <ul className="simple-list">
            {report.missingRecipeProducts.map((item, index) => (
              <li key={`${item.normalized_name}-${index}`}>
                <span>{item.product_name}</span>
                <small>{item.reason}</small>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty">Tudo que foi vendido já tem ficha técnica cadastrada.</p>
        )}
      </section>
    </div>
  )
}
