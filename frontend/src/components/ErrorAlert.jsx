import { X } from 'lucide-react';

const ErrorAlert = ({ error, onClose }) => {
  if (!error) return null;

  return (
    <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm mb-4 flex items-center justify-between">
      <span>{error}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="text-red-400 hover:text-red-300 ml-2"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default ErrorAlert;
