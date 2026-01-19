import { Result, type IStockPriceService } from "../types/types";
import strocksPrices from "../data/StocksPrices.json"

/**
 * Obtiene el precio de cada Ticker
 */
export class StockPriceService implements IStockPriceService {
    constructor(public readonly ticker: string) {}

    getPrice(): Result<number> {
        // Obtiene directamente del JSON
        const pricesMap = strocksPrices as Record<string, number>;
        
        const price = pricesMap[this.ticker];

        if (price === undefined) {
            return Result.fail(`Stock not found in JSON: ${this.ticker}`);
        }

        return Result.ok(price);
    }
}