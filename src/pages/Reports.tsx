import React, { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Download, Calendar } from 'lucide-react';

export default function Reports() {
  const { products, sales, restocks, settings } = useApp();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [reportType, setReportType] = useState('inventory');

  const activeProducts = products.filter(p => !p.archived);

  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      if (s.status !== 'completed') return false;
      if (dateFrom || dateTo) {
        const d = new Date(s.created_at);
        if (dateFrom && d < new Date(dateFrom)) return false;
        if (dateTo) {
          const to = new Date(dateTo);
          to.setHours(23, 59, 59);
          if (d > to) return false;
        }
      }
      return true;
    });
  }, [sales, dateFrom, dateTo]);

  // Inventory Report Data
  const inventoryData = useMemo(() => {
    const totalProducts = activeProducts.length;
    const totalStock = activeProducts.reduce((s, p) => s + p.current_quantity, 0);
    const totalValue = activeProducts.reduce((s, p) => s + (p.current_quantity * p.purchase_price), 0);
    const lowStock = activeProducts.filter(p => p.current_quantity > 0 && p.current_quantity <= settings.low_stock_threshold);
    const outOfStock = activeProducts.filter(p => p.current_quantity === 0);

    return { totalProducts, totalStock, totalValue, lowStock, outOfStock };
  }, [activeProducts, settings]);

  // Sales by Category
  const salesByCategory = useMemo(() => {
    const map: Record<string, { units: number; revenue: number }> = {};
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        const product = activeProducts.find(p => p.id === item.product_id);
        const cat = product?.category || 'Other';
        if (!map[cat]) map[cat] = { units: 0, revenue: 0 };
        map[cat].units += item.quantity;
        map[cat].revenue += item.subtotal;
      });
    });
    return Object.entries(map).map(([name, data]) => ({ name, ...data }));
  }, [filteredSales, activeProducts]);

  // Best and worst sellers
  const productPerformance = useMemo(() => {
    const map: Record<string, { name: string; units: number; revenue: number }> = {};
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        if (!map[item.product_id]) map[item.product_id] = { name: item.product_name, units: 0, revenue: 0 };
        map[item.product_id].units += item.quantity;
        map[item.product_id].revenue += item.subtotal;
      });
    });
    const arr = Object.values(map);
    return {
      best: [...arr].sort((a, b) => b.units - a.units).slice(0, 5),
      worst: [...arr].sort((a, b) => a.units - b.units).slice(0, 5),
    };
  }, [filteredSales]);

  // Daily sales trend
  const dailySales = useMemo(() => {
    const map: Record<string, number> = {};
    filteredSales.forEach(sale => {
      const day = new Date(sale.created_at).toLocaleDateString();
      map[day] = (map[day] || 0) + sale.total_amount;
    });
    return Object.entries(map)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([date, amount]) => ({ date, amount }));
  }, [filteredSales]);

  // Restock data
  const restockSummary = useMemo(() => {
    const totalRestocked = restocks.reduce((s, r) => s + r.quantity_added, 0);
    const totalCost = restocks.reduce((s, r) => s + r.purchase_cost, 0);
    return { count: restocks.length, totalRestocked, totalCost };
  }, [restocks]);

  // Revenue summary
  const revenueSummary = useMemo(() => {
    const totalRevenue = filteredSales.reduce((s, sale) => s + sale.total_amount, 0);
    let totalCostOfGoods = 0;
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        const product = activeProducts.find(p => p.id === item.product_id);
        if (product) totalCostOfGoods += product.purchase_price * item.quantity;
      });
    });
    const grossProfit = totalRevenue - totalCostOfGoods;
    return { totalRevenue, totalCostOfGoods, grossProfit };
  }, [filteredSales, activeProducts]);

  const COLORS = ['#D4A017', '#1D4ED8', '#059669', '#DC2626', '#7C3AED', '#EA580C'];

  const exportCSV = (type: string) => {
    let headers: string[] = [];
    let rows: string[][] = [];

    if (type === 'inventory') {
      headers = ['Product', 'Serial', 'Category', 'Colour', 'Size', 'Current Stock', 'Original Qty', 'Total Sold', 'Purchase Price', 'Selling Price', 'Stock Value'];
      rows = activeProducts.map(p => [
        p.product_name, p.serial_number, p.category, p.colour, p.size,
        String(p.current_quantity), String(p.original_quantity), String(p.total_sold),
        `${settings.currency}${p.purchase_price}`, `${settings.currency}${p.selling_price}`,
        `${settings.currency}${p.current_quantity * p.purchase_price}`,
      ]);
    } else if (type === 'sales') {
      headers = ['Date', 'Reference', 'Product', 'Quantity', 'Unit Price', 'Subtotal', 'Total'];
      filteredSales.forEach(sale => {
        sale.items.forEach(item => {
          rows.push([
            new Date(sale.created_at).toLocaleString(), sale.transaction_reference,
            item.product_name, String(item.quantity), `${settings.currency}${item.unit_price}`,
            `${settings.currency}${item.subtotal}`, `${settings.currency}${sale.total_amount}`,
          ]);
        });
      });
    } else {
      headers = ['Date', 'Product', 'Serial', 'Quantity', 'Purchase Cost', 'Supplier'];
      rows = restocks.map(r => [
        new Date(r.created_at).toLocaleString(), r.product_name, r.serial_number,
        String(r.quantity_added), `${settings.currency}${r.purchase_cost}`, r.supplier,
      ]);
    }

    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-600">Date Range:</span>
          </div>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          <span className="text-gray-400">to</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="text-sm text-yellow-600 hover:text-yellow-700 font-medium">Clear</button>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: 'inventory', label: '📦 Inventory' },
          { value: 'sales', label: '💰 Sales' },
          { value: 'restocking', label: '🔄 Restocking' },
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => setReportType(tab.value)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              reportType === tab.value ? 'bg-yellow-500 text-black shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:border-yellow-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* INVENTORY REPORT */}
      {reportType === 'inventory' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-sm text-gray-500">Total Products</p>
              <p className="text-2xl font-bold text-gray-800">{inventoryData.totalProducts}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-sm text-gray-500">Total Units in Stock</p>
              <p className="text-2xl font-bold text-blue-600">{inventoryData.totalStock}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-sm text-gray-500">Inventory Value (Cost)</p>
              <p className="text-2xl font-bold text-green-600">{settings.currency}{inventoryData.totalValue.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-sm text-gray-500">Low/Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">{inventoryData.lowStock.length + inventoryData.outOfStock.length}</p>
            </div>
          </div>

          {/* Stock level chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Stock Levels by Product</h3>
              <button onClick={() => exportCSV('inventory')} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-1">
                <Download size={14} /> CSV
              </button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={activeProducts.slice(0, 10).map(p => ({ name: p.product_name.substring(0, 15), stock: p.current_quantity, sold: p.total_sold }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="stock" fill="#D4A017" name="In Stock" />
                <Bar dataKey="sold" fill="#6B7280" name="Total Sold" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Low stock products */}
          {inventoryData.lowStock.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-lg font-bold text-gray-800 mb-3">⚠️ Products Needing Restock</h3>
              <div className="space-y-2">
                {inventoryData.lowStock.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
                    <span className="font-medium text-gray-800">{p.product_name}</span>
                    <span className="text-orange-700 font-bold">{p.current_quantity} units</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SALES REPORT */}
      {reportType === 'sales' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">{settings.currency}{revenueSummary.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-sm text-gray-500">Cost of Goods Sold</p>
              <p className="text-2xl font-bold text-red-600">{settings.currency}{revenueSummary.totalCostOfGoods.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-sm text-gray-500">Gross Profit (Est.)</p>
              <p className="text-2xl font-bold text-emerald-600">{settings.currency}{revenueSummary.grossProfit.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-sm text-gray-500">Transactions</p>
              <p className="text-2xl font-bold text-blue-600">{filteredSales.length}</p>
            </div>
          </div>

          {/* Revenue vs Cost note */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Revenue is the total sales income. Gross profit is estimated as Revenue minus Cost of Goods Sold. 
              Actual profit may differ after accounting for operating expenses, taxes, and other costs.
            </p>
          </div>

          {/* Daily Sales Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Daily Sales Trend</h3>
              <button onClick={() => exportCSV('sales')} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-1">
                <Download size={14} /> CSV
              </button>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dailySales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip formatter={(value: number) => [`${settings.currency}${value}`, 'Revenue']} />
                <Line type="monotone" dataKey="amount" stroke="#D4A017" strokeWidth={2} dot={{ fill: '#D4A017' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Sales by Category */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Sales by Category</h3>
              {salesByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={salesByCategory} dataKey="revenue" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {salesByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`${settings.currency}${value}`, 'Revenue']} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-gray-400 text-center py-8">No sales data for this period</p>}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-lg font-bold text-gray-800 mb-4">🏆 Best Sellers</h3>
              {productPerformance.best.length > 0 ? (
                <div className="space-y-2">
                  {productPerformance.best.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center text-xs font-bold text-yellow-700">{i + 1}</span>
                        <span className="text-sm font-medium text-gray-800">{p.name}</span>
                      </div>
                      <span className="text-sm font-bold text-green-600">{p.units} sold</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-gray-400 text-center py-8">No sales data</p>}
            </div>
          </div>
        </div>
      )}

      {/* RESTOCKING REPORT */}
      {reportType === 'restocking' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-sm text-gray-500">Restock Transactions</p>
              <p className="text-2xl font-bold text-gray-800">{restockSummary.count}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-sm text-gray-500">Total Units Restocked</p>
              <p className="text-2xl font-bold text-green-600">{restockSummary.totalRestocked}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-sm text-gray-500">Total Restocking Cost</p>
              <p className="text-2xl font-bold text-blue-600">{settings.currency}{restockSummary.totalCost.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Restocking History</h3>
              <button onClick={() => exportCSV('restocking')} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-1">
                <Download size={14} /> CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-2 font-semibold text-gray-600">Date</th>
                    <th className="text-left px-4 py-2 font-semibold text-gray-600">Product</th>
                    <th className="text-center px-4 py-2 font-semibold text-gray-600">Qty</th>
                    <th className="text-right px-4 py-2 font-semibold text-gray-600">Cost</th>
                    <th className="text-left px-4 py-2 font-semibold text-gray-600">Supplier</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {restocks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(r => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-600">{new Date(r.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-2 font-medium text-gray-800">{r.product_name}</td>
                      <td className="px-4 py-2 text-center font-bold text-green-600">+{r.quantity_added}</td>
                      <td className="px-4 py-2 text-right">{settings.currency}{r.purchase_cost.toLocaleString()}</td>
                      <td className="px-4 py-2 text-gray-600">{r.supplier || '-'}</td>
                    </tr>
                  ))}
                  {restocks.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No restocking records.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
