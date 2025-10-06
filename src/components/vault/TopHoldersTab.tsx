import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RefreshCw, Users, Copy } from "lucide-react";
import { formatVaultAmount } from "@/utils/vault-utils";
import { formatUserAddress } from "@/utils/account-utils";

interface TopHoldersTabProps {
  selectedVault: any;
  topTraders: any[];
  isLoadingTopTraders: boolean;
  onRefresh: () => void;
  onCopyAddress: (address: string) => void;
}

const TopHoldersTab: React.FC<TopHoldersTabProps> = ({
  selectedVault,
  topTraders,
  isLoadingTopTraders,
  onRefresh,
  onCopyAddress,
}) => {
  if (!selectedVault || selectedVault.name === "Coming Soon...") {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <h4 className="text-lg font-medium text-gray-600 mb-2">
              No Vault Selected
            </h4>
            <p className="text-sm text-gray-500">
              Please select a vault to view top holders.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Top Holders</CardTitle>
            <CardDescription>
              Top 10 holders by amount deposited in this vault
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoadingTopTraders}
            className="flex items-center gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoadingTopTraders ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Shares</TableHead>
              <TableHead>Total Deposited</TableHead>
              <TableHead>Percentage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingTopTraders ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyrus-accent"></div>
                    <p className="text-cyrus-textSecondary">
                      Loading top holders...
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : topTraders.length > 0 ? (
              topTraders.slice(0, 10).map((holder, index) => (
                <TableRow key={holder.address}>
                  <TableCell className="font-medium">#{index + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">
                        {formatUserAddress(holder.address)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onCopyAddress(holder.address)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>{holder.shares.toLocaleString()}</TableCell>
                  <TableCell>
                    {formatVaultAmount(
                      holder.totalDeposited,
                      selectedVault.token
                    )}
                  </TableCell>
                  <TableCell>
                    {selectedVault.totalDeposits > 0
                      ? (
                          (holder.totalDeposited /
                            selectedVault.totalDeposits) *
                          100
                        ).toFixed(2) + "%"
                      : "0.00%"}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="h-8 w-8 text-cyrus-textSecondary opacity-50" />
                    <p className="text-cyrus-textSecondary">No holders found</p>
                    <p className="text-sm text-cyrus-textSecondary">
                      Holders will appear here once users start depositing
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default TopHoldersTab;
