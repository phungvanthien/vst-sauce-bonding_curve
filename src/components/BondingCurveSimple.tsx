import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export function BondingCurveSimple() {
  const [amount, setAmount] = useState("100");
  const [mode, setMode] = useState<"buy" | "sell">("buy");

  return (
    <div className="min-h-screen bg-cyrus-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          VST Bonding Curve
        </h1>
        
        <Card className="p-6 max-w-md mx-auto">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-cyrus-text mb-2">
                Amount (VST)
              </label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={() => setMode("buy")}
                className={`flex-1 ${mode === "buy" ? "bg-green-600" : "bg-gray-600"}`}
              >
                Buy VST
              </Button>
              <Button
                onClick={() => setMode("sell")}
                className={`flex-1 ${mode === "sell" ? "bg-red-600" : "bg-gray-600"}`}
              >
                Sell VST
              </Button>
            </div>
            
            <div className="text-center">
              <p className="text-cyrus-text">
                {mode === "buy" ? "Buy" : "Sell"} {amount} VST
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
