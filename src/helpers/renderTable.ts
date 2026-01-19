import type { ComputedStock } from "../types/types";

// Función auxiliar para generar el HTML de la tabla
export function renderTable(appDiv: HTMLDivElement, stocks: ComputedStock[]) {
  // Usamos Template Strings (``) para construir el HTML limpiamente
  const rows = stocks.map(stock => {
    
    // Lógica visual para las etiquetas (Buy/Sell)
    let badgeClass = "none";
    if (stock.target === "Buy") badgeClass = "buy";
    if (stock.target === "Sell") badgeClass = "sell";

    // Formatear dinero
    const fmt = (num: number) => `$${Math.floor(num).toLocaleString()}`;

    const targetText = stock.target === "Buy" ? "Comprar" : ( stock.target === "Sell" ? "Vender" : "Sin acción" );
    

    return `
      <tr>
        <td><strong>${stock.ticker}</strong></td>
        <td>${stock.priceStock ? `$${stock.priceStock}` : '<span style="color:red">N/A</span>'}</td>
        <td>${fmt(stock.priceByQuantity)}</td>
        <td>${fmt(stock.priceByAllocation)} <small class="text-gray">(${(stock.allocation * 100)}%)</small></td>
        <td>
          <span class="tag ${badgeClass}">${targetText}</span>
        </td>
        <td>
          <strong>${stock.stocksQuantityTarget > 0 ? stock.stocksQuantityTarget : '-'}</strong>
        </td>
      </tr>
    `;
  }).join('');

  // Inyectamos el HTML final
  appDiv.innerHTML = `
    <table border="1" class="table-auto">
      <thead>
        <tr>
          <th>Ticker</th>
          <th>Valor Actual</th>
          <th>Valor Total</th>
          <th>Valor Objetivo</th>
          <th>Acción</th>
          <th>Stocks necesarios</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}