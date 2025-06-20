import React from 'react';
import { getFoodMacros } from '../../utils/dataUtils';
import CartRow from './CartRow';

export default function CartTable({
  foodCart,
  clearCart,
  cartDate,
  setCartDate,
  cartHour12,
  setCartHour12,
  cartMinute,
  setCartMinute,
  cartAmPm,
  setCartAmPm,
  updateCartItem,
  removeFromCart,
  logCart,
}) {
  if (foodCart.length === 0) {
    return null; // Don't render anything if the cart is empty
  }

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-2">Food Cart</h3>
      <div className="bg-white border rounded-lg p-4 flex flex-col gap-4 shadow-lg">
        {/* Date and Time Inputs */}
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div>
            <label htmlFor="cart-date" className="block font-medium mb-1">Date:</label>
            <input
              id="cart-date"
              type="date"
              className="border rounded px-2 py-1"
              value={cartDate}
              onChange={e => setCartDate(e.target.value)}
            />
          </div>
          <div className="flex items-end gap-2">
            <div>
              <label className="block font-medium mb-1">Time:</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="1"
                  max="12"
                  className="border rounded px-2 py-1 w-16"
                  value={cartHour12}
                  onChange={e => setCartHour12(e.target.value)}
                />
                <span>:</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  step="5"
                  className="border rounded px-2 py-1 w-16"
                  value={cartMinute.toString().padStart(2, '0')}
                  onChange={e => setCartMinute(parseInt(e.target.value, 10))}
                />
                <select
                  className="border rounded px-2 py-1 bg-white"
                  value={cartAmPm}
                  onChange={e => setCartAmPm(e.target.value)}
                >
                  <option>AM</option>
                  <option>PM</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Cart Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-1 font-semibold">Food</th>
                <th className="text-left py-2 px-1 font-semibold">Qty</th>
                <th className="text-left py-2 px-1 font-semibold">Unit</th>
                <th className="text-right py-2 px-1 font-semibold">🔥</th>
                <th className="text-right py-2 px-1 font-semibold">🥑</th>
                <th className="text-right py-2 px-1 font-semibold">🍞</th>
                <th className="text-right py-2 px-1 font-semibold">🍗</th>
                <th className="text-right py-2 px-1 font-semibold">🌱</th>
                <th className="py-2 px-1"></th>
              </tr>
            </thead>
            <tbody>
              {foodCart.map((item, idx) => (
                <CartRow
                  key={item.label + idx}
                  item={item}
                  updateCartItem={updateCartItem}
                  removeFromCart={removeFromCart}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          <button
            className="bg-green-600 hover:bg-green-700 text-white rounded px-4 py-2"
            onClick={logCart}
          >
            Log Cart
          </button>
          <button
            className="bg-red-500 hover:bg-red-600 text-white rounded px-4 py-2"
            onClick={clearCart}
          >
            Clear Cart
          </button>
        </div>
      </div>
    </div>
  );
} 