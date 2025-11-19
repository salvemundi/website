import React, { useState } from "react";
import ConfirmationModal from "./ConfirmationModal";
import AlertModal from "./AlertModal";
import { eventsApi } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { sendEventSignupEmail } from "../lib/email-service";

interface CartSidebarProps {
  cart: Array<{ 
    activity: { 
      id?: number;
      title: string; 
      name?: string;
      date?: string; 
      description: string; 
      price: number 
    }; 
    email: string;
    name: string;
    studentNumber: string;
  }>;
  onEmailChange: (index: number, email: string) => void;
  onNameChange?: (index: number, name: string) => void;
  onStudentNumberChange?: (index: number, studentNumber: string) => void;
  onRemoveTicket: (index: number) => void;
  onCheckoutComplete?: () => void;
  className?: string;
}

const CartSidebar: React.FC<CartSidebarProps> = ({ 
  cart, 
  onEmailChange, 
  onNameChange,
  onStudentNumberChange,
  onRemoveTicket, 
  onCheckoutComplete,
  className = ''
}) => {
  const { user } = useAuth();
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'error' | 'warning' | 'info' | 'success';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  // Helper to check for discount
  const hasDiscount = (email: string) => {
    return email.endsWith("@salvemundi.nl") || email.endsWith("@lid.salvemundi.nl");
  };

  // Calculate the total price and discount
  const calculateTotals = () => {
    let subtotal = 0;
    let discount = 0;

    cart.forEach(item => {
      const itemPrice = Number(item.activity.price) || 0;
      subtotal += itemPrice;

      if (hasDiscount(item.email)) {
        // You can set a specific discount amount or percentage here
        // For example, a 10% discount:
        discount += itemPrice * 0.10;
      }
    });

    const total = subtotal - discount;
    return { subtotal, discount, total };
  };

  const { subtotal, discount, total } = calculateTotals();

  const handleCheckout = () => {
    // Validate that all items have email addresses
    const hasEmptyEmails = cart.some(item => !item.email || item.email.trim() === '');
    if (hasEmptyEmails) {
      setErrorMessage('Vul voor alle activiteiten een e-mailadres in.');
      setTimeout(() => setErrorMessage(null), 5000);
      return;
    }

    // Open confirmation modal
    setIsConfirmationOpen(true);
  };

  const handleConfirmSignup = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      // Create signups for each cart item
      const signupPromises = cart.map(item => {
        const eventId = item.activity.id;
        if (!eventId) {
          throw new Error(`Event ID missing for ${item.activity.title || item.activity.name}`);
        }

        return eventsApi.createSignup({
          event_id: eventId,
          email: item.email,
          name: item.name || '',
          student_number: item.studentNumber || undefined,
          user_id: user?.id // Pass the logged-in user's ID
        });
      });

      const signups = await Promise.all(signupPromises);

      // Send email notifications for each signup with QR code
      const { generateQRCode } = await import('../lib/qr-service');
      
      // Process emails sequentially to avoid overwhelming the email service
      for (let index = 0; index < signups.length; index++) {
        const signup = signups[index];
        const item = cart[index];
        const eventName = item.activity.title || item.activity.name || 'Onbekende activiteit';
        const eventDate = item.activity.date || new Date().toISOString();
        const userName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : item.name;
        
        try {
          let qrCodeDataUrl: string | undefined;
          
          // Check if QR token exists and generate QR code
          if (signup.qr_token) {
            qrCodeDataUrl = await generateQRCode(signup.qr_token);
          } else {
            console.error('No QR token found for signup:', signup.id);
          }
          
          await sendEventSignupEmail({
            recipientEmail: item.email,
            recipientName: item.name || 'Deelnemer',
            eventName: eventName,
            eventDate: eventDate,
            eventPrice: item.activity.price || 0,
            studentNumber: item.studentNumber || undefined,
            userName: userName || 'Onbekend',
            qrCodeDataUrl: qrCodeDataUrl,
          });
        } catch (err) {
          console.error('Failed to send email notification:', err);
        }
      }

      // Success!
      setSuccessMessage(`Je bent succesvol ingeschreven voor ${cart.length} activiteit${cart.length > 1 ? 'en' : ''}!`);
      setIsConfirmationOpen(false);
      
      // Clear the cart after successful signup
      if (onCheckoutComplete) {
        onCheckoutComplete();
      }

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error: any) {
      console.error('Error creating signups:', error);
      
      // Check if it's a duplicate signup error
      if (error?.message && error.message.includes('al ingeschreven')) {
        setAlertModal({
          isOpen: true,
          title: 'Al ingeschreven',
          message: error.message,
          type: 'warning'
        });
      } else {
        setErrorMessage('Er is iets misgegaan bij het inschrijven. Probeer het opnieuw.');
      }
      
      setIsConfirmationOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <aside className={`w-full bg-beige lg:sticky lg:top-10 h-fit rounded-2xl shadow-xl p-4 sm:p-6 flex flex-col border-2 border-oranje min-h-[260px] lg:min-h-[400px] max-h-[70vh] lg:max-h-[80vh] overflow-y-auto ${className}`}>
        <h2 className="text-2xl font-bold text-oranje mb-4 text-left">Jouw Winkelwagen</h2>
        
        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded">
            <p className="font-semibold">{successMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
            <p className="font-semibold">{errorMessage}</p>
          </div>
        )}

        {cart.length === 0 ? (
          <p className="text-gray-600 text-center">Je winkelwagen is leeg.</p>
        ) : (
          <div className="space-y-6">
            {cart.map((item, idx) => (
              <div key={idx} className="border-b pb-4 mb-4 last-of-type:border-b-0 last-of-type:mb-0">
                <div className="flex justify-between text-left items-start mb-2">
                  <div className="flex-1 mr-2">
                    <p className="text-lg font-semibold text-paars">{item.activity.title || item.activity.name}</p>
                    {item.activity.date && <p className="text-sm text-gray-600">📅 {item.activity.date}</p>}
                    <p className="text-sm text-paars line-clamp-2">
                      {item.activity.description && item.activity.description.length > 80
                        ? `${item.activity.description.substring(0, 80)}...`
                        : item.activity.description}
                    </p>
                    <p className="text-sm text-oranje font-bold mt-1">Prijs: €{item.activity.price?.toFixed(2)}</p>
                  </div>
                  <button
                    className="text-oranje font-bold text-xl hover:text-red-600 transition-colors flex-shrink-0"
                    onClick={() => onRemoveTicket(idx)}
                    title="Verwijder ticket"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-paars font-semibold">Naam:</label>
                  <input
                    type="text"
                    value={item.name}
                    onChange={e => onNameChange && onNameChange(idx, e.target.value)}
                    className="border rounded px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-oranje"
                    placeholder="Vul naam in"
                  />
                  
                  <label className="text-sm text-paars font-semibold">E-mail:</label>
                  <input
                    type="email"
                    value={item.email}
                    onChange={e => onEmailChange(idx, e.target.value)}
                    className="border rounded px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-oranje"
                    placeholder="Vul e-mail in"
                    required
                  />
                  
                  <label className="text-sm text-paars font-semibold">Studentnummer (optioneel):</label>
                  <input
                    type="text"
                    value={item.studentNumber}
                    onChange={e => onStudentNumberChange && onStudentNumberChange(idx, e.target.value)}
                    className="border rounded px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-oranje"
                    placeholder="Vul studentnummer in"
                  />
                  
                  {item.email && hasDiscount(item.email) && (
                    <span className="text-green-600 text-sm font-bold mt-1">
                      Korting toegepast voor {item.email}!
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {cart.length > 0 && (
          <div className="mt-auto pt-6 border-t-2 border-dashed border-gray-300">
            <h3 className="text-xl font-bold text-paars mb-3">Overzicht</h3>
            <div className="flex justify-between text-md text-gray-700">
              <span>Subtotaal:</span>
              <span>€{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-md text-green-600 font-semibold">
              <span>Korting:</span>
              <span>-€{discount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-oranje mt-3">
              <span>Totaal:</span>
              <span>€{total.toFixed(2)}</span>
            </div>
          </div>
        )}

        <div className="mt-6">
          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0 || isLoading}
            className="w-full bg-oranje text-beige rounded-full px-4 py-3 font-semibold hover:bg-paars hover:text-geel transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Bezig...' : 'Tickets afrekenen'}
          </button>
        </div>
      </aside>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmationOpen}
        onClose={() => setIsConfirmationOpen(false)}
        onConfirm={handleConfirmSignup}
        activities={cart.map(item => ({
          title: item.activity.title || item.activity.name || 'Onbekende activiteit',
          email: item.email,
          price: item.activity.price
        }))}
        totalCost={total}
        isLoading={isLoading}
      />

      {/* Alert Modal for duplicate signups and other alerts */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />
    </>
  );
};

export default CartSidebar;
