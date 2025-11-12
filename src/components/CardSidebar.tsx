import React from "react";

interface CartSidebarProps {
  cart: Array<{ activity: { title: string; date?: string; description: string; price: number }; email: string }>;
  onEmailChange: (index: number, email: string) => void;
  onRemoveTicket: (index: number) => void;
}

const CartSidebar: React.FC<CartSidebarProps> = ({ cart, onEmailChange, onRemoveTicket }) => {
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

  return (
    <aside className="w-full bg-beige lg:sticky lg:top-10 h-fit rounded-2xl shadow-xl p-5 sm:p-6 flex flex-col border-2 border-oranje min-h-[320px] lg:min-h-[400px] max-h-[70vh] lg:max-h-[80vh] overflow-y-auto">
      <h2 className="text-2xl font-bold text-oranje mb-4 text-left">Jouw Winkelwagen</h2>
      {cart.length === 0 ? (
        <p className="text-gray-600 text-center">Je winkelwagen is leeg.</p>
      ) : (
        <div className="space-y-6">
          {cart.map((item, idx) => (
            <div key={idx} className="border-b pb-4 mb-4 last-of-type:border-b-0 last-of-type:mb-0">
              <div className="flex justify-between text-left items-left mb-2">
                <div>
                  <p className="text-lg font-semibold text-paars">{item.activity.title}</p>
                  {item.activity.date && <p className="text-sm text-gray-600">📅 {item.activity.date}</p>}
                  <p className="text-sm text-paars">{item.activity.description}</p>
                  <p className="text-sm text-oranje font-bold mt-1">Prijs: €{item.activity.price?.toFixed(2)}</p>
                </div>
                <button
                  className="text-oranje font-bold text-xl ml-2 hover:text-red-600 transition-colors"
                  onClick={() => onRemoveTicket(idx)}
                  title="Verwijder ticket"
                >
                  ✕
                </button>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-paars font-semibold">E-mail voor deze ticket:</label>
                <input
                  type="email"
                  value={item.email}
                  onChange={e => onEmailChange(idx, e.target.value)}
                  className="border rounded px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-oranje"
                  placeholder="Vul e-mail in"
                  required
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
        <button className="w-full bg-oranje text-beige rounded-full px-4 py-3 font-semibold hover:bg-paars hover:text-geel transition disabled:opacity-50 disabled:cursor-not-allowed">
          Tickets afrekenen
        </button>
      </div>
    </aside>
  );
};

export default CartSidebar;