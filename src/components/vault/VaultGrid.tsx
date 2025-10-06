import React from "react";
import VaultCard from "./VaultCard";
import ComingSoonCard from "./ComingSoonCard";

interface VaultGridProps {
  vaults: any[];
  selectedVault: any;
  onSelectVault: (vault: any) => void;
}

const VaultGrid: React.FC<VaultGridProps> = ({
  vaults,
  selectedVault,
  onSelectVault,
}) => {
  const handleComingSoonSelect = () => {
    onSelectVault({
      id: 999,
      name: "Coming Soon...",
      description: "New vault strategies are being developed",
      token: "TBD",
      tokenAddress: "",
      vaultAddress: "",
      totalDeposits: 0,
      totalShares: 0,
      shareholderCount: 0,
      maxShareholders: 50,
      runTimestamp: 0,
      stopTimestamp: 0,
      depositsClosed: true,
      withdrawalsEnabled: false,
      apy: 0,
      riskLevel: "TBD",
      status: "coming_soon",
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Vaults */}
      {vaults.map((vault) => (
        <VaultCard
          key={vault.id}
          vault={vault}
          isSelected={selectedVault?.id === vault.id}
          onSelect={onSelectVault}
        />
      ))}

      {/* Coming Soon Vault */}
      <ComingSoonCard
        isSelected={selectedVault?.name === "Coming Soon..."}
        onSelect={handleComingSoonSelect}
      />
    </div>
  );
};

export default VaultGrid;
