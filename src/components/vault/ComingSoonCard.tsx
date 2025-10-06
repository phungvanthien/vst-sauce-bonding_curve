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

interface ComingSoonCardProps {
  isSelected: boolean;
  onSelect: () => void;
}

const ComingSoonCard: React.FC<ComingSoonCardProps> = ({
  isSelected,
  onSelect,
}) => {
  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-lg ${
        isSelected ? "ring-2 ring-cyrus-accent" : ""
      }`}
      onClick={onSelect}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Coming Soon...</CardTitle>
          <Badge variant="secondary" className="bg-gray-500">
            Coming Soon
          </Badge>
        </div>
        <CardDescription>
          New vault strategies are being developed
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* APY and Risk */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-400">TBD% APY</span>
          </div>
          <Badge variant="outline" className="border-gray-400 text-gray-400">
            TBD Risk
          </Badge>
        </div>

        {/* Total Deposits */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-cyrus-textSecondary">
            Total Deposits
          </span>
          <span className="font-medium text-gray-400">$0.00</span>
        </div>

        {/* Shareholders */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-cyrus-textSecondary">Shareholders</span>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-400" />
            <span className="font-medium text-gray-400">0/50</span>
          </div>
        </div>

        {/* Progress bar */}
        <Progress value={0} className="h-2 bg-gray-200" />

        {/* Timestamps */}
        <div className="space-y-2 text-xs text-cyrus-textSecondary">
          <div className="flex items-center justify-between">
            <span>Deposits Close:</span>
            <span className="text-gray-400">TBD</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Vault Close:</span>
            <span className="text-gray-400">TBD</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ComingSoonCard;
