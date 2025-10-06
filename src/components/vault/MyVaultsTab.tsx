import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Wallet } from "lucide-react";
import { formatVaultAmount } from "@/utils/vault-utils";

interface MyVaultsTabProps {
  vaults: any[];
  userShares: number;
}

const MyVaultsTab: React.FC<MyVaultsTabProps> = ({ vaults, userShares }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Vault Positions</CardTitle>
        <CardDescription>Overview of your vault investments</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {vaults.filter((vault) => userShares > 0).length > 0 ? (
            vaults.map((vault) => (
              <div
                key={vault.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <h4 className="font-medium">{vault.name}</h4>
                  <p className="text-sm text-cyrus-textSecondary">
                    {vault.description}
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-medium">{userShares} shares</div>
                  <div className="text-sm text-cyrus-textSecondary">
                    {formatVaultAmount(
                      userShares * (vault.totalDeposits / vault.totalShares)
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-cyrus-textSecondary">
              <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No position found</p>
              <p className="text-sm">
                Start investing in this vault to see your positions
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MyVaultsTab;
