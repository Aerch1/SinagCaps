import { X } from 'lucide-react';

const SuccessAlert = ({ message, onClose }) => {
    if (!message) return null;

    return (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-lg text-sm mb-4 flex items-center justify-between">
            <span>{message}</span>
            {onClose && (
                <button
                    onClick={onClose}
                    className="text-green-400 hover:text-green-300 ml-2"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    );
};

export default SuccessAlert;
