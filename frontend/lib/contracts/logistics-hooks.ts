'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, erc20Abi } from 'viem';
import LogisticsEscrowABI from './abi/LogisticsEscrow.json';
import { CONTRACTS, CHAIN_ID } from './addresses';

export interface EscrowTransaction {
  buyer: `0x${string}`;
  seller: `0x${string}`;
  amount: bigint;
  trackingNumber: string;
  status: number; // 0: PENDING, 1: LOCKED, 2: ARRIVED, 3: RELEASED, 4: REFUNDED
  createdAt: bigint;
  eblTokenId: bigint;
  isArrived: boolean;
}

// --- Read Hooks ---

export function useLogisticsEscrowTransaction(trackingNumber: string) {
  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACTS.sepolia.logisticsEscrow,
    abi: LogisticsEscrowABI,
    functionName: 'escrows', 
    args: [trackingNumber],
    chainId: CHAIN_ID,
    query: { enabled: !!trackingNumber },
  });

  // ABI: [buyer, seller, amount, trackingNumber, status, createdAt, eblTokenId, isArrived]
  const rawData = data as [(`0x${string}`), (`0x${string}`), bigint, string, number, bigint, bigint, boolean] | undefined;

  let transaction: EscrowTransaction | undefined;
  if (rawData && rawData[2] > BigInt(0)) { 
      transaction = {
          buyer: rawData[0],
          seller: rawData[1],
          amount: rawData[2],
          trackingNumber: rawData[3],
          status: rawData[4],
          createdAt: rawData[5],
          eblTokenId: rawData[6],
          isArrived: rawData[7]
      };
  }

  return {
    transaction,
    isLoading,
    refetch,
  };
}

// --- Write Hooks ---

export function useDepositEscrow() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const depositWithNFT = (trackingNumber: string, seller: `0x${string}`, amountUsdc: number, tokenId: number) => {
    writeContract({
      address: CONTRACTS.sepolia.logisticsEscrow,
      abi: LogisticsEscrowABI,
      functionName: 'depositWithNFT',
      args: [trackingNumber, seller, parseUnits(amountUsdc.toString(), 6), BigInt(tokenId)],
      chainId: CHAIN_ID,
    });
  };

  return { depositWithNFT, hash, isPending, isConfirming, isSuccess, error };
}

export function useFinalSettlement() {
    const { writeContract, data: hash, isPending, error } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  
    const settle = (trackingNumber: string) => {
      writeContract({
        address: CONTRACTS.sepolia.logisticsEscrow,
        abi: LogisticsEscrowABI,
        functionName: 'finalSettlement',
        args: [trackingNumber],
        chainId: CHAIN_ID,
      });
    };
  
    return { settle, hash, isPending, isConfirming, isSuccess, error };
  }

// Add LogisticsNFT ABI
const LogisticsNFTABI = [
  {
    "inputs": [{"internalType": "address", "name": "owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "tokenURI",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
   {
    "inputs": [{"internalType": "address", "name": "owner", "type": "address"}, {"internalType": "uint256", "name": "index", "type": "uint256"}],
    "name": "tokenOfOwnerByIndex",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export function useMyNFTs(address: `0x${string}` | undefined) {
    // Note: ERC721URIStorage does not have enumerable extension by default in OpenZeppelin v4 without explicitly adding it.
    // However, for this demo we might just check specific IDs or assume the user knows their ID.
    // IF the contract doesn't support Enumerable, we can't easily list all NFTs without an indexer.
    // Let's assume for the MVP demo we just check the first few IDs or check balance if possible.
    
    // WAIT, the provided LogisticsNFT.sol `LogisticsNFT is ERC721URIStorage` 
    // It DOES NOT inherit ERC721Enumerable.
    // So `tokenOfOwnerByIndex` will NOT work.
    
    // ALTERNATIVE: For MVP, we will just read the URI of a specific Token ID entered by the user, 
    // OR we modify the contract to be Enumerable (which requires redeploy).
    // Given we just finalized the contract, let's keep it simple: 
    // We will add a "Verify NFT Ownership" helper that checks ownerOf(tokenId).
    
    const { data: balance } = useReadContract({
        address: CONTRACTS.sepolia.logisticsNFT, // Need NFT Address in config
        abi: LogisticsNFTABI,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        chainId: CHAIN_ID,
        query: { enabled: !!address },
    });

    return { balance };
}

export function useApproveUSDCLogistics() {
    const { writeContract, data: hash, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  
    const approve = (amountUsdc: number) => {
      writeContract({
        address: CONTRACTS.sepolia.usdc,
        abi: erc20Abi,
        functionName: 'approve',
        args: [CONTRACTS.sepolia.logisticsEscrow, parseUnits(amountUsdc.toString(), 6)],
        chainId: CHAIN_ID,
      });
    };
  
    return { approve, hash, isPending, isConfirming, isSuccess };
  }
