export const CONTRACTS = {
  sepolia: {
    escrowFactory: (process.env.NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS ?? '0x') as `0x${string}`,
    usdc: (process.env.NEXT_PUBLIC_USDC_ADDRESS ?? '0x') as `0x${string}`,
  },
} as const;

export const CHAIN_ID = 11155111; // Sepolia
