import React, { useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { CONTRACTS, CHAIN_ID } from '@/lib/contracts/addresses';
import { FileText, Search, ExternalLink } from 'lucide-react';

const LogisticsNFTABI = [
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "tokenURI",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
      "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
      "name": "ownerOf",
      "outputs": [{"internalType": "address", "name": "", "type": "address"}],
      "stateMutability": "view",
      "type": "function"
  }
] as const;

export default function NFTGallery() {
  const { address } = useAccount();
  const [tokenIdInput, setTokenIdInput] = useState('');
  const [queriedTokenId, setQueriedTokenId] = useState<bigint | null>(null);

  // Read Token URI
  const { data: tokenURI, isError: isUriError } = useReadContract({
    address: CONTRACTS.sepolia.logisticsNFT,
    abi: LogisticsNFTABI,
    functionName: 'tokenURI',
    args: queriedTokenId !== null ? [queriedTokenId] : undefined,
    chainId: CHAIN_ID,
    query: { enabled: queriedTokenId !== null },
  });

  // Read Owner
  const { data: ownerOf, isError: isOwnerError } = useReadContract({
    address: CONTRACTS.sepolia.logisticsNFT,
    abi: LogisticsNFTABI,
    functionName: 'ownerOf',
    args: queriedTokenId !== null ? [queriedTokenId] : undefined,
    chainId: CHAIN_ID,
    query: { enabled: queriedTokenId !== null },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (tokenIdInput) {
        setQueriedTokenId(BigInt(tokenIdInput));
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
        <FileText className="text-blue-500" />
        e-B/L (Electronic Bill of Lading) Viewer
      </h2>
      
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        Enter a Secure Digital Original ID to view its details and verify ownership on the blockchain.
      </p>

      <form onSubmit={handleSearch} className="flex gap-2 mb-8">
        <input 
            type="number" 
            placeholder="Token ID (e.g. 1)" 
            value={tokenIdInput}
            onChange={(e) => setTokenIdInput(e.target.value)}
            className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <button 
            type="submit"
            className="px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-2"
        >
            <Search size={18} />
            View
        </button>
      </form>

      {queriedTokenId !== null && (
          <div className="animate-in fade-in slide-in-from-bottom-2">
            {!ownerOf && !isOwnerError && <div className="text-slate-500">Loading...</div>}
            
            {(isUriError || isOwnerError) && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm">
                    Error: Token ID #{queriedTokenId.toString()} not found or invalid.
                </div>
            )}

            {ownerOf && (
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-200">Token #{queriedTokenId.toString()}</span>
                        <a 
                            href={`https://sepolia.etherscan.io/nft/${CONTRACTS.sepolia.logisticsNFT}/${queriedTokenId.toString()}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1"
                        >
                            View on Etherscan <ExternalLink size={12} />
                        </a>
                    </div>
                    <div className="p-4 space-y-3">
                        <div>
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Current Owner</span>
                            <p className="font-mono text-sm text-slate-700 dark:text-slate-300 break-all">
                                {ownerOf}
                                {address && ownerOf === address && <span className="ml-2 inline-block px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">You</span>}
                            </p>
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Metadata URI</span>
                            <p className="font-mono text-xs text-slate-500 dark:text-slate-400 break-all bg-slate-100 dark:bg-slate-900 p-2 rounded mt-1">
                                {tokenURI || 'No URI'}
                            </p>
                        </div>
                    </div>
                </div>
            )}
          </div>
      )}
    </div>
  );
}
