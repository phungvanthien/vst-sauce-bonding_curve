import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, ArrowUpRight, EyeOff, Clock } from "lucide-react";
import { formatVaultAmount, getVaultStatus, getTokenLogoUrl } from "@/utils/vault-utils";

interface VaultDetailsTabProps {
  selectedVault: any;
  userShares: number;
  userTotalDeposited: number;
  isLoadingSubscription: boolean;
  isSubscribed: boolean;
  showDepositForm: boolean;
  depositAmount: string;
  isLoading: boolean;
  onShowSubscriptionModal: () => void;
  onShowDepositForm: () => void;
  onHideDepositForm: () => void;
  onDepositAmountChange: (amount: string) => void;
  onDeposit: () => void;
}

const VaultDetailsTab: React.FC<VaultDetailsTabProps> = ({
  selectedVault,
  userShares,
  userTotalDeposited,
  isLoadingSubscription,
  isSubscribed,
  showDepositForm,
  depositAmount,
  isLoading,
  onShowSubscriptionModal,
  onShowDepositForm,
  onHideDepositForm,
  onDepositAmountChange,
  onDeposit,
}) => {
  if (!selectedVault) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-gray-400" />
            </div>
            <h4 className="text-lg font-medium text-gray-600 mb-2">
              No Vault Selected
            </h4>
            <p className="text-sm text-gray-500">
              Please select a vault from the list above to view details.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          {selectedVault.name}
          {selectedVault.name === "Coming Soon..." ? "" : " - Details"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {selectedVault.name === "Coming Soon..." ? (
          // Coming Soon Vault Details
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Vault Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Vault Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-cyrus-textSecondary">Token:</span>
                  <span className="font-medium text-gray-400">TBD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyrus-textSecondary">Total Deposits:</span>
                  <span className="font-medium text-gray-400">$0.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyrus-textSecondary">Total Shares:</span>
                  <span className="font-medium text-gray-400">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyrus-textSecondary">Your Shares:</span>
                  <span className="font-medium text-gray-400">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyrus-textSecondary">Your Total Deposited:</span>
                  <span className="font-medium text-gray-400">$0.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyrus-textSecondary">APY:</span>
                  <span className="font-medium text-gray-400">TBD%</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Quick Actions</h3>
              <div className="p-4 border rounded-lg bg-gray-50">
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="h-8 w-8 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-600 mb-2">
                    Coming Soon
                  </h4>
                  <p className="text-sm text-gray-500 mb-4">
                    This vault strategy is currently under development.
                  </p>
                </div>
              </div>
            </div>

            {/* Vault Stats */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Vault Statistics</h3>
              <div className="space-y-3">
                <div className="p-3 bg-cyrus-card/60 rounded-lg">
                  <div className="text-sm text-cyrus-textSecondary">Total Value Locked</div>
                  <div className="text-xl font-bold text-gray-400">$0.00</div>
                </div>
                <div className="p-3 bg-cyrus-card/60 rounded-lg">
                  <div className="text-sm text-cyrus-textSecondary">Your Position</div>
                  <div className="text-xl font-bold text-gray-400">$0.00</div>
                </div>
                <div className="p-3 bg-cyrus-card/60 rounded-lg">
                  <div className="text-sm text-cyrus-textSecondary">Shareholders</div>
                  <div className="text-xl font-bold text-gray-400">0</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Real Vault Details
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Vault Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Vault Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-cyrus-textSecondary">Token:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{selectedVault.token}</span>
                    <div className="w-4 h-4 rounded-full overflow-hidden flex items-center justify-center bg-gray-100">
                      <img
                        src={getTokenLogoUrl(selectedVault.token)}
                        alt={selectedVault.token}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = "flex";
                        }}
                      />
                      <div
                        className="w-4 h-4 bg-cyrus-accent rounded-full flex items-center justify-center"
                        style={{ display: "none" }}
                      >
                        <span className="text-xs font-bold text-white">
                          {selectedVault.token.charAt(0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-cyrus-textSecondary">Total Shares</span>
                    <div className="relative group">
                      <span className="w-4 h-4 bg-white rounded-full flex items-center justify-center text-black text-xs font-bold cursor-help">
                        i
                      </span>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        Each share represents 1 deposited token
                      </div>
                    </div>
                    <span className="text-cyrus-textSecondary">:</span>
                  </div>
                  <span className="font-medium">
                    {selectedVault.totalShares.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyrus-textSecondary">Your Shares:</span>
                  <span className="font-medium">{userShares.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyrus-textSecondary">Your Total Deposited:</span>
                  <span className="font-medium text-green-500">
                    {formatVaultAmount(userTotalDeposited, selectedVault.token)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyrus-textSecondary">APY:</span>
                  <span className="font-medium text-green-500">{selectedVault.apy}%</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Quick Actions</h3>

              {/* Subscription Check */}
              {isLoadingSubscription ? (
                <div className="flex items-center justify-center p-4 border rounded-lg">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyrus-accent mr-2"></div>
                  <span className="text-sm text-cyrus-textSecondary">
                    Checking subscription status...
                  </span>
                </div>
              ) : !isSubscribed ? (
                /* Subscribe Button - shown when not subscribed */
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-5 w-5 text-purple-600" />
                      <h4 className="font-semibold text-purple-900">
                        Premium Subscription Required
                      </h4>
                    </div>
                    <p className="text-sm text-purple-700 mb-4">
                      Subscribe to access vault deposits and premium features
                    </p>
                    <Button
                      onClick={onShowSubscriptionModal}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Subscribe Now
                    </Button>
                  </div>
                </div>
              ) : (
                /* Deposit Button - shown when subscribed */
                getVaultStatus(selectedVault).status === "deposit-open" && (
                  <div className="space-y-4">
                    {!showDepositForm ? (
                      <Button
                        onClick={onShowDepositForm}
                        className={`w-full ${
                          selectedVault.id === 4
                            ? "bg-blue-600 hover:bg-blue-700"
                            : "bg-green-600 hover:bg-green-700"
                        }`}
                        disabled={isLoading}
                      >
                        <ArrowUpRight className="h-4 w-4 mr-2" />
                        {selectedVault.id === 4 ? "Deposit to Real Vault" : "Deposit to Vault"}
                      </Button>
                    ) : (
                      <div className="space-y-3 p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="deposit-amount">
                            Amount ({selectedVault.token})
                          </Label>
                          <Button variant="ghost" size="sm" onClick={onHideDepositForm}>
                            <EyeOff className="h-4 w-4" />
                          </Button>
                        </div>
                        <Input
                          id="deposit-amount"
                          type="number"
                          placeholder="Enter amount"
                          value={depositAmount}
                          onChange={(e) => onDepositAmountChange(e.target.value)}
                          disabled={isLoading}
                          min="0.000001"
                          max="1000000"
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={onDeposit}
                            disabled={isLoading || !depositAmount}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            {isLoading ? "Processing..." : "Deposit"}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={onHideDepositForm}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>

            {/* Vault Stats */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Vault Statistics</h3>
              <div className="space-y-3">
                <div className="p-3 bg-cyrus-card/60 rounded-lg">
                  <div className="text-sm text-cyrus-textSecondary">Total Value Locked</div>
                  <div className="text-xl font-bold">
                    {formatVaultAmount(selectedVault.totalDeposits, selectedVault.token)}
                  </div>
                </div>
                <div className="p-3 bg-cyrus-card/60 rounded-lg">
                  <div className="text-sm text-cyrus-textSecondary">Your Position</div>
                  <div className="text-xl font-bold text-green-500">
                    {formatVaultAmount(userTotalDeposited, selectedVault.token)}
                  </div>
                </div>
                <div className="p-3 bg-cyrus-card/60 rounded-lg">
                  <div className="text-sm text-cyrus-textSecondary">Shareholders</div>
                  <div className="text-xl font-bold">{selectedVault.shareholderCount}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VaultDetailsTab;
