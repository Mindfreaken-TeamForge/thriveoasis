import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorDisplayProps {
  error: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error }) => {
  return (
    <div className="bg-red-500/10 p-4 rounded-lg flex items-center space-x-2 text-red-500">
      <AlertCircle className="h-5 w-5" />
      <span className="text-sm">{error}</span>
    </div>
  );
};

export default ErrorDisplay;