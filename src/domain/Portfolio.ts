import type {ComputedStock, Stock, AllocationMap, StockCurrentPricesType, IPortfolio} from "../types/types";
import {Result} from "../types/types";

export class Portfolio implements IPortfolio {
    constructor(public stocks: Stock[], public allocations: AllocationMap) {}

    /**
     * Obtiene el valor monetario total del portafolio actual
     * @returns Result<number, string>
     */
    public getTotalPricePortfolio(): Result<number, string>{
        let total = 0;

        try {
            for (const stock of this.stocks) {
                
                const priceResult = stock.price.getPrice();
                
                if (priceResult.isError) {
                    return Result.fail(`Error en stock ${stock.ticker}: ${priceResult.error}`);
                }

                if (!Number.isFinite(stock.quantity)) {
                    return Result.fail(`Invalid quantity stocks format: ${stock.quantity}`);
                }

                if (stock.quantity < 0) {
                    return Result.fail(`Quantity stock cannot be negative`);
                }

                if (!Number.isFinite(priceResult.value)) {
                    return Result.fail(`Invalid price format: ${priceResult.value}`);
                }

                if (stock.quantity < 0) {
                    return Result.fail(`Price cannot be negative`);
                }
                
                total += stock.quantity * priceResult.value;
            }
            return Result.ok(total);
        } catch (error) {
            return Result.fail(`Critical error calculating total: ${error}`);
        }
    }

    /**
     * Genera la tabla maestra de datos
     * @returns Result<ComputedStock[], string>
     */
    getComputedStocks(): Result<ComputedStock[], string> {
        const computedStocks:ComputedStock[] = [];

        try {
            const totalPortfolioResult = this.getTotalPricePortfolio();
            
            if (totalPortfolioResult.isError) {
                return Result.fail(totalPortfolioResult.error);
            }

            const totalValue = totalPortfolioResult.value;

            for (const ticker in this.allocations) {
                const allocation = this.allocations[ticker];
                const stockOwned = this.stocks.find(stock => stock.ticker === ticker);
                
                // Objeto base
                const currentComputedStock: ComputedStock = {
                    ticker: ticker,
                    StockQuantity: 0,
                    priceStock: null,
                    priceByQuantity: 0,
                    priceByAllocation: totalValue * allocation, 
                    allocation: allocation,
                    stocksQuantityTarget: 0,
                    target: "None",
                    error: null
                };

                // Si ya tengo acciones, calculo mi realidad actual
                if (stockOwned) {
                    const priceResult = stockOwned.price.getPrice();

                    if (priceResult.isError) {
                         currentComputedStock.error = priceResult.error;
                    } else {
                        currentComputedStock.StockQuantity = stockOwned.quantity;
                        currentComputedStock.priceStock = priceResult.value;
                        currentComputedStock.priceByQuantity = stockOwned.quantity * priceResult.value;
                    }
                }

                computedStocks.push(currentComputedStock);
            }

            return Result.ok(computedStocks);

        } catch (error) {
            return Result.fail(`Error computing stocks: ${error}`);
        }
    }

    /**
     * Calcula las órdenes de compra/venta
     * @param externalPriceServices StockCurrentPricesType Servicio de precios externo
     * @returns Result<ComputedStock[], string>
     */
    getRebalance(externalPriceServices: StockCurrentPricesType = []): Result<ComputedStock[], string> {
        // Obtenemos el computado
        const computedResult = this.getComputedStocks();
        if (computedResult.isError) return computedResult;

        const computedStocks = computedResult.value;

        try {
            computedStocks.forEach((stockData) => {
                
                let currentUnitPrice = stockData.priceStock;

                // Si no tenemos el precio (porque no tenemos la acción), buscamos en los servicios inyectados.
                if (currentUnitPrice === null) {
                    const serviceFound = externalPriceServices.find(s => s.ticker === stockData.ticker);
                    
                    if (serviceFound) {
                        const priceResult = serviceFound.price.getPrice();
                        
                        if (priceResult.isError) {
                            stockData.error = priceResult.error;
                        } else {
                            currentUnitPrice = priceResult.value;
                            // Guardamos el precio unitario encontrado para usarlo en la división
                            stockData.priceStock = currentUnitPrice; 
                        }
                    } else {
                        stockData.error = "No price service provided for new stock";
                    }
                }

                // Solo calculamos si tenemos un precio válido y no hay errores previos
                if (currentUnitPrice !== null && !stockData.error) {
                    
                    // Delta = Objetivo ($) - Realidad ($)
                    const delta = stockData.priceByAllocation - stockData.priceByQuantity;
                    
                    // Cantidad = Dinero / Precio Unitario
                    stockData.stocksQuantityTarget = Math.floor(Math.abs(delta) / currentUnitPrice);

                    if (delta > 0) { // Positivo = Falta plata (Comprar)
                        stockData.target = "Buy";
                    } else if (delta < 0) { // Negativo = Sobra plata (Vender)
                        stockData.target = "Sell";
                    }
                }
            });

            return Result.ok(computedStocks);

        } catch (error) {
            return Result.fail(`Error getting rebalance: ${error}`);
        }
    }
}