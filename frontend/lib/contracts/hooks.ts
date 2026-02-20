'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, erc20Abi } from 'viem';
import EscrowFactoryABI from './abi/EscrowFactory.json';
import ShipmentEscrowABI from './abi/ShipmentEscrow.json';
import { CONTRACTS, CHAIN_ID } from './addresses';
import { STATUS_MAP } from './types';

// --- Read Hooks ---

export function useEscrowState(escrowAddress?: `0x${string}`) {
  const { data, isLoading, refetch } = useReadContract({
    address: escrowAddress,
    abi: ShipmentEscrowABI,
    functionName: 'getState',
    chainId: CHAIN_ID,
    query: { enabled: !!escrowAddress },
  });

  const state = data as [string, string, bigint, number, bigint, bigint, bigint] | undefined;

  return {
    buyer: state?.[0] as `0x${string}` | undefined,
    seller: state?.[1] as `0x${string}` | undefined,
    amount: state?.[2],
    status: state?.[3] !== undefined ? STATUS_MAP[state[3]] : undefined,
    statusRaw: state?.[3],
    createdAt: state?.[4],
    fundedAt: state?.[5],
    resolvedAt: state?.[6],
    isLoading,
    refetch,
  };
}

export function useEscrowAddress(shipmentIdBytes32?: `0x${string}`) {
  const { data, isLoading } = useReadContract({
    address: CONTRACTS.sepolia.escrowFactory,
    abi: EscrowFactoryABI,
    functionName: 'getEscrow',
    args: shipmentIdBytes32 ? [shipmentIdBytes32] : undefined,
    chainId: CHAIN_ID,
    query: { enabled: !!shipmentIdBytes32 },
  });

  const address = data as `0x${string}` | undefined;
  const isZero = address === '0x0000000000000000000000000000000000000000';

  return {
    escrowAddress: isZero ? undefined : address,
    isLoading,
  };
}

// --- Write Hooks ---

export function useApproveUSDC() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const approve = (escrowAddress: `0x${string}`, amountUsdc: number) => {
    writeContract({
      address: CONTRACTS.sepolia.usdc,
      abi: erc20Abi,
      functionName: 'approve',
      args: [escrowAddress, parseUnits(amountUsdc.toString(), 6)],
      chainId: CHAIN_ID,
    });
  };

  return { approve, hash, isPending, isConfirming, isSuccess };
}

export function useFundEscrow() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const fund = (escrowAddress: `0x${string}`) => {
    writeContract({
      address: escrowAddress,
      abi: ShipmentEscrowABI,
      functionName: 'fund',
      chainId: CHAIN_ID,
    });
  };

  return { fund, hash, isPending, isConfirming, isSuccess };
}

export function useReleaseEscrow() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const release = (escrowAddress: `0x${string}`) => {
    writeContract({
      address: escrowAddress,
      abi: ShipmentEscrowABI,
      functionName: 'release',
      chainId: CHAIN_ID,
    });
  };

  return { release, hash, isPending, isConfirming, isSuccess };
}

export function useDisputeEscrow() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const dispute = (escrowAddress: `0x${string}`) => {
    writeContract({
      address: escrowAddress,
      abi: ShipmentEscrowABI,
      functionName: 'dispute',
      chainId: CHAIN_ID,
    });
  };

  return { dispute, hash, isPending, isConfirming, isSuccess };
}
