import type { Stock, AllocationMap, StockCurrentPricesType } from "./types/types";
import { StockPriceService } from "./services/StockPriceService";
import { Portfolio } from "./domain/Portfolio";
import { renderTable } from "./helpers/renderTable";

// ------ EJECUCIÓN -------

// Mis stocks
const stocks: Stock[] = [
    { ticker: "APPL", quantity: 100, price: new StockPriceService("APPL") },
    { ticker: "META", quantity: 80, price: new StockPriceService("META") }
];

// Mi distribución
const allocationMap: AllocationMap = {
    "APPL": 0.6,
    "META": 0.4
};

// Llamada a Portafolio
const portfolio = new Portfolio(stocks, allocationMap);

// Preparación los servicios externos para lo que pueda faltar
const stockCurrentPrices: StockCurrentPricesType = [];

for (const ticker in allocationMap) {
    stockCurrentPrices.push({
        ticker: ticker,
        price: new StockPriceService(ticker)
    });
}

// Rebalanceo
const rebalance = portfolio.getRebalance(stockCurrentPrices);

// Para mostrar en UI
const appDiv = document.querySelector<HTMLDivElement>('#app')!;

// Imprimir resultado limpio
if (rebalance.isError) {
    appDiv.innerHTML = `Error: ${rebalance.error}`;
    console.error(rebalance.error);
} else {
    renderTable(appDiv, rebalance.value);
    console.table(rebalance.value); 
}