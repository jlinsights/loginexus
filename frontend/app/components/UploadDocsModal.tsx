'use client';

import React, { useState } from 'react';
import { X, UploadCloud, FileText, CheckCircle, Loader2 } from 'lucide-react';

interface UploadDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipmentId: string;
  trackingNumber: string;
  onSuccess?: () => void;
}

export function UploadDocsModal({ isOpen, onClose, trackingNumber, onSuccess }: UploadDocsModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    setIsUploading(true);
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsUploading(false);
    setIsDone(true);
    if (onSuccess) onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Upload Documents</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400">
            <X size={20} />
          </button>
        </div>

        {isDone ? (
           <div className="flex flex-col items-center gap-4 py-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400">
                <CheckCircle size={32} />
            </div>
            <div className="text-center">
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">Upload Complete</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Documents for #{trackingNumber} have been submitted.</p>
            </div>
            <button onClick={onClose} className="mt-4 px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-medium hover:opacity-90 transition-opacity">
                Close
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6">
                 <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    Please upload the Commercial Invoice and Packing List for shipment <strong>#{trackingNumber}</strong>.
                </p>
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer relative">
                    <input 
                        type="file" 
                        multiple 
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3">
                        <UploadCloud size={24} />
                    </div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">Click to upload or drag and drop</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">PDF, DOC, JPG up to 10MB</div>
                </div>

                {files.length > 0 && (
                    <div className="mt-4 space-y-2">
                        {files.map((f, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                                <FileText size={16} className="text-slate-500" />
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex-1 truncate">{f.name}</span>
                                <span className="text-xs text-slate-400">{(f.size / 1024).toFixed(0)} KB</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <button
                onClick={handleUpload}
                disabled={files.length === 0 || isUploading}
                className="w-full py-3 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {isUploading ? (
                    <>
                        <Loader2 size={18} className="animate-spin" />
                        Uploading...
                    </>
                ) : (
                    'Submit Documents'
                )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
