import React from "react";

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'error' | 'warning' | 'info' | 'success';
}

const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info'
}) => {
  if (!isOpen) return null;

  const getColors = () => {
    switch (type) {
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-500',
          icon: '❌',
          titleColor: 'text-red-800',
          messageColor: 'text-red-700',
          buttonBg: 'bg-red-500 hover:bg-red-600'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-500',
          icon: '⚠️',
          titleColor: 'text-yellow-800',
          messageColor: 'text-yellow-700',
          buttonBg: 'bg-yellow-500 hover:bg-yellow-600'
        };
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-500',
          icon: '✅',
          titleColor: 'text-green-800',
          messageColor: 'text-green-700',
          buttonBg: 'bg-green-500 hover:bg-green-600'
        };
      default: // info
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-500',
          icon: 'ℹ️',
          titleColor: 'text-blue-800',
          messageColor: 'text-blue-700',
          buttonBg: 'bg-blue-500 hover:bg-blue-600'
        };
    }
  };

  const colors = getColors();

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-bounce-in">
        <div className={`${colors.bg} ${colors.border} border-l-4 rounded-lg p-4 mb-4`}>
          <div className="flex items-start">
            <span className="text-3xl mr-3">{colors.icon}</span>
            <div className="flex-1">
              <h3 className={`text-lg font-bold ${colors.titleColor} mb-2`}>
                {title}
              </h3>
              <p className={`${colors.messageColor} text-sm leading-relaxed`}>
                {message}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className={`${colors.buttonBg} text-white font-semibold py-2 px-6 rounded-full transition-all hover:scale-105 shadow-md`}
          >
            Begrepen
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
