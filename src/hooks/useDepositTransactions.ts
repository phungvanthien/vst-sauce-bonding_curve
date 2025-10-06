import { useState, useCallback, useEffect } from "react";
import { fetchDepositTransactions, DepositTransaction } from "@/utils/vault-utils";
import { toast } from "@/hooks/use-toast";

export const useDepositTransactions = () => {
  const [allDepositTransactions, setAllDepositTransactions] = useState<DepositTransaction[]>([]);
  const [depositTransactions, setDepositTransactions] = useState<DepositTransaction[]>([]);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [isLoadingDepositTransactions, setIsLoadingDepositTransactions] = useState(false);
  const [isLoadingMoreTransactions, setIsLoadingMoreTransactions] = useState(false);
  const [hasMoreTransactions, setHasMoreTransactions] = useState(true);
  const [currentOffset, setCurrentOffset] = useState(0);

  // Pagination state for loaded transactions
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Load deposit transactions for the selected vault
  const loadDepositTransactions = useCallback(async (selectedVault: any) => {
    if (!selectedVault || selectedVault.name === "Coming Soon...") {
      setAllDepositTransactions([]);
      setDepositTransactions([]);
      setTotalTransactions(0);
      setCurrentOffset(0);
      setHasMoreTransactions(true);
      setCurrentPage(1);
      return;
    }

    setIsLoadingDepositTransactions(true);
    try {
      // Fetch first 1000 deposit transactions from API
      const response = await fetchDepositTransactions(
        selectedVault.id,
        0, // offset - start from beginning
        1000 // limit - fetch first 1000 transactions
      );

      setAllDepositTransactions(response.transactions);
      setTotalTransactions(response.total);
      setCurrentOffset(1000); // Set offset for next load
      setHasMoreTransactions(response.transactions.length === 1000); // If we got exactly 1000, there might be more
      setCurrentPage(1); // Reset to first page
    } catch (error) {
      console.error("Error loading deposit transactions:", error);
      setAllDepositTransactions([]);
      setDepositTransactions([]);
      setTotalTransactions(0);
      setCurrentOffset(0);
      setHasMoreTransactions(false);

      // Show error toast to user
      toast({
        title: "Error",
        description: "Failed to load deposit transactions",
        variant: "destructive",
      });
    } finally {
      setIsLoadingDepositTransactions(false);
    }
  }, []);

  // Load more deposit transactions
  const loadMoreDepositTransactions = useCallback(async (selectedVault: any) => {
    if (
      !selectedVault ||
      selectedVault.name === "Coming Soon..." ||
      !hasMoreTransactions
    ) {
      return;
    }

    setIsLoadingMoreTransactions(true);
    try {
      // Fetch next 1000 deposit transactions from API
      const response = await fetchDepositTransactions(
        selectedVault.id,
        currentOffset, // offset - continue from where we left off
        1000 // limit - fetch next 1000 transactions
      );

      // Append new transactions to existing ones
      setAllDepositTransactions((prev) => [...prev, ...response.transactions]);
      setCurrentOffset((prev) => prev + 1000); // Update offset for next load
      setHasMoreTransactions(response.transactions.length === 1000); // If we got exactly 1000, there might be more
    } catch (error) {
      console.error("Error loading more deposit transactions:", error);

      // Show error toast to user
      toast({
        title: "Error",
        description: "Failed to load more transactions",
        variant: "destructive",
      });
    } finally {
      setIsLoadingMoreTransactions(false);
    }
  }, [currentOffset, hasMoreTransactions]);

  // Handle pagination for loaded transactions
  useEffect(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedTransactions = allDepositTransactions.slice(
      startIndex,
      endIndex
    );
    setDepositTransactions(paginatedTransactions);
  }, [allDepositTransactions, currentPage, pageSize]);

  return {
    allDepositTransactions,
    depositTransactions,
    totalTransactions,
    isLoadingDepositTransactions,
    isLoadingMoreTransactions,
    hasMoreTransactions,
    currentPage,
    pageSize,
    setCurrentPage,
    setPageSize,
    loadDepositTransactions,
    loadMoreDepositTransactions,
  };
};
