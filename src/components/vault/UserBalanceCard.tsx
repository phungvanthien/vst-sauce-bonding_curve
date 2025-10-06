import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface UserBalanceCardProps {
  user: any;
  userTokenBalance: number;
  isLoadingTokenBalance: boolean;
  currentTokenSymbol: string;
}

const UserBalanceCard: React.FC<UserBalanceCardProps> = ({
  user,
  userTokenBalance,
  isLoadingTokenBalance,
  currentTokenSymbol,
}) => {
  if (!user) return null;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Your {currentTokenSymbol} Balance</h3>
            <p className="text-sm text-cyrus-textSecondary">
              Available for vault deposits
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {isLoadingTokenBalance ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyrus-accent"></div>
                  Loading...
                </div>
              ) : (
                userTokenBalance.toFixed(2)
              )}{" "}
              {currentTokenSymbol}
            </div>
            {!isLoadingTokenBalance && (
              <div className="text-xs text-gray-500 mt-1">
                Raw: {userTokenBalance}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserBalanceCard;
