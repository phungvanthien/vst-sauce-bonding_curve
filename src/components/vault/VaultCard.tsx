import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Users } from "lucide-react";
import { formatTimestamp, getVaultStatus } from "@/utils/vault-utils";

interface VaultCardProps {
  vault: any;
  isSelected: boolean;
  onSelect: (vault: any) => void;
}

const VaultCard: React.FC<VaultCardProps> = ({
  vault,
  isSelected,
  onSelect,
}) => {
  const vaultStatus = getVaultStatus(vault);

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-lg ${
        isSelected ? "ring-2 ring-cyrus-accent" : ""
      }`}
      onClick={() => onSelect(vault)}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{vault.name}</CardTitle>
          <Badge
            variant={
              vaultStatus.status === "deposit-open" ? "default" : "secondary"
            }
            className={vaultStatus.className}
          >
            {vaultStatus.label}
          </Badge>
        </div>
        <CardDescription>{vault.description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* APY and Risk */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium">{vault.apy}% APY</span>
          </div>
          <Badge
            variant="outline"
            className={
              vault.riskLevel === "Low"
                ? "border-green-500 text-green-500"
                : vault.riskLevel === "Medium"
                ? "border-yellow-500 text-yellow-500"
                : "border-red-500 text-red-500"
            }
          >
            {vault.riskLevel} Risk
          </Badge>
        </div>

        {/* Total Shares */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-cyrus-textSecondary">Total Shares</span>
          <div className="flex items-center gap-2">
            <span className="font-medium">
              {vault.totalShares.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Shareholders */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-cyrus-textSecondary">Shareholders</span>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="font-medium">
              {vault.shareholderCount}/{vault.maxShareholders}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <Progress
          value={(vault.shareholderCount / vault.maxShareholders) * 100}
          className="h-2"
        />

        {/* Timestamps */}
        <div className="space-y-2 text-xs text-cyrus-textSecondary">
          <div className="flex items-center justify-between">
            <span>Deposit Close:</span>
            <span>{formatTimestamp(vault.runTimestamp)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Vault Close:</span>
            <span>{formatTimestamp(vault.stopTimestamp)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VaultCard;
