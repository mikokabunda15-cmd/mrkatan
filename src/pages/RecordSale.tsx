import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { db } from '../utils/database';
import { v4 as uuidv4 } from 'uuid';
import { ScanLine, Search, Plus, Trash2, CheckCircle, AlertCircle, ShoppingCart } from 'lucide-react';

interface CartItem {
  product_id: string;
  product_name: string;
  serial_number: string;
  colour: string;
  size: string;
  available_stock: number;
  unit_price: number;
  quantity: number;
  image: string;
}

export default function RecordSale() {
  const { currentUser, settings, refreshData } = useApp();
  const [scanInput, setScanInput] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lastSale, setLastSale] = useState<any>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const scanRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scanRef.current?.focus();
  }, []);

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!scanInput.trim()) return;

    const serial = scanInput.trim().replace(/\D/g, '');
    const product = db.getProductBySerial(serial);

    if (!product || product.archived) {
      setError('Product not found. Please check the barcode or serial number.');
      setScanInput('');
      return;
    }

    if (product.current_quantity <= 0) {
      setError(`"${product.product_name}" is out of stock.`);
      setScanInput('');
      return;
    }

    // Check if already in cart
    const existing = cart.find(c => c.product_id === product.id);
    if (existing) {
      if (existing.quantity >= product.current_quantity) {
        setError(`Only ${product.current_quantity} units available for "${product.product_name}".`);
        setScanInput('');
        return;
      }
      setCart(cart.map(c => c.product_id === product.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, {
        product_id: product.id,
        product_name: product.product_name,
        serial_number: product.serial_number,
        colour: product.colour,
        size: product.size,
        available_stock: product.current_quantity,
        unit_price: product.selling_price,
        quantity: 1,
        image: product.product_image,
      }]);
    }

    setScanInput('');
    scanRef.current?.focus();
  };

  const updateQuantity = (productId: string, qty: number) => {
    const item = cart.find(c => c.product_id === productId);
    if (!item) return;
    if (qty <= 0) {
      setCart(cart.filter(c => c.product_id !== productId));
      return;
    }
    if (qty > item.available_stock) {
      setError(`Only ${item.available_stock} units available.`);
      return;
    }
    setCart(cart.map(c => c.product_id === productId ? { ...c, quantity: qty } : c));
  };

  const removeItem = (productId: string) => {
    setCart(cart.filter(c => c.product_id !== productId));
  };

  const total = cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);

  const confirmSale = () => {
    if (cart.length === 0) return;

    // Validate all quantities
    for (const item of cart) {
      const product = db.getProductById(item.product_id);
      if (!product || product.current_quantity < item.quantity) {
        setError(`Insufficient stock for "${item.product_name}". Available: ${product?.current_quantity || 0}`);
        setShowConfirm(false);
        return;
      }
    }

    const txnRef = `TXN-${Date.now().toString(36).toUpperCase()}`;

    // Create sale
    const sale = db.addSale({
      transaction_reference: txnRef,
      total_amount: total,
      user_id: currentUser!.id,
      status: 'completed',
      items: cart.map(item => ({
        id: uuidv4(),
        sale_id: '',
        product_id: item.product_id,
        product_name: item.product_name,
        serial_number: item.serial_number,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.unit_price * item.quantity,
      })),
    });

    // Update products and create stock movements
    const products = db.getProducts();
    const movements = db.getStockMovements();

    for (const item of cart) {
      const pIdx = products.findIndex(p => p.id === item.product_id);
      if (pIdx !== -1) {
        const prevQty = products[pIdx].current_quantity;
        products[pIdx].current_quantity -= item.quantity;
        products[pIdx].total_sold += item.quantity;
        products[pIdx].updated_at = new Date().toISOString();

        movements.push({
          id: uuidv4(),
          product_id: item.product_id,
          product_name: item.product_name,
          serial_number: item.serial_number,
          movement_type: 'sale',
          quantity_changed: -item.quantity,
          previous_quantity: prevQty,
          new_quantity: products[pIdx].current_quantity,
          reference_id: sale.id,
          user_id: currentUser!.id,
          notes: `Sale: ${item.quantity} units @ ${settings.currency}${item.unit_price} each`,
          created_at: new Date().toISOString(),
        });
      }
    }

    localStorage.setItem('mks_products', JSON.stringify(products));
    localStorage.setItem('mks_stock_movements', JSON.stringify(movements));

    setLastSale({ reference: txnRef, items: cart, total });
    setSuccess('SALE RECORDED SUCCESSFULLY!');
    setCart([]);
    setShowConfirm(false);
    refreshData();

    setTimeout(() => {
      setSuccess('');
      setLastSale(null);
    }, 8000);

    scanRef.current?.focus();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Success message */}
      {success && lastSale && (
        <div className="bg-green-50 border-2 border-green-300 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle size={28} className="text-green-600" />
            <h3 className="text-xl font-bold text-green-800">{success}</h3>
          </div>
          <div className="bg-white rounded-lg p-4 border border-green-200">
            <p className="text-sm text-gray-600">Transaction Reference: <span className="font-bold text-gray-800">{lastSale.reference}</span></p>
            <div className="mt-2 space-y-1">
              {lastSale.items.map((item: CartItem, i: number) => (
                <p key={i} className="text-sm">
                  {item.product_name} × {item.quantity} = <span className="font-bold">{settings.currency}{item.unit_price * item.quantity}</span>
                  <span className="text-gray-500 ml-2">({item.available_stock - item.quantity} remaining)</span>
                </p>
              ))}
            </div>
            <p className="mt-3 text-lg font-bold text-green-700">Total: {settings.currency}{lastSale.total}</p>
          </div>
          <p className="text-sm text-green-600 mt-3">Scan the next item to begin a new transaction.</p>
        </div>
      )}

      {/* Scanner */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-3 mb-4">
          <ScanLine size={24} className="text-yellow-600" />
          <h3 className="text-lg font-bold text-gray-800">Scan Barcode or Enter Serial Number</h3>
        </div>
        <form onSubmit={handleScan} className="flex gap-3">
          <div className="relative flex-1">
            <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              ref={scanRef}
              type="text"
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              className="w-full pl-10 pr-4 py-4 border-2 border-gray-300 rounded-xl text-xl font-mono focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
              placeholder="Scan barcode or type serial number..."
              autoFocus
            />
          </div>
          <button type="submit" className="px-6 py-4 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-400 text-lg">
            <Search size={20} className="inline mr-2" />
            Find
          </button>
        </form>
        {error && (
          <div className="flex items-center gap-2 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}
        <p className="text-sm text-gray-500 mt-2">💡 Tip: Simply scan the barcode with a USB scanner. The serial number will be read automatically.</p>
      </div>

      {/* Cart */}
      {cart.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-4">
            <ShoppingCart size={24} className="text-yellow-600" />
            <h3 className="text-lg font-bold text-gray-800">Current Transaction ({cart.length} item{cart.length > 1 ? 's' : ''})</h3>
          </div>

          <div className="space-y-3">
            {cart.map(item => (
              <div key={item.product_id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
                  <ShoppingCart size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800">{item.product_name}</p>
                  <p className="text-sm text-gray-500">{item.colour} • {item.size} • {item.serial_number}</p>
                  <p className="text-sm text-gray-500">Available: {item.available_stock} | Price: {settings.currency}{item.unit_price}</p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Qty:</label>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.product_id, parseInt(e.target.value) || 0)}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center font-bold text-lg"
                    min="1"
                    max={item.available_stock}
                  />
                </div>
                <div className="text-right min-w-[80px]">
                  <p className="font-bold text-lg text-gray-800">{settings.currency}{item.unit_price * item.quantity}</p>
                </div>
                <button onClick={() => removeItem(item.product_id)} className="p-2 hover:bg-red-50 rounded-lg text-red-500">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Items: {cart.reduce((s, i) => s + i.quantity, 0)}</p>
              <p className="text-2xl font-bold text-gray-800">Total: {settings.currency}{total.toLocaleString()}</p>
            </div>
            <button
              onClick={() => setShowConfirm(true)}
              className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-xl hover:from-green-400 hover:to-green-500 text-lg shadow-lg"
            >
              ✓ Confirm Sale
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Confirm Sale</h3>
            <p className="text-gray-600 mb-4">Are you sure you want to complete this sale?</p>
            <div className="space-y-2 mb-4">
              {cart.map(item => (
                <div key={item.product_id} className="flex justify-between text-sm">
                  <span>{item.product_name} × {item.quantity}</span>
                  <span className="font-bold">{settings.currency}{item.unit_price * item.quantity}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-3 mb-4">
              <p className="text-xl font-bold text-right">Total: {settings.currency}{total.toLocaleString()}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={confirmSale} className="flex-1 py-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-400 text-lg">
                ✓ Yes, Complete Sale
              </button>
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 text-lg">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {cart.length === 0 && !success && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <ShoppingCart size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">No items in the current transaction.</p>
          <p className="text-gray-400 mt-1">Scan a barcode or enter a serial number above to begin.</p>
        </div>
      )}
    </div>
  );
}
