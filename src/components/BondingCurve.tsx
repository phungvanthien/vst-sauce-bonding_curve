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
import { saveBurnRecord, getRecentBurnRecords, getBurnStats, getBurnHistoryForChart, formatBurnRecord, clearSellerBurnRecords } from "@/services/burnHistoryService";
import { updateStateAfterBuy, updateStateAfterSell, getBondingCurveStats } from "@/services/bondingCurveStateService";
import { getTreasuryStats, refreshTreasuryBalance } from "@/services/treasuryBalanceService";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
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
  const SAUCE_TOKEN_ID = "0.0.731861";

  const [mode, setMode] = useState<TradeMode>("buy");
  const [amount, setAmount] = useState<string>("100");
  const [pricingData, setPricingData] = useState<PricingData | null>(null);
  const [sellData, setSellData] = useState<SellData | null>(null);
  const [loading, setLoading] = useState(false);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [curveStatus, setCurveStatus] = useState<any>(null);
  const [treasuryStats, setTreasuryStats] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [recentTrades, setRecentTrades] = useState<any[]>([]);
  const [tradeStats, setTradeStats] = useState<any>(null);
  const [recentBurns, setRecentBurns] = useState<any[]>([]);
  const [burnStats, setBurnStats] = useState<any>(null);
  const [burnHistory, setBurnHistory] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState<{
    sauceBalance: number;
    vstBalance: number;
  }>({ sauceBalance: 0, vstBalance: 0 });

  
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
      try {
        const trades = getRecentTrades(walletInfo.accountId, 10);
        const stats = getTradeStats(walletInfo.accountId);
        
        console.log(`📈 Found ${trades.length} trades:`, trades);
        console.log(`📊 Trade stats:`, stats);
        
        setRecentTrades(trades);
        setTradeStats(stats);
        console.log(`✅ Loaded ${trades.length} recent trades`);
      } catch (error) {
        console.error("❌ Failed to load trade history:", error);
        setRecentTrades([]);
        setTradeStats(null);
      }
    } else {
      console.log(`📊 No account connected, clearing trade history`);
      setRecentTrades([]);
      setTradeStats(null);
    }
  }, [walletInfo?.accountId]);

  // Load wallet balance when wallet connects
  useEffect(() => {
    const fetchWalletBalance = async () => {
      if (walletInfo?.accountId) {
        try {
          console.log(`💰 Fetching wallet balance for ${walletInfo.accountId}...`);
          const mirrorNodeUrl = import.meta.env.VITE_MIRROR_NODE_URL || 'https://mainnet.mirrornode.hedera.com/api/v1';
          
          const response = await axios.get(
            `${mirrorNodeUrl}/accounts/${walletInfo.accountId}/tokens?limit=100`
          );
          
          const tokens = response.data.tokens || [];
          const sauceToken = tokens.find((t: any) => t.token_id === SAUCE_TOKEN_ID);
          const vstToken = tokens.find((t: any) => t.token_id === VST_TOKEN_ID);
          
          const sauceBalance = sauceToken ? sauceToken.balance / 1000000 : 0; // Sauce has 6 decimals
          const vstBalance = vstToken ? vstToken.balance / 100000000 : 0; // VST has 8 decimals
          
          setWalletBalance({ sauceBalance, vstBalance });
          console.log(`✅ Wallet balance loaded: ${sauceBalance.toFixed(6)} Sauce, ${vstBalance.toFixed(2)} VST`);
        } catch (error) {
          console.error("❌ Failed to fetch wallet balance:", error);
          setWalletBalance({ sauceBalance: 0, vstBalance: 0 });
        }
      } else {
        setWalletBalance({ sauceBalance: 0, vstBalance: 0 });
      }
    };

    fetchWalletBalance();
  }, [walletInfo?.accountId, SAUCE_TOKEN_ID, VST_TOKEN_ID]);

  // Load burn data when wallet connects
  useEffect(() => {
    if (walletInfo?.accountId) {
      try {
        const burns = getRecentBurnRecords(10);
        const stats = getBurnStats();
        const history = getBurnHistoryForChart(30);
        
        setRecentBurns(burns);
        setBurnStats(stats);
        setBurnHistory(history);
        
        console.log('🔥 Burn data loaded:', { burns: burns.length, stats, history: history.length });
      } catch (error) {
        console.error('❌ Failed to load burn data:', error);
      }
    }
  }, [walletInfo?.accountId]);

  // Load real-time bonding curve data
  const loadBondingCurveData = async () => {
    try {
      setIsRefreshing(true);
      console.log('📡 Loading real-time bonding curve data...');
      
      // Load Treasury stats
      const treasuryStats = await getTreasuryStats();
      setTreasuryStats(treasuryStats);
      
      // Load bonding curve status (now async)
      const status = await getBondingCurveStatus();
      setCurveStatus(status);
      
      // Load price history
      const history = getPriceHistory(50000, 50);
      setPriceHistory(history);
      
      console.log('✅ Real-time data loaded:', {
        treasuryBalance: treasuryStats.treasuryBalance,
        tokensSold: treasuryStats.tokensSold,
        currentPrice: status.currentPrice
      });
    } catch (error) {
      console.error("Error loading real-time bonding curve data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Initialize bonding curve data
  useEffect(() => {
    loadBondingCurveData();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadBondingCurveData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Calculate pricing when amount changes (now async)
  useEffect(() => {
    const calculatePricing = async () => {
      if (!amount || isNaN(Number(amount))) {
        setPricingData(null);
        setSellData(null);
        return;
      }

      try {
        const numAmount = Number(amount);

        if (mode === "buy") {
          const pricing = await calculateBuyCost(numAmount);
          setPricingData(pricing);
          setSellData(null);
        } else {
          const selling = await calculateSellProceeds(numAmount);
          setSellData(selling);
          setPricingData(null);
        }
      } catch (error) {
        console.error("Price calculation error:", error);
        setPricingData(null);
        setSellData(null);
      }
    };

    calculatePricing();
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
        ? `🛍️ BUY ${numAmount} VST TOKENS\n\n💰 You will send: ${data.totalCost} Sauce\n🎯 You will receive: ${numAmount} VST tokens\n\n📋 Transaction Process:\nStep 1: Sauce sent to treasury (HashPack will show "You receive: Nothing")\nStep 2: VST automatically transferred to your wallet\n\n⏱️ Total time: 5-10 seconds\n\n✅ Continue with this transaction?`
        : `💵 SELL ${numAmount} VST TOKENS\n\n🎯 You will send: ${numAmount} VST tokens\n💰 You will receive: ${data.sauceReceived} Sauce\n\n📋 Transaction Process:\nStep 1: VST burned/sent to treasury (HashPack will show "You receive: Nothing")\nStep 2: Sauce automatically transferred to your wallet\n\n⏱️ Total time: 5-10 seconds\n\n✅ Continue with this transaction?`;

      if (!confirm(confirmMessage)) {
        setLoading(false);
        return;
      }

      let txId: string;

      if (mode === "buy") {
        console.log(`🛍️ Executing buy transaction...`);
        console.log(`   Amount: ${numAmount} VST`);
        console.log(`   Cost: ${data.totalCost} Sauce`);

        // Show loading message
        toast({
          title: "⏳ Opening HashPack...",
          description: `HashPack will show "You receive: Nothing" - this is normal!\nVST will be transferred automatically after Step 1.`,
        });

        txId = await executeBuyTrade({
          buyerAccountId: walletInfo.accountId!,
          vstAmount: Math.floor(numAmount * 100000000), // Convert to raw units (8 decimals)
          sauceCost: data.totalCost,
          treasuryAccountId: treasuryId,
          vstTokenId: tokenId,
          sauceTokenId: SAUCE_TOKEN_ID,
          manager: walletInfo.manager!,
        });
      } else {
        console.log(`💵 Executing sell transaction...`);
        console.log(`   Amount: ${numAmount} VST`);
        console.log(`   Proceeds: ${data.sauceReceived} Sauce`);

        // Show loading message
        toast({
          title: "⏳ Opening HashPack...",
          description: `HashPack will show "You receive: Nothing" - this is normal!\nSauce will be transferred automatically after Step 1.`,
        });

        txId = await executeSellTrade({
          sellerAccountId: walletInfo.accountId!,
          vstAmount: Math.floor(numAmount * 100000000), // Convert to raw units (8 decimals)
          sauceProceeds: data.sauceReceived,
          treasuryAccountId: treasuryId,
          vstTokenId: tokenId,
          sauceTokenId: SAUCE_TOKEN_ID,
          manager: walletInfo.manager!,
        });
      }

      if (!txId) {
        throw new Error("Transaction failed to execute");
      }

      console.log(`✅ ${mode.toUpperCase()} completed! TX: ${txId}`);

        // Save trade record will be done after backend Step 2 completes
        // with the actual transaction ID from backend

      toast({
        title: "Step 1 Complete!",
        description: mode === "buy" 
          ? `✅ Sauce sent to treasury!\n💰 You will receive ${numAmount} VST in 5-10 seconds\n📝 TX: ${txId.substring(0, 20)}...`
          : `✅ VST burned!\n💰 You will receive ${data.sauceReceived} Sauce in 5-10 seconds\n📝 TX: ${txId.substring(0, 20)}...`,
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
            
            // Update bonding curve state after successful buy
            updateStateAfterBuy(numAmount);
            console.log(`📊 Bonding curve state updated: +${numAmount} VST sold`);
            
            // Save trade record with actual VST transfer transaction ID
            if (walletInfo?.accountId) {
              saveTradeRecord({
                type: "buy",
                account: walletInfo.accountId,
                amount: numAmount,
                cost: data.sauceCost,
                txId: result.vstTxId, // Use actual VST transfer TX instead of user TX
                status: "completed",
              });

              // Refresh trade history
              const updatedTrades = getRecentTrades(walletInfo.accountId, 10);
              const updatedStats = getTradeStats(walletInfo.accountId);
              setRecentTrades(updatedTrades);
              setTradeStats(updatedStats);
              console.log(`✅ Trade saved to history with VST TX: ${result.vstTxId}`);
            }
            
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
              hbarProceeds: data.sauceReceived,
              step1TxId: txId,
            }),
          });
          
          if (!response.ok) {
            const error = await response.text();
            console.error(`❌ Backend Step 2 failed: ${error}`);
          } else {
            const result = await response.json();
            console.log(`✅ Backend Step 2 completed! Sauce TX: ${result.sauceTxId}`);
            
            // Update bonding curve state after successful sell
            updateStateAfterSell(numAmount);
            console.log(`📊 Bonding curve state updated: +${numAmount} VST burned`);
            
            // Save trade record with actual Sauce transfer transaction ID
            if (walletInfo?.accountId) {
              saveTradeRecord({
                type: "sell",
                account: walletInfo.accountId,
                amount: numAmount,
                cost: data.sauceReceived,
                txId: result.sauceTxId, // Use actual Sauce transfer TX instead of user TX
                status: "completed",
              });

              // Refresh trade history
              const updatedTrades = getRecentTrades(walletInfo.accountId, 10);
              const updatedStats = getTradeStats(walletInfo.accountId);
              setRecentTrades(updatedTrades);
              setTradeStats(updatedStats);
              console.log(`✅ Trade saved to history with Sauce TX: ${result.sauceTxId}`);
            }
            
            // Show success notification for Sauce received
            toast({
              title: "🎉 Sauce Received!",
              description: `✅ ${data.sauceReceived} Sauce has been transferred to your wallet!\n📝 Sauce TX: ${result.sauceTxId.substring(0, 20)}...`,
            });

            // Save burn record with actual burn transaction ID
            try {
              saveBurnRecord({
                txId: result.burnTxId || result.sauceTxId, // Use burn TX if available, fallback to sauce TX
                amount: Math.floor(numAmount * 100000000), // VST amount in raw units
                seller: walletInfo.accountId!,
                sauceReceived: data.sauceReceived,
                status: 'completed',
              });
              
              // Refresh burn data
              const burns = getRecentBurnRecords(10);
              const stats = getBurnStats();
              const history = getBurnHistoryForChart(30);
              
              setRecentBurns(burns);
              setBurnStats(stats);
              setBurnHistory(history);
              
              console.log('🔥 Burn record saved and data refreshed');
            } catch (burnError) {
              console.error('❌ Failed to save burn record:', burnError);
            }
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

      {/* Treasury Stats */}
      {treasuryStats && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-cyrus-text">Treasury Status</h3>
            <Button
              onClick={loadBondingCurveData}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
              className="text-cyrus-textSecondary hover:text-cyrus-text"
            >
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 border-cyrus-border/30">
              <div className="text-sm text-cyrus-textSecondary mb-2">Treasury Balance</div>
              <div className="text-2xl font-bold text-blue-400">
                {treasuryStats.treasuryBalance?.toFixed(2) || "0.00"}
              </div>
              <div className="text-xs text-cyrus-textSecondary mt-1">VST tokens remaining</div>
            </Card>
            <Card className="p-4 border-cyrus-border/30">
              <div className="text-sm text-cyrus-textSecondary mb-2">Tokens Sold</div>
              <div className="text-2xl font-bold text-green-400">
                {treasuryStats.tokensSold?.toFixed(2) || "0.00"}
              </div>
              <div className="text-xs text-cyrus-textSecondary mt-1">VST tokens sold</div>
            </Card>
            <Card className="p-4 border-cyrus-border/30">
              <div className="text-sm text-cyrus-textSecondary mb-2">Sell Progress</div>
              <div className="text-2xl font-bold text-purple-400">
                {treasuryStats.sellPercentage?.toFixed(2) || "0.00"}%
              </div>
              <div className="text-xs text-cyrus-textSecondary mt-1">Of total supply</div>
            </Card>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-cyrus-border/30">
          <div className="text-sm text-cyrus-textSecondary mb-2">Current Price (Sauce)</div>
          <div className="text-2xl font-bold text-cyrus-accent">
            {curveStatus?.currentPrice?.toFixed(3) || "0.000"} Sauce
          </div>
          <div className="text-xs text-cyrus-textSecondary mt-1">Sauce per VST token</div>
        </Card>

        <Card className="p-4 border-cyrus-border/30">
          <div className="text-sm text-cyrus-textSecondary mb-2">Current Exchange Rate</div>
          <div className="text-2xl font-bold text-cyrus-accent">
            1 VST = {curveStatus?.currentExchangeRate?.toFixed(3) || "0.000"} Sauce
          </div>
          <div className="text-xs text-cyrus-textSecondary mt-1">Real-time VST-Sauce rate</div>
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
              label={{ value: "Price (Sauce)", angle: -90, position: "insideLeft" }}
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
              name="Price per VST (Sauce)"
              isAnimationActive={false}
            />
            {/* Real-time price reference line */}
            {curveStatus?.currentPrice && (
              <ReferenceLine
                y={curveStatus.currentPrice}
                stroke="#FFFFFF"
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{
                  value: `Current: ${curveStatus.currentPrice.toFixed(8)} Sauce`,
                  position: "top",
                  style: { 
                    fill: "#FFFFFF", 
                    fontSize: "12px",
                    fontWeight: "bold",
                    textShadow: "1px 1px 2px rgba(0,0,0,0.8)"
                  }
                }}
              />
            )}
            {/* Real-time tokens sold reference line */}
            {curveStatus?.totalTokensSold && (
              <ReferenceLine
                x={curveStatus.totalTokensSold}
                stroke="#4ECDC4"
                strokeDasharray="3 3"
                strokeWidth={2}
                label={{
                  value: `Sold: ${curveStatus.totalTokensSold.toFixed(0)} VST`,
                  position: "left",
                  style: { 
                    fill: "#4ECDC4", 
                    fontSize: "12px",
                    fontWeight: "bold",
                    textShadow: "1px 1px 2px rgba(0,0,0,0.8)"
                  }
                }}
              />
            )}
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
              {/* Wallet Balance */}
              {mode === "buy" && (
                <div className="flex justify-between text-sm">
                  <span className="text-cyrus-textSecondary">Your Sauce Balance</span>
                  <span className="font-mono text-green-400">
                    {walletBalance.sauceBalance.toFixed(6)} Sauce
                  </span>
                </div>
              )}
              {mode === "sell" && (
                <div className="flex justify-between text-sm">
                  <span className="text-cyrus-textSecondary">Your VST Balance</span>
                  <span className="font-mono text-blue-400">
                    {walletBalance.vstBalance.toFixed(2)} VST
                  </span>
                </div>
              )}
              
              <div className="flex justify-between text-sm">
                <span className="text-cyrus-textSecondary">
                  {mode === "buy" ? "Total Cost (Sauce)" : "Total Received (Sauce)"}
                </span>
                <span className="font-mono text-cyrus-accent">
                  {formatPrice(mode === "buy" ? pricingData?.totalCost || 0 : sellData?.sauceReceived || 0)}
                </span>
              </div>

              {mode === "buy" && pricingData && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-cyrus-textSecondary">Average Price (Sauce)</span>
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
                <span className="text-cyrus-textSecondary">Price Impact (Sauce)</span>
                <span
                  className={`font-mono ${
                    ((mode === "buy" ? pricingData?.priceImpact : sellData?.priceImpact) || 0) > 0
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
              
              {mode === "sell" && sellData && (
                <div className="flex justify-between text-sm border-t border-cyrus-border/30 pt-3">
                  <span className="text-cyrus-textSecondary">Average Price (Sauce)</span>
                  <span className="font-mono text-cyrus-text">
                    {formatPrice(sellData.sauceReceived / sellData.tokensToSell)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Trade Button */}
          <Button
            onClick={handleTrade}
            disabled={loading || !amount || (!pricingData && !sellData)}
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

          {/* Note for Sell */}
          {mode === "sell" && (
            <div className="mt-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <p className="text-xs text-orange-400 text-center">
                🔥 The VST tokens you sell will be burned after you receive Sauce in your wallet
              </p>
            </div>
          )}

          {/* VST Burn Statistics - Show only in Sell mode */}
          {mode === "sell" && (
            <div className="mt-6">
              <Card className="p-4 border-red-500/30 bg-red-500/5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-md font-bold text-red-400 flex items-center gap-2">
                    🔥 VST Burn Statistics
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (walletInfo?.accountId) {
                        clearSellerBurnRecords(walletInfo.accountId);
                        setRecentBurns([]);
                        setBurnStats(null);
                        setBurnHistory([]);
                      }
                    }}
                    className="text-red-400 border-red-400/30 hover:bg-red-400/10"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                </div>

                {/* Burn Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <div className="text-xs text-red-300 mb-1">Total Burned</div>
                    <div className="text-lg font-bold text-red-400">
                      {burnStats ? (burnStats.totalBurned / 100000000).toFixed(2) : "0.00"} VST
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <div className="text-xs text-orange-300 mb-1">Sauce Paid</div>
                    <div className="text-lg font-bold text-orange-400">
                      {burnStats ? burnStats.totalSaucePaid.toFixed(6) : "0.000000"} Sauce
                    </div>
                  </div>
                </div>

                {/* Recent Burn Transactions */}
                {recentBurns && recentBurns.length > 0 ? (
                  <div>
                    <h4 className="text-sm font-semibold text-red-400 mb-3">Recent Burns</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {recentBurns.slice(0, 3).map((burn) => {
                        const formatted = formatBurnRecord(burn);
                        return (
                          <div key={burn.id} className="flex items-center justify-between p-2 rounded bg-red-500/5 border border-red-500/10">
                            <div className="flex items-center gap-2">
                              <span className="text-red-400">🔥</span>
                              <span className="text-sm font-mono text-red-300">{formatted.amount} VST</span>
                            </div>
                            <div className="text-xs text-orange-400 font-mono">
                              {formatted.sauceReceived} Sauce
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="text-red-400 mb-2">🔥</div>
                    <div className="text-sm text-red-300">No VST burns yet</div>
                    <div className="text-xs text-red-400/70 mt-1">Sell VST tokens to see burn statistics</div>
                  </div>
                )}
              </Card>
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
                <li>• Initial price: 1 VST = 0.1 Sauce</li>
                <li>• Current price: 1 VST = {curveStatus?.currentExchangeRate?.toFixed(3) || "0.000"} Sauce</li>
                <li>• Price increases linearly with supply</li>
                <li>• Buy: Sauce → Treasury, VST → You</li>
                <li>• Sell: VST → Burned, Sauce → You</li>
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
      {recentTrades.length > 0 ? (
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
                    <th className="text-right py-2 px-3 text-cyrus-textSecondary font-semibold">Cost (Sauce)</th>
                    <th className="text-left py-2 px-3 text-cyrus-textSecondary font-semibold">Time</th>
                    <th className="text-left py-2 px-3 text-cyrus-textSecondary font-semibold">TX Status</th>
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
                            href={`https://hashscan.io/mainnet/transaction/${trade.txId}`}
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
      ) : (
        <Card className="p-6">
          <div className="text-center py-8">
            <h2 className="text-xl font-bold text-cyrus-text mb-2">Recent Trades</h2>
            <p className="text-cyrus-textSecondary mb-4">No trades yet</p>
            <p className="text-sm text-cyrus-textSecondary">
              Your trading history will appear here after you make your first buy or sell transaction.
            </p>
          </div>
        </Card>
      )}

    </div>
  );
}

