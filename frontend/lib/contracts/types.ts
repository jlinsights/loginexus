export type EscrowStatus = 'created' | 'funded' | 'released' | 'disputed' | 'refunded';

export interface EscrowState {
  buyer: `0x${string}`;
  seller: `0x${string}`;
  amount: bigint;
  status: number; // 0=Created, 1=Funded, 2=Released, 3=Disputed, 4=Refunded
  createdAt: bigint;
  fundedAt: bigint;
  resolvedAt: bigint;
}

export const STATUS_MAP: Record<number, EscrowStatus> = {
  0: 'created',
  1: 'funded',
  2: 'released',
  3: 'disputed',
  4: 'refunded',
};
