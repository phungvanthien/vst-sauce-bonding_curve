import { useState, useEffect } from "react";
import { ArrowUpDown, TrendingUp, TrendingDown, AlertCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  calculateBuyCost,
  calculateSellProceeds,
  getBondingCurveStatus,
  getPriceHistory,
  formatPrice,
  PricingData,
  SellData,
} from "@/services/bondingCurveService";
import { executeBuyTrade, executeSellTrade, getTradeErrorMessage } from "@/services/bondingCurveTradeService";
import { saveTradeRecord, getRecentTrades, clearAccountTrades, formatTradeRecord, getTradeStats } from "@/services/tradeHistoryService";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useWallet } from "@/contexts/WalletContext";
import { associateToken, getAssociationErrorMessage } from "@/services/tokenAssociationService";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

type TradeMode = "buy" | "sell";

export function BondingCurve() {
  const { walletInfo } = useWallet();
  const { toast } = useToast();
  const [associatingToken, setAssociatingToken] = useState(false);
  const [isTokenAssociated, setIsTokenAssociated] = useState<boolean | null>(null);
  const VST_TOKEN_ID = import.meta.env.VITE_VST_TOKEN_ID || "0.0.10048687";

  const [mode, setMode] = useState<TradeMode>("buy");
  const [amount, setAmount] = useState<string>("100");
  const [pricingData, setPricingData] = useState<PricingData | null>(null);
  const [sellData, setSellData] = useState<SellData | null>(null);
  const [loading, setLoading] = useState(false);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [curveStatus, setCurveStatus] = useState<any>(null);
  const [recentTrades, setRecentTrades] = useState<any[]>([]);
  const [tradeStats, setTradeStats] = useState<any>(null);

  
  // Check if token is already associated with wallet
  useEffect(() => {
    const checkTokenAssociation = async () => {
      if (!walletInfo?.isConnected || walletInfo.type !== "hashpack") {
        setIsTokenAssociated(null);
        return;
      }

      try {
        console.log(`🔍 Checking if token ${VST_TOKEN_ID} is associated...`);
        
        // Use Mirror Node API to check token relationships
        const mirrorNodeUrl = import.meta.env.VITE_MIRROR_NODE_URL || 'https://mainnet.mirrornode.hedera.com/api/v1';
        const accountId = walletInfo.accountId;
        
        const response = await axios.get(
          `${mirrorNodeUrl}/accounts/${accountId}/tokens?limit=100`
        );
        
        const tokens = response.data.tokens || [];
        const isAssociated = tokens.some((t: any) => t.token_id === VST_TOKEN_ID);
        
        console.log(`${isAssociated ? '✅' : '❌'} Token association status: ${isAssociated}`);
        setIsTokenAssociated(isAssociated);
      } catch (error) {
        console.error("❌ Error checking token association:", error);
        setIsTokenAssociated(false);
      }
    };

    checkTokenAssociation();
  }, [walletInfo?.isConnected, walletInfo?.accountId, VST_TOKEN_ID]);

  // Load trade history when wallet changes
  useEffect(() => {
    if (walletInfo?.accountId) {
      console.log(`📊 Loading trade history for ${walletInfo.accountId}...`);
      const trades = getRecentTrades(walletInfo.accountId, 10);
      const stats = getTradeStats(walletInfo.accountId);
      setRecentTrades(trades);
      setTradeStats(stats);
      console.log(`✅ Loaded ${trades.length} recent trades`);
    } else {
      setRecentTrades([]);
      setTradeStats(null);
    }
  }, [walletInfo?.accountId]);

  // Initialize bonding curve data
  useEffect(() => {
    try {
      const status = getBondingCurveStatus();
      setCurveStatus(status);
      const history = getPriceHistory(50000, 50);
      setPriceHistory(history);
    } catch (error) {
      console.error("Failed to initialize bonding curve:", error);
    }
  }, []);

  // Calculate pricing when amount changes
  useEffect(() => {
    if (!amount || isNaN(Number(amount))) {
      setPricingData(null);
      setSellData(null);
      return;
    }

    try {
      const numAmount = Number(amount);

      if (mode === "buy") {
        const pricing = calculateBuyCost(numAmount);
        setPricingData(pricing);
        setSellData(null);
      } else {
        const selling = calculateSellProceeds(numAmount);
        setSellData(selling);
        setPricingData(null);
      }
    } catch (error) {
      console.error("Price calculation error:", error);
      setPricingData(null);
      setSellData(null);
    }
  }, [amount, mode]);

  const handleSwapMode = () => {
    setMode(mode === "buy" ? "sell" : "buy");
    setAmount("100");
  };

  const handleMaxClick = () => {
    setAmount("10000");
  };

  const handleTrade = async () => {
    // Validate wallet first
    if (!walletInfo?.isConnected || walletInfo.type !== "hashpack") {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your HashPack wallet first",
        variant: "destructive",
      });
      return;
    }

    if (!walletInfo.manager) {
      toast({
        title: "Wallet Manager Error",
        description: "Wallet manager not initialized. Please reconnect.",
        variant: "destructive",
      });
      return;
    }

    const data = mode === "buy" ? pricingData : sellData;
    if (!data) {
      toast({
        title: "Error",
        description: "No pricing data available",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const treasuryId = import.meta.env.VITE_TREASURY_ID || "0.0.9451398";
      const tokenId = VST_TOKEN_ID;
      const numAmount = Number(amount);

      // Show detailed confirmation dialog with clear VST information
      const confirmMessage = mode === "buy" 
        ? `🛍️ BUY ${numAmount} VST TOKENS\n\n💰 You will send: ${data.totalCost} HBAR\n🎯 You will receive: ${numAmount} VST tokens\n\n📋 Transaction Process:\nStep 1: HBAR sent to treasury (HashPack will show "You receive: Nothing")\nStep 2: VST automatically transferred to your wallet\n\n⏱️ Total time: 5-10 seconds\n\n✅ Continue with this transaction?`
        : `💵 SELL ${numAmount} VST TOKENS\n\n🎯 You will send: ${numAmount} VST tokens\n💰 You will receive: ${data.hbarReceived} HBAR\n\n📋 Transaction Process:\nStep 1: VST burned/sent to treasury (HashPack will show "You receive: Nothing")\nStep 2: HBAR automatically transferred to your wallet\n\n⏱️ Total time: 5-10 seconds\n\n✅ Continue with this transaction?`;

      if (!confirm(confirmMessage)) {
        setLoading(false);
        return;
      }

      let txId: string;

      if (mode === "buy") {
        console.log(`🛍️ Executing buy transaction...`);
        console.log(`   Amount: ${numAmount} VST`);
        console.log(`   Cost: ${data.totalCost} HBAR`);

        // Show loading message
        toast({
          title: "⏳ Opening HashPack...",
          description: `HashPack will show "You receive: Nothing" - this is normal!\nVST will be transferred automatically after Step 1.`,
        });

        txId = await executeBuyTrade({
          buyerAccountId: walletInfo.accountId!,
          vstAmount: Math.floor(numAmount * 100000000), // Convert to raw units (8 decimals)
          hbarCost: data.totalCost,
          treasuryAccountId: treasuryId,
          vstTokenId: tokenId,
          manager: walletInfo.manager!,
        });
      } else {
        console.log(`💵 Executing sell transaction...`);
        console.log(`   Amount: ${numAmount} VST`);
        console.log(`   Proceeds: ${data.hbarReceived} HBAR`);

        // Show loading message
        toast({
          title: "⏳ Opening HashPack...",
          description: `HashPack will show "You receive: Nothing" - this is normal!\nHBAR will be transferred automatically after Step 1.`,
        });

        txId = await executeSellTrade({
          sellerAccountId: walletInfo.accountId!,
          vstAmount: Math.floor(numAmount * 100000000), // Convert to raw units (8 decimals)
          hbarProceeds: data.hbarReceived,
          treasuryAccountId: treasuryId,
          vstTokenId: tokenId,
          manager: walletInfo.manager!,
        });
      }

      if (!txId) {
        throw new Error("Transaction failed to execute");
      }

      console.log(`✅ ${mode.toUpperCase()} completed! TX: ${txId}`);

      // Save trade record
      if (walletInfo?.accountId) {
        const tradeAmount = Number(amount);
        const tradeCost = mode === "buy" ? data.totalCost : data.hbarReceived;
        
        saveTradeRecord({
          type: mode,
          account: walletInfo.accountId,
          amount: tradeAmount,
          cost: tradeCost,
          txId,
          status: "completed",
        });

        // Refresh trade history
        const updatedTrades = getRecentTrades(walletInfo.accountId, 10);
        const updatedStats = getTradeStats(walletInfo.accountId);
        setRecentTrades(updatedTrades);
        setTradeStats(updatedStats);
        console.log(`✅ Trade saved to history`);
      }

      toast({
        title: "Step 1 Complete!",
        description: mode === "buy" 
          ? `✅ HBAR sent to treasury!\n💰 You will receive ${numAmount} VST in 5-10 seconds\n📝 TX: ${txId.substring(0, 20)}...`
          : `✅ VST burned!\n💰 You will receive ${data.hbarReceived} HBAR in 5-10 seconds\n📝 TX: ${txId.substring(0, 20)}...`,
      });

      // Call backend to process Step 2
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
        console.log(`📡 Calling backend at ${backendUrl} to process Step 2...`);
        
        if (mode === "buy") {
          const response = await fetch(`${backendUrl}/api/bonding-curve/process-buy`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              buyer: walletInfo.accountId,
              vstAmount: Math.floor(numAmount * 100000000),
              step1TxId: txId,
            }),
          });
          
          if (!response.ok) {
            const error = await response.text();
            console.error(`❌ Backend Step 2 failed: ${error}`);
          } else {
            const result = await response.json();
            console.log(`✅ Backend Step 2 completed! VST TX: ${result.vstTxId}`);
            
            // Show success notification for VST received
            toast({
              title: "🎉 VST Received!",
              description: `✅ ${numAmount} VST tokens have been transferred to your wallet!\n📝 VST TX: ${result.vstTxId.substring(0, 20)}...`,
            });
          }
        } else {
          const response = await fetch(`${backendUrl}/api/bonding-curve/process-sell`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              seller: walletInfo.accountId,
              vstAmount: Math.floor(numAmount * 100000000),
              hbarProceeds: data.hbarReceived,
              step1TxId: txId,
            }),
          });
          
          if (!response.ok) {
            const error = await response.text();
            console.error(`❌ Backend Step 2 failed: ${error}`);
          } else {
            const result = await response.json();
            console.log(`✅ Backend Step 2 completed! HBAR TX: ${result.hbarTxId}`);
            
            // Show success notification for HBAR received
            toast({
              title: "🎉 HBAR Received!",
              description: `✅ ${data.hbarReceived} HBAR has been transferred to your wallet!\n📝 HBAR TX: ${result.hbarTxId.substring(0, 20)}...`,
            });
          }
        }
      } catch (backendError) {
        console.error(`⚠️  Backend Step 2 error (non-blocking):`, backendError);
      }

      // Reset form
      setAmount("100");
      setPricingData(null);
      setSellData(null);
    } catch (error) {
      console.error("❌ Trade failed:", error);
      const errorMessage = getTradeErrorMessage(error);
      toast({
        title: "Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const handleAssociateToken = async () => {
    if (!walletInfo?.isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    if (walletInfo.type !== "hashpack") {
      toast({
        title: "HashPack Required",
        description: "Please use HashPack wallet to associate tokens",
        variant: "destructive",
      });
      return;
    }

    if (!walletInfo.manager) {
      toast({
        title: "Wallet Manager Error",
        description: "Wallet manager not initialized. Please reconnect your wallet.",
        variant: "destructive",
      });
      return;
    }

    setAssociatingToken(true);
    try {
      console.log(`🔄 Starting VST token association...`);
      console.log(`   Account: ${walletInfo.accountId}`);
      console.log(`   Token ID: ${VST_TOKEN_ID}`);
      
      const txId = await associateToken(VST_TOKEN_ID, walletInfo.accountId!, walletInfo.manager);
      console.log(`✅ Token associated! TX: ${txId}`);

      toast({
        title: "Success!",
        description: `VST Token associated successfully!`,
      });

      // Reload page after 2 seconds to refresh token association status
      setTimeout(() => {
        console.log("🔄 Reloading page...");
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error("❌ Association failed:", error);
      const errorMessage = getAssociationErrorMessage(error);
      toast({ 
        title: "Failed", 
        description: errorMessage, 
        variant: "destructive" 
      });
    } finally {
      setAssociatingToken(false);
    }
  };

  if (!curveStatus) {
    return (
      <Card className="p-8 text-center">
        <p>Loading bonding curve...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-gradient">VST Bonding Curve</h1>
        <p className="text-cyrus-textSecondary">
          Buy and sell VST tokens with dynamic pricing
        </p>
      </div>

      
      {/* Associate Token Alert & Button */}
      {walletInfo?.isConnected && walletInfo.type === "hashpack" && !isTokenAssociated && (
        <Card className="p-4 border-yellow-500/50 bg-yellow-500/5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-yellow-500 mb-1">Associate VST Token</h3>
                <p className="text-sm text-cyrus-textSecondary">
                  Your wallet needs to associate with VST token (0.0.10048687) before trading.
                </p>
              </div>
            </div>
            <Button
              onClick={handleAssociateToken}
              disabled={associatingToken}
              className="bg-yellow-600 hover:bg-yellow-700 text-white flex-shrink-0"
            >
              {associatingToken ? "⏳ Associating..." : "Associate Token"}
            </Button>
          </div>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-cyrus-border/30">
          <div className="text-sm text-cyrus-textSecondary mb-2">Current Price</div>
          <div className="text-2xl font-bold text-cyrus-accent">
            {formatPrice(curveStatus.currentPrice)}
          </div>
          <div className="text-xs text-cyrus-textSecondary mt-1">per VST token</div>
        </Card>

        <Card className="p-4 border-cyrus-border/30">
          <div className="text-sm text-cyrus-textSecondary mb-2">Exchange Rate</div>
          <div className="text-2xl font-bold">1 HBAR = {curveStatus.initialExchangeRate} VST</div>
          <div className="text-xs text-cyrus-textSecondary mt-1">Initial rate</div>
        </Card>

        <Card className="p-4 border-cyrus-border/30">
          <div className="text-sm text-cyrus-textSecondary mb-2">Max Purchase</div>
          <div className="text-2xl font-bold text-cyrus-accent">
            {curveStatus.maxPurchase.toLocaleString()}
          </div>
          <div className="text-xs text-cyrus-textSecondary mt-1">per transaction</div>
        </Card>
      </div>

      {/* Price Chart */}
      <Card className="p-6 border-cyrus-border/30">
        <h2 className="text-xl font-bold mb-4 text-cyrus-text">Price Curve</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={priceHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="tokens"
              stroke="rgba(255,255,255,0.5)"
              label={{ value: "Tokens Sold", position: "insideBottomRight", offset: -5 }}
            />
            <YAxis
              stroke="rgba(255,255,255,0.5)"
              label={{ value: "Price (HBAR)", angle: -90, position: "insideLeft" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1a1a1a",
                border: "1px solid #2a2a2a",
                borderRadius: "8px",
              }}
              formatter={(value: any) => (typeof value === "number" ? value.toFixed(8) : value)}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#00E676"
              dot={false}
              name="Price per VST"
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Trade Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trade Input Card */}
        <Card className="p-6 border-cyrus-border/30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-cyrus-text">
              {mode === "buy" ? "Buy VST" : "Sell VST"}
            </h2>
            <button
              onClick={handleSwapMode}
              className="p-2 rounded-lg hover:bg-cyrus-card/60 transition-colors"
              title="Swap buy/sell"
            >
              <ArrowUpDown className="w-5 h-5 text-cyrus-accent" />
            </button>
          </div>

          {/* Mode Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => {
                setMode("buy");
                setAmount("100");
              }}
              className={`flex-1 py-2 px-4 rounded-lg transition-all ${
                mode === "buy"
                  ? "bg-cyrus-accent/20 border border-cyrus-accent text-cyrus-accent"
                  : "border border-cyrus-border/30 text-cyrus-textSecondary hover:bg-cyrus-card/60"
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-2" />
              Buy
            </button>
            <button
              onClick={() => {
                setMode("sell");
                setAmount("100");
              }}
              className={`flex-1 py-2 px-4 rounded-lg transition-all ${
                mode === "sell"
                  ? "bg-cyrus-accent/20 border border-cyrus-accent text-cyrus-accent"
                  : "border border-cyrus-border/30 text-cyrus-textSecondary hover:bg-cyrus-card/60"
              }`}
            >
              <TrendingDown className="w-4 h-4 inline mr-2" />
              Sell
            </button>
          </div>

          {/* Amount Input */}
          <div className="space-y-2 mb-4">
            <label className="text-sm text-cyrus-textSecondary">
              Amount (VST)
            </label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="flex-1 cyrus-input"
              />
              <Button
                onClick={handleMaxClick}
                variant="outline"
                className="text-cyrus-accent border-cyrus-accent/30 hover:bg-cyrus-accent/10"
              >
                MAX
              </Button>
            </div>
          </div>

          {/* Price Details */}
          {(pricingData || sellData) && (
            <div className="space-y-3 mb-6 p-4 rounded-lg bg-cyrus-card/40 border border-cyrus-border/30">
              <div className="flex justify-between text-sm">
                <span className="text-cyrus-textSecondary">
                  {mode === "buy" ? "Total Cost" : "Total Received"}
                </span>
                <span className="font-mono text-cyrus-accent">
                  {formatPrice(mode === "buy" ? pricingData!.totalCost : sellData!.totalReceived)}
                </span>
              </div>

              {mode === "buy" && pricingData && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-cyrus-textSecondary">Average Price</span>
                    <span className="font-mono text-cyrus-text">
                      {formatPrice(pricingData.averagePrice)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-cyrus-textSecondary">Final Price</span>
                    <span className="font-mono text-cyrus-text">
                      {formatPrice(pricingData.currentPrice)}
                    </span>
                  </div>
                </>
              )}

              <div className="flex justify-between text-sm border-t border-cyrus-border/30 pt-3">
                <span className="text-cyrus-textSecondary">Price Impact</span>
                <span
                  className={`font-mono ${
                    (mode === "buy" ? pricingData?.priceImpact : sellData?.priceImpact) || 0 > 0
                      ? "text-red-400"
                      : "text-green-400"
                  }`}
                >
                  {((mode === "buy" ? pricingData?.priceImpact : sellData?.priceImpact) || 0).toFixed(
                    2
                  )}
                  %
                </span>
              </div>
            </div>
          )}

          {/* Trade Button */}
          <Button
            onClick={handleTrade}
            disabled={loading || !amount || !pricingData && !sellData}
            className="w-full cyrus-button"
          >
            {loading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Processing...
              </>
            ) : mode === "buy" ? (
              "Buy VST"
            ) : (
              "Sell VST"
            )}
          </Button>

          {/* Note for Buy */}
          {mode === "buy" && (
            <div className="mt-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-xs text-blue-400 text-center">
                💡 Please associate VST token (TOKEN_ID=0.0.10048687) before buying
              </p>
            </div>
          )}
        </Card>

        {/* Info Card */}
        <Card className="p-6 border-cyrus-border/30">
          <h2 className="text-lg font-bold text-cyrus-text mb-4">Bonding Curve Info</h2>

          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-cyrus-accent/10 border border-cyrus-accent/20">
              <h3 className="text-sm font-semibold text-cyrus-accent mb-2">📈 How it works</h3>
              <ul className="text-xs text-cyrus-textSecondary space-y-1">
                <li>• Initial price: 1 HBAR = 100 VST</li>
                <li>• Price increases linearly with supply</li>
                <li>• Buy: HBAR → Treasury, VST → You</li>
                <li>• Sell: VST → Burned, HBAR → You</li>
              </ul>
            </div>

            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <h3 className="text-sm font-semibold text-blue-400 mb-2">💡 Formula</h3>
              <div className="text-xs text-cyrus-textSecondary space-y-1 font-mono">
                <div>Price = P₀ × (1 + K × n)</div>
                <div>Cost = P₀×n + (P₀×K×n²)/2</div>
                <div className="text-xs mt-2">where P₀ = initial price, K = linear coefficient</div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <h3 className="text-sm font-semibold text-purple-400 mb-2">⚠️ Limits</h3>
              <div className="text-xs text-cyrus-textSecondary space-y-1">
                <div>Min buy/sell: {curveStatus.minPurchase} VST</div>
                <div>Max buy/sell: {curveStatus.maxPurchase.toLocaleString()} VST</div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <h3 className="text-sm font-semibold text-green-400 mb-2">✅ Current Status</h3>
              <div className="text-xs text-cyrus-textSecondary space-y-1">
                <div>Supply Curve: Linear</div>
                <div>Network: Hedera Mainnet</div>
                <div>Status: Active</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Trades Section */}
      {recentTrades.length > 0 && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-cyrus-text">Recent Trades</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (walletInfo?.accountId) {
                    clearAccountTrades(walletInfo.accountId);
                    setRecentTrades([]);
                    setTradeStats(null);
                  }
                }}
                className="text-cyrus-textSecondary hover:text-red-400"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            {/* Trade Statistics */}
            {tradeStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="text-xs text-cyrus-textSecondary">Total Trades</div>
                  <div className="text-lg font-bold text-blue-400">{tradeStats.totalTrades}</div>
                </div>
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="text-xs text-cyrus-textSecondary">Buys</div>
                  <div className="text-lg font-bold text-green-400">{tradeStats.buyCount}</div>
                </div>
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="text-xs text-cyrus-textSecondary">Sells</div>
                  <div className="text-lg font-bold text-red-400">{tradeStats.sellCount}</div>
                </div>
                <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <div className="text-xs text-cyrus-textSecondary">Net VST</div>
                  <div className={`text-lg font-bold ${tradeStats.netVST >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {tradeStats.netVST >= 0 ? "+" : ""}{tradeStats.netVST.toFixed(2)}
                  </div>
                </div>
              </div>
            )}

            {/* Trade History Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cyrus-border/30">
                    <th className="text-left py-2 px-3 text-cyrus-textSecondary font-semibold">Type</th>
                    <th className="text-right py-2 px-3 text-cyrus-textSecondary font-semibold">Amount</th>
                    <th className="text-right py-2 px-3 text-cyrus-textSecondary font-semibold">Cost</th>
                    <th className="text-left py-2 px-3 text-cyrus-textSecondary font-semibold">Time</th>
                    <th className="text-left py-2 px-3 text-cyrus-textSecondary font-semibold">TX</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTrades.map((trade) => {
                    const formatted = formatTradeRecord(trade);
                    const isBuy = trade.type === "buy";
                    return (
                      <tr key={trade.id} className="border-b border-cyrus-border/10 hover:bg-cyrus-text/5">
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center gap-1 font-semibold ${isBuy ? "text-green-400" : "text-red-400"}`}>
                            {isBuy ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            {formatted.type}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-cyrus-text">{formatted.amount}</td>
                        <td className="py-3 px-3 text-right font-mono text-cyrus-text">{formatted.cost}</td>
                        <td className="py-3 px-3 text-cyrus-textSecondary text-xs">{formatted.time}</td>
                        <td className="py-3 px-3 font-mono text-blue-400 text-xs hover:text-blue-300">
                          <a 
                            href={`https://mainnet.mirrornode.hedera.com/explorer/transaction/${trade.txId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {formatted.txIdShort}
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

