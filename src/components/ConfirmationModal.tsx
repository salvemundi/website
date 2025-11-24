import React from "react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  activities: Array<{ title: string; email: string; price: number }>;
  totalCost: number;
  isLoading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  activities,
  totalCost,
  isLoading = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-beige rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8">
        <h2 className="text-3xl font-bold text-paars mb-4">
          Bevestig je inschrijving
        </h2>
        
        <p className="text-gray-700 mb-6">
          Je staat op het punt om je in te schrijven voor de volgende activiteiten:
        </p>

        <div className="bg-white rounded-xl p-4 mb-6 max-h-[40vh] overflow-y-auto">
          {activities.map((activity, idx) => (
            <div key={idx} className="border-b py-3 last:border-b-0">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-semibold text-paars text-lg">{activity.title}</p>
                  <p className="text-sm text-gray-600 mt-1">📧 {activity.email}</p>
                </div>
                <p className="text-oranje font-bold ml-4">€{activity.price.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-paars rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center text-white">
            <span className="text-xl font-bold">Totaal:</span>
            <span className="text-2xl font-bold text-geel">€{totalCost.toFixed(2)}</span>
          </div>
          {totalCost === 0 && (
            <p className="text-geel text-sm mt-2">
              ✓ Gratis activiteiten - je inschrijving wordt direct bevestigd!
            </p>
          )}
        </div>

        {totalCost > 0 && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-6">
            <p className="text-yellow-800">
              ⚠️ Let op: Deze functie ondersteunt momenteel alleen gratis activiteiten (€0.00). 
              Voor betaalde activiteiten neem contact op met Salve Mundi.
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-full hover:bg-gray-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Annuleren
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading || totalCost > 0}
            className="flex-1 bg-oranje text-white font-semibold py-3 px-6 rounded-full hover:bg-paars transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Bezig met inschrijven...' : 'Bevestig inschrijving'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
