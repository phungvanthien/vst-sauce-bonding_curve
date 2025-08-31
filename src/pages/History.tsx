import { useState, useEffect } from "react";
import {
  ArrowUp,
  ArrowDown,
  Calendar,
  Search,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import axios from "axios";

// Interface for API response
interface ApiSymbolData {
  pair: string;
  revalue: number;
  total_volumn: number;
  num_order: number;
  roi: number;
  win_rate: number;
  indicators?: {
    indicator: string;
    revalue: number;
    total_volumn: number;
    num_order: number;
    roi: number;
    win_rate: number;
  }[];
}

// Interface for processed trade data
interface TradeData {
  id: string;
  token: string;
  direction: string;
  entryPrice: number;
  exitPrice: number;
  entryTime: string;
  exitTime: string;
  amount: number;
  profitLoss: number;
  profitLossPercentage: number;
  volume: number;
  factors: {
    rsi14: number;
    adx: number;
    rsi7: number;
    rsi14Adx: number;
    rsi14rsi7: number;
    adxrsi7: number;
  };
}

// Function to extract token from trading pair
const extractTokenFromPair = (pair: string): string => {
  // Common base currencies to remove
  const baseCurrencies = ["USDT", "USDC", "BTC", "ETH", "EUR", "USD"];

  for (const base of baseCurrencies) {
    if (pair.endsWith(base)) {
      return pair.substring(0, pair.length - base.length);
    }
  }

  // If no base currency found, return first 3-4 characters
  return pair.substring(0, Math.min(4, pair.length));
};

// Mock data for trade history (fallback)
// const mockTradeHistory = [
//   {
//     id: "hist1",
//     token: "ATOM",
//     direction: "long",
//     entryPrice: 8.72,
//     exitPrice: 9.45,
//     entryTime: "2025-04-01T10:15:00Z",
//     exitTime: "2025-04-02T14:30:00Z",
//     amount: 30,
//     profitLoss: 21.9,
//     profitLossPercentage: 8.37,
//     volume: 850.5,
//     factors: {
//       rsi14: 88,
//       adx: 78,
//       rsi7: 75,
//       rsi14Adx: 76,
//       rsi14rsi7: 70,
//       adxrsi7: 68,
//     },
//   },
//   {
//     id: "hist2",
//     token: "OSMO",
//     direction: "short",
//     entryPrice: 0.78,
//     exitPrice: 0.71,
//     entryTime: "2025-04-02T09:20:00Z",
//     exitTime: "2025-04-02T11:45:00Z",
//     amount: 150,
//     profitLoss: 10.5,
//     profitLossPercentage: 8.97,
//     volume: 1200.3,
//     factors: {
//       rsi14: 88,
//       adx: 78,
//       rsi7: 75,
//       rsi14Adx: 76,
//       rsi14rsi7: 70,
//       adxrsi7: 68,
//     },
//   },
//   {
//     id: "hist3",
//     token: "JUNO",
//     direction: "long",
//     entryPrice: 0.31,
//     exitPrice: 0.28,
//     entryTime: "2025-04-01T08:35:00Z",
//     exitTime: "2025-04-01T16:20:00Z",
//     amount: 80,
//     profitLoss: -2.4,
//     profitLossPercentage: -9.68,
//     volume: 645.8,
//     factors: {
//       rsi14: 88,
//       adx: 78,
//       rsi7: 75,
//       rsi14Adx: 76,
//       rsi14rsi7: 70,
//       adxrsi7: 68,
//     },
//   },
//   {
//     id: "hist4",
//     token: "INJ",
//     direction: "long",
//     entryPrice: 7.28,
//     exitPrice: 8.15,
//     entryTime: "2025-03-31T13:10:00Z",
//     exitTime: "2025-03-29T10:30:00Z",
//     amount: 15,
//     profitLoss: 13.05,
//     profitLossPercentage: 11.95,
//     volume: 2150.7,
//     factors: {
//       rsi14: 88,
//       adx: 78,
//       rsi7: 75,
//       rsi14Adx: 76,
//       rsi14rsi7: 70,
//       adxrsi7: 68,
//     },
//   },
//   {
//     id: "hist5",
//     token: "AKT",
//     direction: "short",
//     entryPrice: 1.92,
//     exitPrice: 2.05,
//     entryTime: "2025-03-28T11:05:00Z",
//     exitTime: "2025-03-31T09:15:00Z",
//     amount: 50,
//     profitLoss: -6.5,
//     profitLossPercentage: -6.77,
//     volume: 980.2,
//     factors: {
//       rsi14: 88,
//       adx: 78,
//       rsi7: 75,
//       rsi14Adx: 76,
//       rsi14rsi7: 70,
//       adxrsi7: 68,
//     },
//   },
//   {
//     id: "hist6",
//     token: "STARS",
//     direction: "long",
//     entryPrice: 0.022,
//     exitPrice: 0.025,
//     entryTime: "2025-03-20T15:30:00Z",
//     exitTime: "2025-03-25T16:45:00Z",
//     amount: 1200,
//     profitLoss: 3.6,
//     profitLossPercentage: 13.64,
//     volume: 1505.9,
//     factors: {
//       rsi14: 88,
//       adx: 78,
//       rsi7: 75,
//       rsi14Adx: 76,
//       rsi14rsi7: 70,
//       adxrsi7: 68,
//     },
//   },
// ];

const History = () => {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [tradeHistory, setTradeHistory] = useState<TradeData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 5;

  // Fetch trade history data from API
  const fetchTradeHistory = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // Clear existing data first to avoid confusion
      setTradeHistory([]);

      // Use the exact API endpoint as provided
      const response = await fetch(
        "https://api.vistia.co/api/v2_2/al-trade/validate/symbols?timeframe=1h&num_sessions=1000&tp_strat=sess4&detail=true"
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const apiData: ApiSymbolData[] = await response.json();

      if (!Array.isArray(apiData) || apiData.length === 0) {
        throw new Error("API returned empty or invalid data");
      }

      // Remove duplicates by grouping by pair
      const uniqueData = apiData.reduce(
        (acc: ApiSymbolData[], current: ApiSymbolData) => {
          const existingItem = acc.find((item) => item.pair === current.pair);
          if (!existingItem) {
            acc.push(current);
          }
          return acc;
        },
        []
      );

      // Transform API data to trade history format
      const processedTrades: TradeData[] = uniqueData
        .slice(0, 20)
        .map((item, index) => {
          const token = extractTokenFromPair(item.pair);
          const indicators = item.indicators || [];

          // Find each indicator
          const rsi14Indicator = indicators.find(
            (i) => i.indicator === "rsi14"
          );
          const adxIndicator = indicators.find((i) => i.indicator === "adx");
          const rsi7Indicator = indicators.find((i) => i.indicator === "rsi7");

          // Calculate factors using API data: win_rate/100 * num_order
          const rsi14Value = rsi14Indicator
            ? Math.round(
                (rsi14Indicator.win_rate / 100) * rsi14Indicator.num_order
              )
            : 0;
          const adxValue = adxIndicator
            ? Math.round((adxIndicator.win_rate / 100) * adxIndicator.num_order)
            : 0;
          const rsi7Value = rsi7Indicator
            ? Math.round(
                (rsi7Indicator.win_rate / 100) * rsi7Indicator.num_order
              )
            : 0;

          // Calculate confluence factors
          const rsi14Adx = Math.round((rsi14Value + adxValue) / 2);
          const rsi14rsi7 = Math.round((rsi14Value + rsi7Value) / 2);
          const adxrsi7 = Math.round((adxValue + rsi7Value) / 2);

          // Generate entry/exit data
          const basePrice = Math.random() * 100 + 1;
          const profitLoss = item.revalue || 0;
          const profitLossPercentage = item.roi || 0;
          const direction = profitLoss >= 0 ? "long" : "short";

          return {
            id: `trade-${index + 1}`,
            token: token,
            direction: direction,
            entryPrice: basePrice,
            exitPrice:
              direction === "long"
                ? basePrice * (1 + Math.abs(profitLossPercentage) / 100)
                : basePrice * (1 - Math.abs(profitLossPercentage) / 100),
            entryTime: new Date(
              Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
            ).toISOString(),
            exitTime: new Date(
              Date.now() - Math.random() * 24 * 60 * 60 * 1000
            ).toISOString(),
            amount: Math.floor(Math.random() * 200) + 10,
            profitLoss: profitLoss,
            profitLossPercentage: profitLossPercentage,
            volume: item.total_volumn || 0,
            factors: {
              rsi14: rsi14Value,
              adx: adxValue,
              rsi7: rsi7Value,
              rsi14Adx: rsi14Adx,
              rsi14rsi7: rsi14rsi7,
              adxrsi7: adxrsi7,
            },
          };
        });

      setTradeHistory(processedTrades);
    } catch (err) {
      console.error("❌ API Error:", err);
      setError(
        err instanceof Error ? err.message : "Cannot fetch trade history"
      );
      setTradeHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTradeHistory();
  }, []);

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "percent",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredTrades = tradeHistory.filter((trade) =>
    trade.token.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredTrades.length / itemsPerPage);
  const paginatedTrades = filteredTrades.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // Calculate overall statistics
  const totalTrades = tradeHistory.length;
  const profitableTrades = tradeHistory.filter(
    (trade) => trade.profitLoss > 0
  ).length;
  const winRate = (profitableTrades / totalTrades) * 100;
  const totalProfitLoss = tradeHistory.reduce(
    (sum, trade) => sum + trade.profitLoss,
    0
  );

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-medium">Trade History</h2>
          <p className="text-sm text-cyrus-textSecondary mt-1">
            {totalTrades} completed trades
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cyrus-textSecondary" />
            <input
              type="text"
              placeholder="Search by token..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="cyrus-input pl-9"
            />
          </div>

          <button
            onClick={fetchTradeHistory}
            disabled={isLoading}
            className="cyrus-button-secondary"
            title="Refresh trade history"
          >
            {isLoading ? "⟳" : "↻"} {isLoading ? "Loading..." : "Refresh"}
          </button>

          <button className="cyrus-button-secondary">
            <Calendar size={16} className="mr-2" />
            Date Range
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="cyrus-card bg-yellow-500/10 border-yellow-500/30">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-yellow-400">⚠️</span>
            <span className="text-yellow-300">API Error: {error}</span>
            <button
              onClick={fetchTradeHistory}
              className="ml-auto text-xs cyrus-button-secondary"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Statistics Cards - Win Rate, Total Profit/Loss, Trading Statistics */}
      {/*
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            title: "Win Rate",
            value: `${winRate.toFixed(1)}%`,
            gradient: "from-blue-400/80 to-cyrus-accent/80",
            progressWidth: `${winRate}%`,
            delay: "100ms",
          },
          {
            title: "Total Profit/Loss",
            value: formatCurrency(totalProfitLoss),
            valueColor:
              totalProfitLoss >= 0 ? "text-green-400" : "text-red-400",
            delay: "200ms",
          },
          {
            title: "Trading Statistics",
            isTable: true,
            rows: [
              { label: "Profitable Trades:", value: profitableTrades },
              {
                label: "Losing Trades:",
                value: totalTrades - profitableTrades,
              },
            ],
            delay: "300ms",
          },
        ].map((card, index) => (
          <div
            key={index}
            className="cyrus-card hover-lift"
            style={{
              animationDelay: card.delay,
              opacity: 0,
              animation: "fadeIn 0.5s ease forwards",
            }}
          >
            <div className="text-sm text-cyrus-textSecondary">{card.title}</div>

            {!card.isTable && (
              <div
                className={`mt-1 text-2xl font-medium ${card.valueColor || ""}`}
              >
                {card.value}
              </div>
            )}

            {card.gradient && card.progressWidth && (
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-cyrus-border/30">
                <div
                  className={`h-full bg-gradient-to-r ${card.gradient} transition-all duration-1000`}
                  style={{ width: card.progressWidth }}
                />
              </div>
            )}

            {card.isTable && (
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                {card.rows.map((row, idx) => (
                  <>
                    <div key={`label-${idx}`}>{row.label}</div>
                    <div
                      key={`value-${idx}`}
                      className="text-right font-medium"
                    >
                      {row.value}
                    </div>
                  </>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      */}

      <div
        className="cyrus-card overflow-hidden glass-card"
        style={{
          animationDelay: "400ms",
          opacity: 0,
          animation: "fadeIn 0.5s ease forwards",
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-cyrus-border/30">
                <th className="text-left py-3 px-4 text-sm font-medium text-cyrus-textSecondary">
                  Token
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-cyrus-textSecondary">
                  Direction
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-cyrus-textSecondary">
                  Entry Price
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-cyrus-textSecondary">
                  Exit Price
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-cyrus-textSecondary">
                  Volume
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-cyrus-textSecondary">
                  P/L
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-cyrus-textSecondary">
                  Exit Time
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedTrades.map((trade, index) => (
                <>
                  <tr
                    key={trade.id}
                    className="border-b border-cyrus-border/30 hover:bg-cyrus-card/70 cursor-pointer transition-all duration-300"
                    onClick={() => toggleRow(trade.id)}
                    style={{
                      animationDelay: `${500 + index * 100}ms`,
                      opacity: 0,
                      animation: "fadeIn 0.5s ease forwards",
                    }}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        {expandedRows[trade.id] ? (
                          <ChevronDown
                            size={16}
                            className="mr-2 text-cyrus-accent/80 transition-transform duration-300"
                          />
                        ) : (
                          <ChevronRight
                            size={16}
                            className="mr-2 transition-transform duration-300"
                          />
                        )}
                        <span className="font-medium">{trade.token}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div
                        className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium transition-colors duration-300 ${
                          trade.direction === "long"
                            ? "bg-green-500/5 text-green-400"
                            : "bg-red-500/5 text-red-400"
                        }`}
                      >
                        {trade.direction === "long" ? (
                          <ArrowUp size={12} className="mr-1" />
                        ) : (
                          <ArrowDown size={12} className="mr-1" />
                        )}
                        {trade.direction.toUpperCase()}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-cyrus-textSecondary">
                      ${trade.entryPrice.toFixed(4)}
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-cyrus-textSecondary">
                      ${trade.exitPrice.toFixed(4)}
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-cyrus-textSecondary">
                      {trade.volume.toFixed(2)}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div
                        className={
                          trade.profitLoss >= 0
                            ? "text-green-400"
                            : "text-red-400"
                        }
                      >
                        {formatCurrency(trade.profitLoss)} (
                        {formatPercentage(trade.profitLossPercentage)})
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right text-sm text-cyrus-textSecondary">
                      {formatDate(trade.exitTime)}
                    </td>
                  </tr>
                  {expandedRows[trade.id] && (
                    <tr className="bg-cyrus-background/30">
                      <td colSpan={7} className="px-4 py-4 animate-fadeIn">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm font-medium mb-2">
                              Single Indicator
                            </div>
                            <div className="p-3 rounded-md bg-cyrus-background/30 border border-cyrus-border/30">
                              {[
                                {
                                  name: "RSI 14",
                                  value: trade.factors.rsi14,
                                  color: "bg-purple-400",
                                },
                                {
                                  name: "ADX",
                                  value: trade.factors.adx,
                                  color: "bg-blue-400",
                                },
                                {
                                  name: "rsi7",
                                  value: trade.factors.rsi7,
                                  color: "bg-cyrus-accent/80",
                                },
                              ].map((factor, i) => {
                                return (
                                  <div key={i} className="mb-2 last:mb-0">
                                    <div className="flex justify-between text-xs mb-1">
                                      <span>{factor.name}</span>
                                      <span>{factor.value}/100</span>
                                    </div>
                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-cyrus-border/30">
                                      <div
                                        className={`h-full ${factor.color} transition-all duration-1000`}
                                        style={{ width: `${factor.value}%` }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <div>
                            <div className="text-sm font-medium mb-2">
                              Indicator Confluence
                            </div>
                            <div className="p-3 rounded-md bg-cyrus-background/30 border border-cyrus-border/30">
                              {[
                                {
                                  name: "RSI14 & ADX",
                                  value: trade.factors.rsi14Adx,
                                  color: "bg-yellow-400",
                                },
                                {
                                  name: "RSI14 & rsi7",
                                  value: trade.factors.rsi14rsi7,
                                  color: "bg-pink-400",
                                },
                                {
                                  name: "ADX & rsi7",
                                  value: trade.factors.adxrsi7,
                                  color: "bg-orange-400",
                                },
                              ].map((factor, i) => (
                                <div key={i} className="mb-2 last:mb-0">
                                  <div className="flex justify-between text-xs mb-1">
                                    <span>{factor.name}</span>
                                    <span>{factor.value}/100</span>
                                  </div>
                                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-cyrus-border/30">
                                    <div
                                      className={`h-full ${factor.color} transition-all duration-1000`}
                                      style={{ width: `${factor.value}%` }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            className="flex justify-center items-center gap-2 pt-4 pb-2"
            style={{
              animationDelay: "800ms",
              opacity: 0,
              animation: "fadeIn 0.5s ease forwards",
            }}
          >
            <button
              onClick={() => setPage(page > 1 ? page - 1 : 1)}
              disabled={page === 1}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-cyrus-border/50 bg-transparent text-cyrus-text transition-all duration-300 hover:bg-cyrus-card/60 disabled:opacity-30 disabled:pointer-events-none"
            >
              &lt;
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`h-8 w-8 rounded-md flex items-center justify-center transition-all duration-300 ${
                    pageNum === page
                      ? "bg-cyrus-accent/80 text-black shadow-sm"
                      : "bg-cyrus-card/60 text-cyrus-text hover:bg-cyrus-border/50"
                  }`}
                >
                  {pageNum}
                </button>
              )
            )}

            <button
              onClick={() => setPage(page < totalPages ? page + 1 : totalPages)}
              disabled={page === totalPages}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-cyrus-border/50 bg-transparent text-cyrus-text transition-all duration-300 hover:bg-cyrus-card/60 disabled:opacity-30 disabled:pointer-events-none"
            >
              &gt;
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
