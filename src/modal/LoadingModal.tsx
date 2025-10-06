import React from "react";

interface LoadingModalProps {
  isOpen: boolean;
  message?: string;
}

const LoadingModal: React.FC<LoadingModalProps> = ({
  isOpen,
  message = "Connecting...",
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-cyrus-card border border-cyrus-border rounded-lg p-8 shadow-xl">
        <div className="flex flex-col items-center space-y-4">
          {/* Loading Spinner */}
          <div className="relative">
            <div className="w-12 h-12 border-4 border-cyrus-border rounded-full animate-spin border-t-cyrus-accent"></div>
            <div className="absolute inset-0 w-12 h-12 border-4 border-transparent rounded-full animate-ping border-t-cyrus-accent/30"></div>
          </div>

          {/* Loading Text */}
          <div className="text-center">
            <p className="text-cyrus-text font-medium">{message}</p>
            <p className="text-cyrus-textSecondary text-sm mt-1">
              Please wait while we connect your wallet...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingModal;
