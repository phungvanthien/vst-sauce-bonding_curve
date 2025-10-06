import React from "react";
import { Button } from "@/components/ui/button";
import { Wallet, RefreshCw } from "lucide-react";
import { getUserAddress } from "@/utils/account-utils";

interface VaultHeaderProps {
  walletInfo: any;
  isLoadingVaultData: boolean;
  selectedVault: any;
  onRefreshVaultData: () => void;
}

const VaultHeader: React.FC<VaultHeaderProps> = ({
  walletInfo,
  isLoadingVaultData,
  selectedVault,
  onRefreshVaultData,
}) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-cyrus-text">Vault Management</h1>
        <p className="text-cyrus-textSecondary mt-2">
          Manage your investments across different vault strategies
        </p>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-cyrus-accent" />
          <span className="text-sm text-cyrus-textSecondary">
            {walletInfo?.type === "hashpack"
              ? "HashPack Connected"
              : walletInfo?.type === "evm"
              ? "EVM Wallet Connected"
              : "No Wallet Connected"}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefreshVaultData}
          disabled={isLoadingVaultData}
          className="flex items-center gap-2"
        >
          <RefreshCw
            className={`h-4 w-4 ${isLoadingVaultData ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>
    </div>
  );
};

export default VaultHeader;
