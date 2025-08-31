import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Play,
  Percent,
  Activity,
  Pause,
  Crown,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  Scale,
} from "lucide-react";

// Interface for API response
interface ApiIndicatorData {
  indicator: string;
  revalue: number;
  total_volumn: number;
  num_order: number;
  roi: number;
  win_rate: number;
}

// Interface for processed metric data
interface MetricData {
  title: string;
  score: number;
  change: number;
  gradient: string;
  delay: string;
}

// Function to map API indicator names to display titles
const getIndicatorTitle = (indicator: string): string => {
  const titleMap: Record<string, string> = {
    adx: "ADX",
    rsi14: "RSI 14",
    rsi7: "RSI 7",
    psar: "PSAR",
    macd: "MACD",
    sma: "SMA",
    ema: "EMA",
  };

  return titleMap[indicator] || indicator.toUpperCase();
};

// Function to get gradient for each indicator
const getIndicatorGradient = (indicator: string): string => {
  const gradientMap: Record<string, string> = {
    rsi7: "from-green-400/80 to-cyrus-accent/80",
    rsi14: "from-blue-400/80 to-cyan-400/80",
    adx: "from-purple-400/80 to-pink-400/80",
    psar: "from-[#FF3366] to-[#CC33CC]",
  };

  return gradientMap[indicator] || "from-gray-400/80 to-gray-600/80";
};

// Mock data for charts and metrics (fallback)
const mockMetrics = {
  rsi7: {
    score: 91,
    change: 5.2,
  },
  rsi14: {
    score: 86,
    change: -2.8,
  },
  adx: {
    score: 83,
    change: 10.1,
  },
  psar: {
    score: 78,
    change: 6.1,
  },
};

const Dashboard = () => {
  const { user, toggleAgentStatus, refreshUserData } = useAuth();
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calculatedSignals, setCalculatedSignals] = useState({
    totalTASignals: user?.totalSignals || 0,
    accurateSignals: user?.accurateSignals || 0,
    accuracyRate: user?.accurateRate || 0,
  });

  // Cache và quản lý ổn định dữ liệu
  const cacheRef = useRef<{
    data: ApiIndicatorData[] | null;
    timestamp: number;
    scores: Record<string, number>;
  }>({
    data: null,
    timestamp: 0,
    scores: {},
  });

  const isInitialLoad = useRef(true);

  // Gọi API ổn định với caching
  const fetchIndicatorData = async (forceRefresh = false): Promise<void> => {
    const now = Date.now();
    const CACHE_DURATION = 120000; // Cache 2 phút để tránh nhảy giá trị

    // Sử dụng cache nếu có và chưa hết hạn (trừ khi force refresh)
    if (
      !forceRefresh &&
      cacheRef.current.data &&
      now - cacheRef.current.timestamp < CACHE_DURATION
    ) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const url = new URL(
        "https://api.vistia.co/api/v2_2/al-trade/validate/indicators"
      );
      url.searchParams.append("timeframe", "1h");
      url.searchParams.append("num_sessions", "10000");
      url.searchParams.append("tp_strat", "sess4");

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`Lỗi API: ${response.status}`);
      }

      const apiData: ApiIndicatorData[] = await response.json();

      if (!Array.isArray(apiData) || apiData.length === 0) {
        throw new Error("Dữ liệu API không hợp lệ hoặc rỗng");
      }

      // Tính toán Total TA Signals từ API data
      const adxData = apiData.find((item) => item.indicator === "adx");
      const rsi14Data = apiData.find((item) => item.indicator === "rsi14");
      const rsi7Data = apiData.find((item) => item.indicator === "rsi7");

      const totalTASignals = Math.round(
        (adxData?.win_rate || 0) +
          (rsi14Data?.win_rate || 0) +
          (rsi7Data?.win_rate || 0)
      );

      // Tính toán Number of Accurate Signals: (num_order * win_rate) cho từng indicator
      const accurateSignals = Math.round(
        ((adxData?.num_order || 0) * (adxData?.win_rate || 0)) / 100 +
          ((rsi14Data?.num_order || 0) * (rsi14Data?.win_rate || 0)) / 100 +
          ((rsi7Data?.num_order || 0) * (rsi7Data?.win_rate || 0)) / 100
      );

      // Tính toán Accuracy Rate: Number of Accurate Signals / Total TA Signals
      const accuracyRate =
        totalTASignals > 0 ? Math.round(accurateSignals / totalTASignals) : 0;

      // Cập nhật calculated signals
      setCalculatedSignals((prev) => ({
        ...prev,
        totalTASignals: totalTASignals,
        accurateSignals: accurateSignals,
        accuracyRate: accuracyRate,
      }));

      // Xử lý và ổn định dữ liệu
      const processedMetrics: MetricData[] = apiData.map((item, index) => {
        const newScore = Math.ceil(item.win_rate); // Làm tròn lên win_rate
        const previousScore = cacheRef.current.scores[item.indicator];

        // Chỉ tính change nếu có dữ liệu trước đó
        let change = 0;
        if (previousScore !== undefined && !isInitialLoad.current) {
          change = newScore - previousScore;
        }

        return {
          title: getIndicatorTitle(item.indicator),
          score: newScore,
          change: change,
          gradient: getIndicatorGradient(item.indicator),
          delay: `${600 + index * 100}ms`,
        };
      });

      // Cập nhật cache và scores
      const newScores: Record<string, number> = {};
      apiData.forEach((item) => {
        newScores[item.indicator] = Math.ceil(item.win_rate);
      });

      cacheRef.current = {
        data: apiData,
        timestamp: now,
        scores: newScores,
      };

      setMetrics(processedMetrics);
      isInitialLoad.current = false;
    } catch (err) {
      console.error("💥 Lỗi API:", err);
      setError(err instanceof Error ? err.message : "Không thể lấy dữ liệu");

      // Fallback về mock data chỉ khi load lần đầu
      if (metrics.length === 0) {
        const fallbackMetrics: MetricData[] = [
          {
            title: "RSI 7",
            score: mockMetrics.rsi7.score,
            change: 0,
            gradient: "from-green-400/80 to-cyrus-accent/80",
            delay: "600ms",
          },
          {
            title: "RSI 14",
            score: mockMetrics.rsi14.score,
            change: 0,
            gradient: "from-blue-400/80 to-cyan-400/80",
            delay: "700ms",
          },
          {
            title: "ADX",
            score: mockMetrics.adx.score,
            change: 0,
            gradient: "from-purple-400/80 to-pink-400/80",
            delay: "800ms",
          },
          {
            title: "PSAR",
            score: mockMetrics.psar.score,
            change: 0,
            gradient: "from-[#FF3366] to-[#CC33CC]",
            delay: "900ms",
          },
        ];
        setMetrics(fallbackMetrics);

        // Set default calculated signals if API fails
        setCalculatedSignals({
          totalTASignals: user?.totalSignals || 258, // fallback value
          accurateSignals: user?.accurateSignals || 180, // fallback value
          accuracyRate: user?.accurateRate || 69.77, // fallback value
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUserData();
    fetchIndicatorData(); // Load ban đầu

    // Thiết lập refresh định kỳ (ít thường xuyên hơn để tránh nhảy)
    const interval = setInterval(() => {
      refreshUserData();
      fetchIndicatorData(); // Sẽ sử dụng cache nếu dữ liệu còn mới
    }, 150000); // Mỗi 2.5 phút

    return () => clearInterval(interval);
  }, [refreshUserData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Xử lý refresh thủ công
  const handleManualRefresh = () => {
    fetchIndicatorData(true); // Force refresh
  };

  return (
    <div className="space-y-8 fade-in">
      {/* Capital Overview Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          {
            title: "Total TA Signals",
            value: calculatedSignals.totalTASignals,
            icon: <Activity size={18} />,
            color: "text-cyrus-accent",
            bg: "bg-cyrus-accent/10",
            delay: "100ms",
          },
          {
            title: "Number of Accurate Signals",
            value: calculatedSignals.accurateSignals,
            icon: <Crown size={18} />,
            color: "text-purple-400",
            bg: "bg-purple-500/10",
            delay: "200ms",
          },
          {
            title: "Accuracy Rate",
            value: calculatedSignals.accuracyRate,
            icon: <Percent size={18} />,
            color: "text-sky-400",
            bg: "bg-sky-500/10",
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
            <div className="flex items-center gap-3">
              <div className={`rounded-full ${card.bg} p-2 ${card.color}`}>
                {card.icon}
              </div>
              <div>
                <div className="text-sm text-cyrus-textSecondary">
                  {card.title}
                </div>
                <div className="text-xl font-medium">{card.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Agent Status Toggle */}
      <div
        className="cyrus-card glass-card"
        style={{
          animationDelay: "400ms",
          opacity: 0,
          animation: "fadeIn 0.5s ease forwards",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-medium">
            Indicator accuracy over the last 100 signals:
          </h2>

          <div className="flex items-center gap-3">
            {/* Nút Refresh Thủ công */}
            <button
              onClick={handleManualRefresh}
              disabled={isLoading}
              className="cyrus-button-secondary text-xs px-3 py-1"
              title="Refresh thủ công (bỏ qua cache)"
            >
              {isLoading ? "⟳" : "↻"} {isLoading ? "Đang tải..." : "Refresh"}
            </button>

            {/** Timeframe */}
            <div className="inline-flex shadow-2xs gap-2 border border-black-400/100 rounded-lg p-1">
              <button
                type="button"
                className="justify-center w-14 py-3 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700 focus:outline-hidden focus:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
              >
                30m
              </button>
              <button
                type="button"
                className=" justify-center  w-14 py-3 px-4 gap-1 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-2xs hover:bg-gray-50 focus:outline-hidden focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-700 dark:focus:bg-neutral-700"
              >
                1H
              </button>
              <button
                type="button"
                className=" justify-center  w-14 py-3 px-4 gap-1 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-2xs hover:bg-gray-50 focus:outline-hidden focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-700 dark:focus:bg-neutral-700"
              >
                4H
              </button>
              <button
                type="button"
                className=" justify-center  w-14 py-3 px-4 gap-1 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-2xs hover:bg-gray-50 focus:outline-hidden focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-700 dark:focus:bg-neutral-700"
              >
                1D
              </button>
            </div>
          </div>
        </div>

        {/* Hiển thị lỗi */}
        {error && (
          <div className="cyrus-card bg-yellow-500/10 border-yellow-500/30 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-yellow-400">⚠️</span>
              <span className="text-yellow-300">Lỗi API: {error}</span>
              <button
                onClick={handleManualRefresh}
                className="ml-auto text-xs cyrus-button-secondary"
              >
                Thử lại
              </button>
            </div>
          </div>
        )}

        {/** chart-line */}
        <div
          style={{
            animationDelay: "500ms",
            opacity: 0,
            animation: "fadeIn 0.5s ease forwards",
          }}
        >
          <div className="grid grid-cols-1 gap-4">
            {metrics.map((metric, index) => (
              <div
                key={`${metric.title}-${index}`}
                className="cyrus-card hover-lift"
                style={{
                  animationDelay: metric.delay,
                  opacity: 0,
                  animation: "fadeIn 0.5s ease forwards",
                }}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-medium">{metric.title}</h3>
                  <div
                    className={`flex items-center ${
                      metric.change > 0
                        ? "text-green-400"
                        : metric.change < 0
                        ? "text-red-400"
                        : "text-gray-400"
                    }`}
                  >
                    {metric.change > 0 ? (
                      <TrendingUp size={14} className="mr-1" />
                    ) : metric.change < 0 ? (
                      <TrendingDown size={14} className="mr-1" />
                    ) : (
                      <div className="w-4 h-4 mr-1" />
                    )}
                  </div>
                </div>

                <div className="mt-3 flex items-end">
                  <div className="text-3xl font-medium">{metric.score}</div>
                  <div className="ml-1 text-cyrus-textSecondary text-xs mb-1">
                    /100
                  </div>
                </div>

                <div className="mt-2 h-3.5 w-full overflow-hidden rounded-full bg-cyrus-border/30">
                  <div
                    className={`h-full bg-gradient-to-r ${metric.gradient} transition-all duration-1000`}
                    style={{ width: `${metric.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
    </div>
  );
};

export default Dashboard;
