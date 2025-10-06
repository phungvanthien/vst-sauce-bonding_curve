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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { TrendingUp, RefreshCw, Clock, Copy, ExternalLink } from "lucide-react";
import { formatHash, getTokenLogoUrl } from "@/utils/vault-utils";
import { formatUserAddress } from "@/utils/account-utils";

interface TransactionsTabProps {
  selectedVault: any;
  depositTransactions: any[];
  allDepositTransactions: any[];
  totalTransactions: number;
  isLoadingDepositTransactions: boolean;
  isLoadingMoreTransactions: boolean;
  hasMoreTransactions: boolean;
  currentPage: number;
  pageSize: number;
  onLoadMore: () => void;
  onPageSizeChange: (size: number) => void;
  onPageChange: (page: number) => void;
  onCopyAddress: (address: string) => void;
  onCopyHash: (hash: string) => void;
  onViewTransaction: (hash: string) => void;
}

const TransactionsTab: React.FC<TransactionsTabProps> = ({
  selectedVault,
  depositTransactions,
  allDepositTransactions,
  totalTransactions,
  isLoadingDepositTransactions,
  isLoadingMoreTransactions,
  hasMoreTransactions,
  currentPage,
  pageSize,
  onLoadMore,
  onPageSizeChange,
  onPageChange,
  onCopyAddress,
  onCopyHash,
  onViewTransaction,
}) => {
  if (!selectedVault || selectedVault.name === "Coming Soon...") {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-gray-400" />
            </div>
            <h4 className="text-lg font-medium text-gray-600 mb-2">
              No Vault Selected
            </h4>
            <p className="text-sm text-gray-500">
              Please select a vault to view deposit transactions.
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
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Deposit Transactions
            </CardTitle>
            <CardDescription>
              Recent deposit transactions for this vault
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onLoadMore}
            disabled={isLoadingMoreTransactions || !hasMoreTransactions}
            className="flex items-center gap-2"
          >
            {isLoadingMoreTransactions ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyrus-accent"></div>
                Loading More...
              </>
            ) : !hasMoreTransactions ? (
              <>
                All transactions loaded ({allDepositTransactions.length} total)
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Load More Transactions (1000 more)
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Page Size Selector and Transaction Count Display */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-cyrus-textSecondary">Show:</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => {
                onPageSizeChange(Number(value));
                onPageChange(1);
              }}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-cyrus-textSecondary">entries</span>
          </div>
          <div className="text-sm text-cyrus-textSecondary">
            Showing {depositTransactions.length} of{" "}
            {allDepositTransactions.length} loaded transactions
          </div>
        </div>

        {/* Transactions Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Shareholder</TableHead>
                <TableHead>Transaction Hash</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Token</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingDepositTransactions ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyrus-accent"></div>
                      <p className="text-cyrus-textSecondary">
                        Loading deposit transactions...
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : depositTransactions.length > 0 ? (
                depositTransactions.map((transaction, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-cyrus-textSecondary" />
                        <span className="text-sm">
                          {new Date(
                            transaction.timestamp * 1000
                          ).toLocaleString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">
                          {formatUserAddress(transaction.user_address)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            onCopyAddress(transaction.user_address)
                          }
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">
                          {formatHash(transaction.hash)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onCopyHash(transaction.hash)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewTransaction(transaction.hash)}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {transaction.amount.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center bg-gray-100">
                          <img
                            src={getTokenLogoUrl(selectedVault.token)}
                            alt={selectedVault.token}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                              const fallback =
                                target.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = "flex";
                            }}
                          />
                          <div
                            className="w-6 h-6 bg-cyrus-accent rounded-full flex items-center justify-center"
                            style={{ display: "none" }}
                          >
                            <span className="text-xs font-bold text-white">
                              {selectedVault.token.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <span className="font-medium">
                          {selectedVault.token}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <TrendingUp className="h-8 w-8 text-cyrus-textSecondary opacity-50" />
                      <p className="text-cyrus-textSecondary">
                        No deposit transactions found
                      </p>
                      <p className="text-sm text-cyrus-textSecondary">
                        Deposit transactions will appear here once users start
                        depositing
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination for loaded transactions */}
        {allDepositTransactions.length > pageSize && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-cyrus-textSecondary">
              Page {currentPage} of{" "}
              {Math.ceil(allDepositTransactions.length / pageSize)}
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationLink
                    onClick={() => onPageChange(1)}
                    className={
                      currentPage === 1
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  >
                    First
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    className={
                      currentPage === 1
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
                {/* Page Numbers */}
                {(() => {
                  const totalPages = Math.ceil(
                    allDepositTransactions.length / pageSize
                  );
                  const pages = [];
                  let startPage, endPage;

                  if (currentPage <= 3) {
                    startPage = 1;
                    endPage = Math.min(5, totalPages);
                  } else if (currentPage >= totalPages - 2) {
                    startPage = Math.max(1, totalPages - 4);
                    endPage = totalPages;
                  } else {
                    startPage = currentPage - 2;
                    endPage = currentPage + 2;
                  }

                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(
                      <PaginationItem key={i}>
                        <PaginationLink
                          onClick={() => onPageChange(i)}
                          isActive={currentPage === i}
                          className="cursor-pointer border-white"
                        >
                          {i}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }
                  return pages;
                })()}
                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      onPageChange(
                        Math.min(
                          Math.ceil(allDepositTransactions.length / pageSize),
                          currentPage + 1
                        )
                      )
                    }
                    className={
                      currentPage ===
                      Math.ceil(allDepositTransactions.length / pageSize)
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink
                    onClick={() =>
                      onPageChange(
                        Math.ceil(allDepositTransactions.length / pageSize)
                      )
                    }
                    className={
                      currentPage ===
                      Math.ceil(allDepositTransactions.length / pageSize)
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  >
                    Last
                  </PaginationLink>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}

        {/* Load More Button */}
        {hasMoreTransactions && allDepositTransactions.length > 0 && (
          <div className="flex justify-center mt-6">
            <Button
              onClick={onLoadMore}
              disabled={isLoadingMoreTransactions}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isLoadingMoreTransactions ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyrus-accent"></div>
                  Loading More...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Load More Transactions (1000 more)
                </>
              )}
            </Button>
          </div>
        )}

        {/* End of data message */}
        {!hasMoreTransactions && allDepositTransactions.length > 0 && (
          <div className="text-center mt-6">
            <p className="text-sm text-cyrus-textSecondary">
              All transactions loaded ({allDepositTransactions.length} total)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionsTab;
