import React, { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { Link } from 'react-router-dom';
import { Package, DollarSign, TrendingUp, AlertTriangle, XCircle, ShoppingBag, RefreshCw, ArrowUpRight } from 'lucide-react';

export default function Dashboard() {
  const { products, sales, restocks, settings } = useApp();
  const [timeFilter, setTimeFilter] = useState('all');

  const activeProducts = products.filter(p => !p.archived);

  const stats = useMemo(() => {
    const totalProducts = activeProducts.length;
    const totalStock = activeProducts.reduce((sum, p) => sum + p.current_quantity, 0);
    const totalSold = activeProducts.reduce((sum, p) => sum + p.total_sold, 0);
    const totalValue = activeProducts.reduce((sum, p) => sum + (p.current_quantity * p.purchase_price), 0);
    const lowStock = activeProducts.filter(p => p.current_quantity > 0 && p.current_quantity <= settings.low_stock_threshold).length;
    const criticalStock = activeProducts.filter(p => p.current_quantity > 0 && p.current_quantity <= settings.critical_stock_threshold).length;
    const outOfStock = activeProducts.filter(p => p.current_quantity === 0).length;

    const now = new Date();
    const filteredSales = sales.filter(s => {
      if (s.status !== 'completed') return false;
      const d = new Date(s.created_at);
      if (timeFilter === 'today') return d.toDateString() === now.toDateString();
      if (timeFilter === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return d >= weekAgo;
      }
      if (timeFilter === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      if (timeFilter === 'year') return d.getFullYear() === now.getFullYear();
      return true;
    });

    const totalSalesAmount = filteredSales.reduce((sum, s) => sum + s.total_amount, 0);
    const totalRestocks = restocks.length;

    return { totalProducts, totalStock, totalSold, totalValue, lowStock, criticalStock, outOfStock, totalSalesAmount, totalRestocks };
  }, [activeProducts, sales, restocks, settings, timeFilter]);

  const bestSelling = useMemo(() => {
    return [...activeProducts]
      .filter(p => p.total_sold > 0)
      .sort((a, b) => b.total_sold - a.total_sold)
      .slice(0, 5);
  }, [activeProducts]);

  const lowStockProducts = useMemo(() => {
    return activeProducts
      .filter(p => p.current_quantity <= settings.low_stock_threshold && !p.archived)
      .sort((a, b) => a.current_quantity - b.current_quantity)
      .slice(0, 5);
  }, [activeProducts, settings]);

  const recentActivities = useMemo(() => {
    const activities: { type: string; product: string; detail: string; date: string; color: string }[] = [];

    activeProducts.slice().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 3).forEach(p => {
      activities.push({ type: 'Added', product: p.product_name, detail: `Serial: ${p.serial_number}`, date: p.created_at, color: 'blue' });
    });

    sales.filter(s => s.status === 'completed').sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5).forEach(s => {
      s.items.forEach(item => {
        activities.push({ type: 'Sold', product: item.product_name, detail: `${item.quantity} units - ${settings.currency}${item.subtotal}`, date: s.created_at, color: 'green' });
      });
    });

    restocks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 3).forEach(r => {
      activities.push({ type: 'Restocked', product: r.product_name, detail: `+${r.quantity_added} units`, date: r.created_at, color: 'yellow' });
    });

    return activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);
  }, [activeProducts, sales, restocks, settings]);

  const getStockColor = (qty: number) => {
    if (qty === 0) return 'bg-gray-100 text-gray-600';
    if (qty <= settings.critical_stock_threshold) return 'bg-red-100 text-red-700';
    if (qty <= settings.low_stock_threshold) return 'bg-orange-100 text-orange-700';
    return 'bg-green-100 text-green-700';
  };

  const timeFilters = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' },
    { value: 'all', label: 'All Time' },
  ];

  return (
    <div className="space-y-6">
      {/* Time filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-600">Sales Period:</span>
        {timeFilters.map(f => (
          <button
            key={f.value}
            onClick={() => setTimeFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              timeFilter === f.value
                ? 'bg-yellow-500 text-black shadow-md'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-yellow-400'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Package} label="Total Products" value={stats.totalProducts.toString()} color="blue" />
        <StatCard icon={ShoppingBag} label="Total Stock" value={stats.totalStock.toString()} color="green" />
        <StatCard icon={TrendingUp} label="Total Sold" value={stats.totalSold.toString()} color="purple" />
        <StatCard icon={DollarSign} label="Inventory Value" value={`${settings.currency}${stats.totalValue.toLocaleString()}`} color="yellow" />
        <StatCard icon={DollarSign} label={`Sales (${timeFilters.find(f => f.value === timeFilter)?.label})`} value={`${settings.currency}${stats.totalSalesAmount.toLocaleString()}`} color="emerald" />
        <StatCard icon={AlertTriangle} label="Low Stock Items" value={stats.lowStock.toString()} color="orange" />
        <StatCard icon={XCircle} label="Out of Stock" value={stats.outOfStock.toString()} color="red" />
        <StatCard icon={RefreshCw} label="Restock Transactions" value={stats.totalRestocks.toString()} color="cyan" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Selling Products */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">🏆 Top Selling Products</h3>
            <Link to="/inventory" className="text-sm text-yellow-600 hover:text-yellow-700 font-medium flex items-center gap-1">
              View All <ArrowUpRight size={14} />
            </Link>
          </div>
          {bestSelling.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No sales data yet</p>
          ) : (
            <div className="space-y-3">
              {bestSelling.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-700 font-bold text-sm">
                    {i + 1}
                  </div>
                  <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
                    <Package size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{p.product_name}</p>
                    <p className="text-xs text-gray-500">{p.colour} • {p.size} • {p.serial_number}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">{p.total_sold} sold</p>
                    <p className="text-xs text-gray-500">{p.current_quantity} left</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stock Alerts */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">⚠️ Stock Alerts</h3>
            <Link to="/restock" className="text-sm text-yellow-600 hover:text-yellow-700 font-medium flex items-center gap-1">
              Restock <ArrowUpRight size={14} />
            </Link>
          </div>
          {lowStockProducts.length === 0 ? (
            <p className="text-gray-400 text-center py-8">All products are well stocked!</p>
          ) : (
            <div className="space-y-3">
              {lowStockProducts.map(p => (
                <div key={p.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`px-2 py-1 rounded text-xs font-bold ${getStockColor(p.current_quantity)}`}>
                    {p.current_quantity === 0 ? 'OUT' : p.current_quantity}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{p.product_name}</p>
                    <p className="text-xs text-gray-500">{p.colour} • {p.size}</p>
                  </div>
                  <Link
                    to="/restock"
                    state={{ productId: p.id }}
                    className="px-3 py-1.5 bg-yellow-500 text-black text-xs font-bold rounded-lg hover:bg-yellow-400"
                  >
                    Restock
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-lg font-bold text-gray-800 mb-4">📋 Recent Activities</h3>
        {recentActivities.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No recent activities</p>
        ) : (
          <div className="space-y-2">
            {recentActivities.map((a, i) => (
              <div key={i} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${
                  a.color === 'green' ? 'bg-green-500' :
                  a.color === 'blue' ? 'bg-blue-500' :
                  a.color === 'yellow' ? 'bg-yellow-500' : 'bg-gray-400'
                }`} />
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                  a.type === 'Sold' ? 'bg-green-100 text-green-700' :
                  a.type === 'Added' ? 'bg-blue-100 text-blue-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>{a.type}</span>
                <span className="font-medium text-gray-800 text-sm">{a.product}</span>
                <span className="text-sm text-gray-500">{a.detail}</span>
                <span className="ml-auto text-xs text-gray-400">{new Date(a.date).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    cyan: 'bg-cyan-50 text-cyan-600 border-cyan-100',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div className={`w-11 h-11 rounded-lg flex items-center justify-center border ${colors[color]}`}>
          <Icon size={22} />
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium">{label}</p>
          <p className="text-xl font-bold text-gray-800">{value}</p>
        </div>
      </div>
    </div>
  );
}
