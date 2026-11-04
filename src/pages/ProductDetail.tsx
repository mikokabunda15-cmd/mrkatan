import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { generateBarcodeForProduct } from '../utils/barcode';
import { ArrowLeft, Edit, RefreshCw, Printer, Package, Calendar, DollarSign, TrendingUp, Archive } from 'lucide-react';
import { db } from '../utils/database';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { products, sales, movements, settings, refreshData } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const product = products.find(p => p.id === id);

  const productSales = useMemo(() => {
    if (!product) return [];
    return sales
      .filter(s => s.status === 'completed' && s.items.some(i => i.product_id === product.id))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [sales, product]);

  const productMovements = useMemo(() => {
    if (!product) return [];
    return movements
      .filter(m => m.product_id === product.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [movements, product]);

  const totalRevenue = useMemo(() => {
    return productSales.reduce((sum, sale) => {
      const item = sale.items.find(i => i.product_id === product?.id);
      return sum + (item?.subtotal || 0);
    }, 0);
  }, [productSales, product]);

  const handlePrintBarcode = () => {
    if (!product) return;
    const barcodeImg = generateBarcodeForProduct(product.serial_number);
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`
        <html><head><title>Barcode - ${product.product_name}</title>
        <style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif}
        h2{margin-bottom:8px}p{color:#666;margin:4px 0}img{margin:16px 0;border:1px solid #ddd;padding:8px;border-radius:8px}</style></head>
        <body><h2>${product.product_name}</h2><p>Serial: ${product.serial_number}</p><p>Size: ${product.size} | Colour: ${product.colour}</p>
        <p>Price: ${settings.currency}${product.selling_price}</p>
        <img src="${barcodeImg}" /><p style="font-size:12px">${settings.store_name}</p>
        <script>window.onload=()=>window.print()</script></body></html>
      `);
    }
  };

  const handleArchive = () => {
    if (!product) return;
    if (confirm(`Are you sure you want to archive "${product.product_name}"?`)) {
      db.archiveProduct(product.id);
      refreshData();
      navigate('/inventory');
    }
  };

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Product not found.</p>
        <Link to="/inventory" className="text-yellow-600 hover:text-yellow-700 font-medium mt-2 inline-block">← Back to Inventory</Link>
      </div>
    );
  }

  const stockStatus = product.current_quantity === 0 ? { label: 'Out of Stock', color: 'bg-gray-100 text-gray-600' }
    : product.current_quantity <= settings.critical_stock_threshold ? { label: 'Critical', color: 'bg-red-100 text-red-700' }
    : product.current_quantity <= settings.low_stock_threshold ? { label: 'Low Stock', color: 'bg-orange-100 text-orange-700' }
    : { label: 'In Stock', color: 'bg-green-100 text-green-700' };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link to="/inventory" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 font-medium">
        <ArrowLeft size={18} /> Back to Inventory
      </Link>

      {/* Product Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Image */}
          <div className="w-full md:w-48 h-48 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
            {product.product_image ? (
              <img src={product.product_image} alt={product.product_name} className="w-full h-full object-cover rounded-xl" />
            ) : (
              <Package size={48} className="text-gray-300" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{product.product_name}</h1>
                <p className="text-gray-500 font-mono mt-1">Serial: {product.serial_number}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${stockStatus.color}`}>{stockStatus.label}</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div>
                <p className="text-xs text-gray-500">Category</p>
                <p className="font-medium text-gray-800">{product.category}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Colour</p>
                <p className="font-medium text-gray-800">{product.colour}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Size</p>
                <p className="font-medium text-gray-800">{product.size}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Selling Price</p>
                <p className="font-bold text-green-600 text-lg">{settings.currency}{product.selling_price}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 mt-4">
              <Link to={`/add-product?edit=${product.id}`} className="flex items-center gap-1 px-3 py-2 bg-yellow-500 text-black font-bold rounded-lg text-sm hover:bg-yellow-400">
                <Edit size={16} /> Edit
              </Link>
              <Link to="/restock" state={{ productId: product.id }} className="flex items-center gap-1 px-3 py-2 bg-green-500 text-white font-bold rounded-lg text-sm hover:bg-green-400">
                <RefreshCw size={16} /> Restock
              </Link>
              <button onClick={handlePrintBarcode} className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                <Printer size={16} /> Print Barcode
              </button>
              <button onClick={handleArchive} className="flex items-center gap-1 px-3 py-2 border border-red-300 rounded-lg text-sm text-red-600 hover:bg-red-50">
                <Archive size={16} /> Archive
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <Package size={20} className="mx-auto text-blue-500 mb-1" />
          <p className="text-xs text-gray-500">Original Qty</p>
          <p className="text-xl font-bold text-gray-800">{product.original_quantity}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <TrendingUp size={20} className="mx-auto text-green-500 mb-1" />
          <p className="text-xs text-gray-500">Available</p>
          <p className="text-xl font-bold text-gray-800">{product.current_quantity}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <TrendingUp size={20} className="mx-auto text-purple-500 mb-1" />
          <p className="text-xs text-gray-500">Total Sold</p>
          <p className="text-xl font-bold text-gray-800">{product.total_sold}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <DollarSign size={20} className="mx-auto text-yellow-500 mb-1" />
          <p className="text-xs text-gray-500">Sales Revenue</p>
          <p className="text-xl font-bold text-green-600">{settings.currency}{totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <DollarSign size={20} className="mx-auto text-blue-500 mb-1" />
          <p className="text-xs text-gray-500">Stock Value</p>
          <p className="text-xl font-bold text-blue-600">{settings.currency}{(product.current_quantity * product.purchase_price).toLocaleString()}</p>
        </div>
      </div>

      {/* Barcode */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-lg font-bold text-gray-800 mb-3">📊 Barcode</h3>
        <div className="bg-gray-50 p-4 rounded-lg inline-block">
          <img src={generateBarcodeForProduct(product.serial_number)} alt="Product Barcode" className="max-w-xs" />
        </div>
        <p className="text-xs text-gray-500 mt-2">Encoded: {product.serial_number}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 font-medium text-sm border-b-2 transition-all ${activeTab === 'overview' ? 'border-yellow-500 text-yellow-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          Overview
        </button>
        <button onClick={() => setActiveTab('sales')} className={`px-4 py-2 font-medium text-sm border-b-2 transition-all ${activeTab === 'sales' ? 'border-yellow-500 text-yellow-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          Sales History ({productSales.length})
        </button>
        <button onClick={() => setActiveTab('movement')} className={`px-4 py-2 font-medium text-sm border-b-2 transition-all ${activeTab === 'movement' ? 'border-yellow-500 text-yellow-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          Stock Movement ({productMovements.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Purchase Price</p>
                <p className="text-lg font-bold text-gray-800">{settings.currency}{product.purchase_price}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Selling Price</p>
                <p className="text-lg font-bold text-green-600">{settings.currency}{product.selling_price}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Profit per Unit</p>
                <p className="text-lg font-bold text-emerald-600">{settings.currency}{product.selling_price - product.purchase_price}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Minimum Stock Level</p>
                <p className="text-lg font-bold text-gray-800">{product.minimum_stock_level}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg flex items-center gap-3">
                <Calendar size={20} className="text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Date Added</p>
                  <p className="font-medium text-gray-800">{new Date(product.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg flex items-center gap-3">
                <Calendar size={20} className="text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Last Updated</p>
                  <p className="font-medium text-gray-800">{new Date(product.updated_at).toLocaleDateString()}</p>
                </div>
              </div>
              {product.last_restocked_at && (
                <div className="p-4 bg-gray-50 rounded-lg flex items-center gap-3">
                  <RefreshCw size={20} className="text-green-500" />
                  <div>
                    <p className="text-sm text-gray-500">Last Restocked</p>
                    <p className="font-medium text-gray-800">{new Date(product.last_restocked_at).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'sales' && (
          <div className="space-y-2">
            {productSales.length === 0 ? (
              <p className="text-center text-gray-400 py-8">No sales recorded for this product.</p>
            ) : (
              productSales.map(sale => {
                const item = sale.items.find(i => i.product_id === product.id)!;
                return (
                  <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800">{sale.transaction_reference}</p>
                      <p className="text-xs text-gray-500">{new Date(sale.created_at).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-800">{item.quantity} units</p>
                      <p className="text-sm text-green-600">{settings.currency}{item.subtotal}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'movement' && (
          <div className="space-y-2">
            {productMovements.length === 0 ? (
              <p className="text-center text-gray-400 py-8">No stock movements recorded.</p>
            ) : (
              productMovements.map(m => (
                <div key={m.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    m.movement_type === 'sale' ? 'bg-red-100 text-red-700' :
                    m.movement_type === 'restock' ? 'bg-green-100 text-green-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>{m.movement_type}</span>
                  <span className={`font-bold ${m.quantity_changed > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {m.quantity_changed > 0 ? '+' : ''}{m.quantity_changed}
                  </span>
                  <span className="text-sm text-gray-500">({m.previous_quantity} → {m.new_quantity})</span>
                  <span className="text-xs text-gray-400 ml-auto">{new Date(m.created_at).toLocaleDateString()}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
