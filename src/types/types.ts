// ==========================================
// 1. PATRÓN RESULT (Manejo de Errores)
// ==========================================

/**
 * Representa el resultado de una operación que puede fallar.
 * Reemplaza al try/catch tradicional para un flujo más predecible.
 */
export type Result<T, E = string> =
  | { isError: false; value: T }
  | { isError: true; error: E };

/**
 * Helper para crear resultados rápidos sin escribir el objeto entero.
 */
export const Result = {
  ok: <T>(value: T): Result<T> => ({ isError: false, value }),
  fail: <E>(error: E): Result<any, E> => ({ isError: true, error }),
};

// ==========================================
// 2. INTERFACES DE SERVICIOS
// ==========================================

/**
 * Contrato que debe cumplir cualquier proveedor de precios.
 * Permite cambiar entre API real, JSON local o Mocks sin romper el código.
 */
export interface IStockPriceService {
  /** El Ticker del stock (ej: "APPL") */
  readonly ticker: string;
  
  /** Obtiene el precio actual. Retorna un Result para manejar fallos de red/datos. */
  getPrice(): Result<number>;
}

// ==========================================
// 3. ENTIDADES DE DOMINIO (Entradas)
// ==========================================

/**
 * Representa una acción
 */
export interface Stock {
  ticker: string;
  quantity: number;
  /** Servicio inyectado capaz de obtener el precio de una determinada acción */
  price: IStockPriceService;
}

/**
 * Mapa de asignación de activos.
 * Clave: Ticker (ej. "APPL")
 * Valor: Porcentaje deseado en decimal (ej. 0.6 para 60%)
 */
export type AllocationMap = Record<string, number>;

/**
 * Array para servicios externos para lo que pueda faltar
 */
export type StockCurrentPricesType = {
  ticker: string;
  price: IStockPriceService;
}[];

export interface IPortfolio {
  stocks: Stock[];
  allocations: AllocationMap;
  getTotalPricePortfolio(): Result<number, string>;
  getComputedStocks(): Result<ComputedStock[], string>;
  getRebalance(externalPriceServices: StockCurrentPricesType): Result<ComputedStock[], string>;
}

// ==========================================
// 4. ENTIDADES DE REPORTE (Salidas)
// ==========================================

/**
 * Acciones posibles tras el análisis
 */
export type RebalanceAction = "Buy" | "Sell" | "None";

/**
 * Objeto maestro que contiene toda la información calculada para una acción.
 */
export interface ComputedStock {
  /** Código del stock (Ticker) */
  ticker: string;

  /** Porcentaje objetivo configurado (ej: 0.5) */
  allocation: number;
  
  /** Precio unitario de mercado encontrado (null si falló el servicio) */
  priceStock: number | null;

  /** Cantidad de acciones que se tiene */
  StockQuantity: number;

  /** Valor total actual que se tiene -> Cantidad * Precio */
  priceByQuantity: number;

  /** Valor total según tu estrategia */
  priceByAllocation: number;

  /** Cantidad de acciones a comprar/vender (Valor absoluto) */
  stocksQuantityTarget: number;

  /** La decisión final del algoritmo */
  target: RebalanceAction;

  /** Si hubo un error específico con este stock se guarda aquí */
  error: string | null;
}