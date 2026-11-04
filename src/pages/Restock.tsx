import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { db } from '../utils/database';
import { RefreshCw, Search, CheckCircle, AlertCircle, Package } from 'lucide-react';

export default function Restock() {
  const { currentUser, settings, refreshData } = useApp();
  const location = useLocation();
  const preselectedId = (location.state as any)?.productId;

  const [scanInput, setScanInput] = useState('');
  const [product, setProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState('');
  const [purchaseCost, setPurchaseCost] = useState('');
  const [supplier, setSupplier] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const scanRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (preselectedId) {
      const p = db.getProductById(preselectedId);
      if (p) {
        setProduct(p);
        setPurchaseCost(String(p.purchase_price));
      }
    }
    scanRef.current?.focus();
  }, [preselectedId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setProduct(null);

    if (!scanInput.trim()) return;

    const serial = scanInput.trim();
    const found = db.getProductBySerial(serial);

    if (!found || found.archived) {
      setError('Product not found. Please check the barcode or serial number.');
      return;
    }

    setProduct(found);
    setPurchaseCost(String(found.purchase_price));
  };

  const handleRestock = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!product) return;
    const qty = parseInt(quantity);
    if (!qty || qty <= 0) {
      setError('Please enter a valid quantity greater than zero.');
      return;
    }

    db.addRestock({
      product_id: product.id,
      product_name: product.product_name,
      serial_number: product.serial_number,
      quantity_added: qty,
      purchase_cost: parseFloat(purchaseCost) * qty || 0,
      supplier: supplier,
      user_id: currentUser!.id,
    });

    setSuccess(`Successfully restocked "${product.product_name}" with ${qty} units!`);
    setProduct(null);
    setQuantity('');
    setPurchaseCost('');
    setSupplier('');
    setScanInput('');
    refreshData();

    setTimeout(() => setSuccess(''), 5000);
    scanRef.current?.focus();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Success */}
      {success && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border-2 border-green-300 rounded-xl text-green-800">
          <CheckCircle size={24} className="text-green-600" />
          <p className="font-bold text-lg">{success}</p>
        </div>
      )}

      {/* Scanner */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-3 mb-4">
          <RefreshCw size={24} className="text-yellow-600" />
          <h3 className="text-lg font-bold text-gray-800">Find Product to Restock</h3>
        </div>
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              ref={scanRef}
              type="text"
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              className="w-full pl-10 pr-4 py-4 border-2 border-gray-300 rounded-xl text-xl font-mono focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
              placeholder="Scan barcode or enter serial number..."
              autoFocus
            />
          </div>
          <button type="submit" className="px-6 py-4 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-400 text-lg">
            Find
          </button>
        </form>
        {error && (
          <div className="flex items-center gap-2 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Product Found */}
      {product && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-4 mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="w-14 h-14 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Package size={28} className="text-yellow-700" />
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-bold text-gray-800">{product.product_name}</h4>
              <p className="text-sm text-gray-600">Serial: {product.serial_number} | {product.colour} | Size: {product.size}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Current Stock</p>
              <p className={`text-2xl font-bold ${product.current_quantity === 0 ? 'text-red-600' : product.current_quantity <= settings.low_stock_threshold ? 'text-orange-600' : 'text-green-600'}`}>
                {product.current_quantity}
              </p>
            </div>
          </div>

          <form onSubmit={handleRestock} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Quantity Received *</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-xl font-bold focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
                  placeholder="e.g. 20"
                  min="1"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Unit Purchase Cost ({settings.currency})</label>
                <input
                  type="number"
                  value={purchaseCost}
                  onChange={(e) => setPurchaseCost(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
                  placeholder="e.g. 150"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Supplier</label>
                <input
                  type="text"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
                  placeholder="e.g. Supplier A"
                />
              </div>
            </div>

            {quantity && parseInt(quantity) > 0 && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-lg font-bold text-green-800">
                  New Available Stock: <span className="text-2xl">{product.current_quantity + parseInt(quantity)}</span> units
                </p>
                {purchaseCost && (
                  <p className="text-sm text-green-700 mt-1">
                    Total Purchase Cost: {settings.currency}{(parseFloat(purchaseCost) * parseInt(quantity)).toLocaleString()}
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-xl hover:from-green-400 hover:to-green-500 text-xl shadow-lg"
            >
              ✓ Confirm Restock
            </button>
          </form>
        </div>
      )}

      {/* Quick restock list */}
      {!product && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-lg font-bold text-gray-800 mb-4">⚡ Quick Restock - Low Stock Items</h3>
          <div className="space-y-2">
            {db.getProducts()
              .filter(p => !p.archived && p.current_quantity <= settings.low_stock_threshold)
              .sort((a, b) => a.current_quantity - b.current_quantity)
              .map(p => (
                <button
                  key={p.id}
                  onClick={() => { setProduct(p); setPurchaseCost(String(p.purchase_price)); setScanInput(p.serial_number); }}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg text-left border border-gray-100"
                >
                  <div className={`px-2 py-1 rounded text-xs font-bold ${
                    p.current_quantity === 0 ? 'bg-gray-100 text-gray-600' :
                    p.current_quantity <= settings.critical_stock_threshold ? 'bg-red-100 text-red-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {p.current_quantity}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{p.product_name}</p>
                    <p className="text-xs text-gray-500">{p.colour} • {p.size} • {p.serial_number}</p>
                  </div>
                  <RefreshCw size={16} className="text-yellow-600" />
                </button>
              ))
            }
            {db.getProducts().filter(p => !p.archived && p.current_quantity <= settings.low_stock_threshold).length === 0 && (
              <p className="text-center text-gray-400 py-6">All products are well stocked!</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
