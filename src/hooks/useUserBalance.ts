import { useState, useCallback } from "react";
import { getAccountBalance, getUserAddress } from "@/utils/account-utils";
import { getTokenDecimal } from "@/utils/token-utils";
import { Vault } from "@/utils/vault-utils";
import { ethers } from "ethers";
import { useAuth } from "@/contexts/AuthContext";

// Helper function to get EVM token balance
const getEVMTokenBalance = async (userAddress: string, tokenAddress: string): Promise<number> => {
  try {
    if (!window.ethereum) {
      throw new Error("No EVM wallet detected");
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    
    // ERC20 balanceOf function ABI
    const abi = [
      'function balanceOf(address owner) external view returns (uint256)'
    ];
    
    const contract = new ethers.Contract(tokenAddress, abi, provider);
    const balance = await contract.balanceOf(userAddress);
    
    return Number(balance.toString());
  } catch (error) {
    console.error("Error getting EVM token balance:", error);
    return 0;
  }
};

export const useUserBalance = (selectedVault: Vault) => {
  const { user } = useAuth();
  const [userTokenBalance, setUserTokenBalance] = useState(0);
  const [isLoadingTokenBalance, setIsLoadingTokenBalance] = useState(false);
  const [currentTokenSymbol, setCurrentTokenSymbol] = useState("USDC");

  const loadUserTokenBalance = useCallback(async () => {
    if (!user) return;

    setIsLoadingTokenBalance(true);
    try {
      const userAddress = getUserAddress(user);
      if (!userAddress) {
        console.warn("No user address available");
        setUserTokenBalance(0);
        return;
      }

      // Get token address - use USDC by default, or selected vault's token
      let tokenAddress: string;
      let tokenSymbol: string;
      
      if (selectedVault && selectedVault.tokenAddress) {
        // Use selected vault's token
        tokenAddress = selectedVault.tokenAddress;
        tokenSymbol = selectedVault.token || "USDC";
      } else {
        // Use USDC by default
        tokenAddress = "0x000000000000000000000000000000000006f89a";
        tokenSymbol = "USDC";
      }
      
      // Set the current token symbol
      setCurrentTokenSymbol(tokenSymbol);

      // Handle different wallet types
      let balance = 0;
      
      if (user.walletType === 'hashpack') {
        // For HashPack, use Hedera account ID format
        // Convert token address to Hedera format if needed
        let hederaTokenAddress = tokenAddress;
        if (tokenAddress.startsWith('0x')) {
          // Convert EVM address to Hedera token ID
          const { TokenId } = await import('@hashgraph/sdk');
          const tokenId = TokenId.fromEvmAddress(0, 0, tokenAddress);
          hederaTokenAddress = tokenId.toString();
        }
        
        balance = await getAccountBalance(
          userAddress as `0.0.${string}`,
          hederaTokenAddress as `0.0.${string}`
        );
      } else if (user.walletType === 'evm') {
        // For EVM wallets, use direct ERC20 balance check
        balance = await getEVMTokenBalance(userAddress, tokenAddress);
      } else {
        console.warn("Unknown wallet type:", user.walletType);
        setUserTokenBalance(0);
        return;
      }

      // Get token decimals dynamically
      const tokenDecimals = await getTokenDecimal(
        tokenAddress as `0x${string}`
      );

      // Convert from smallest units to human readable using dynamic decimals
      const balanceInUnits = Number(balance) / Math.pow(10, tokenDecimals);

      setUserTokenBalance(balanceInUnits);
    } catch (error) {
      console.error("Error loading token balance:", error);
      setUserTokenBalance(0);
    } finally {
      setIsLoadingTokenBalance(false);
    }
  }, [currentTokenSymbol, user, selectedVault]);

  return {
    userTokenBalance,
    isLoadingTokenBalance,
    currentTokenSymbol,
    loadUserTokenBalance,
  };
};
