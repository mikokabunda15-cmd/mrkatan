import React, { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { db } from '../utils/database';
import { Search, Calendar, Download, Eye, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';

export default function SalesHistory() {
  const { sales, settings, refreshData } = useApp();
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [page, setPage] = useState(1);
  const perPage = 15;

  const filtered = useMemo(() => {
    return sales.filter(s => {
      const searchLower = search.toLowerCase();
      const matchesSearch = !search ||
        s.transaction_reference.toLowerCase().includes(searchLower) ||
        s.items.some(i => i.product_name.toLowerCase().includes(searchLower) || i.serial_number.toLowerCase().includes(searchLower));

      let matchesDate = true;
      const saleDate = new Date(s.created_at);
      const now = new Date();

      if (dateFilter === 'today') matchesDate = saleDate.toDateString() === now.toDateString();
      else if (dateFilter === 'yesterday') {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        matchesDate = saleDate.toDateString() === yesterday.toDateString();
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        matchesDate = saleDate >= weekAgo;
      } else if (dateFilter === 'month') {
        matchesDate = saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
      } else if (dateFilter === 'year') {
        matchesDate = saleDate.getFullYear() === now.getFullYear();
      } else if (dateFilter === 'custom' && dateFrom && dateTo) {
        const from = new Date(dateFrom);
        const to = new Date(dateTo);
        to.setHours(23, 59, 59);
        matchesDate = saleDate >= from && saleDate <= to;
      }

      return matchesSearch && matchesDate;
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [sales, search, dateFilter, dateFrom, dateTo]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const handleReverse = (saleId: string) => {
    if (confirm('Are you sure you want to reverse this sale? Stock will be restored. This action is traceable.')) {
      db.reverseSale(saleId);
      refreshData();
      setSelectedSale(null);
    }
  };

  const exportCSV = () => {
    const headers = ['Transaction Ref', 'Date', 'Product', 'Serial', 'Quantity', 'Unit Price', 'Subtotal', 'Total Amount', 'Status'];
    const rows: string[][] = [];

    filtered.forEach(sale => {
      sale.items.forEach(item => {
        rows.push([
          sale.transaction_reference,
          new Date(sale.created_at).toLocaleString(),
          item.product_name,
          item.serial_number,
          String(item.quantity),
          `${settings.currency}${item.unit_price}`,
          `${settings.currency}${item.subtotal}`,
          `${settings.currency}${sale.total_amount}`,
          sale.status,
        ]);
      });
    });

    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by transaction ref, product name, serial number..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
            />
          </div>
          <button onClick={exportCSV} className="px-4 py-3 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 font-medium text-sm flex items-center gap-2">
            <Download size={16} /> Export CSV
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mt-3 items-center">
          <Calendar size={16} className="text-gray-500" />
          {['today', 'yesterday', 'week', 'month', 'year', 'custom'].map(f => (
            <button
              key={f}
              onClick={() => { setDateFilter(f); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
                dateFilter === f ? 'bg-yellow-500 text-black' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'week' ? 'This Week' : f === 'year' ? 'This Year' : f === 'month' ? 'This Month' : f}
            </button>
          ))}
          {dateFilter === 'custom' && (
            <div className="flex gap-2 ml-2">
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm" />
              <span className="text-gray-400">to</span>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm" />
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-sm text-gray-500">Total Transactions</p>
          <p className="text-2xl font-bold text-gray-800">{filtered.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="text-2xl font-bold text-green-600">{settings.currency}{filtered.filter(s => s.status === 'completed').reduce((s, sale) => s + sale.total_amount, 0).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-sm text-gray-500">Items Sold</p>
          <p className="text-2xl font-bold text-blue-600">{filtered.filter(s => s.status === 'completed').reduce((s, sale) => s + sale.items.reduce((ss, i) => ss + i.quantity, 0), 0)}</p>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Reference</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Products</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Amount</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map(sale => (
                <tr key={sale.id} className={`hover:bg-gray-50 ${sale.status === 'reversed' ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3 font-mono text-xs font-bold text-gray-700">{sale.transaction_reference}</td>
                  <td className="px-4 py-3 text-gray-600">{new Date(sale.created_at).toLocaleDateString()} <span className="text-xs text-gray-400">{new Date(sale.created_at).toLocaleTimeString()}</span></td>
                  <td className="px-4 py-3">
                    <div className="space-y-0.5">
                      {sale.items.map((item, i) => (
                        <p key={i} className="text-gray-700">{item.product_name} <span className="text-gray-400">×{item.quantity}</span></p>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-gray-800">{settings.currency}{sale.total_amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${sale.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {sale.status === 'completed' ? 'Completed' : 'Reversed'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setSelectedSale(sale)} className="p-1.5 hover:bg-blue-50 rounded text-blue-600" title="View Details">
                        <Eye size={16} />
                      </button>
                      {sale.status === 'completed' && (
                        <button onClick={() => handleReverse(sale.id)} className="p-1.5 hover:bg-red-50 rounded text-red-500" title="Reverse Sale">
                          <RotateCcw size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">No sales found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sale Detail Modal */}
      {selectedSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Transaction Details</h3>
              <button onClick={() => setSelectedSale(null)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Reference:</span>
                <span className="font-bold font-mono">{selectedSale.transaction_reference}</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">{new Date(selectedSale.created_at).toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Status:</span>
                <span className={`font-bold ${selectedSale.status === 'completed' ? 'text-green-600' : 'text-red-600'}`}>{selectedSale.status}</span>
              </div>
              <div className="border-t pt-3">
                <p className="font-semibold text-gray-700 mb-2">Items:</p>
                {selectedSale.items.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between p-2 text-sm">
                    <span>{item.product_name} × {item.quantity}</span>
                    <span className="font-medium">{settings.currency}{item.subtotal}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="text-lg font-bold text-gray-800">Total:</span>
                <span className="text-lg font-bold text-green-600">{settings.currency}{selectedSale.total_amount.toLocaleString()}</span>
              </div>
              {selectedSale.status === 'completed' && (
                <button
                  onClick={() => handleReverse(selectedSale.id)}
                  className="w-full py-3 mt-3 bg-red-500 text-white font-bold rounded-lg hover:bg-red-400 flex items-center justify-center gap-2"
                >
                  <RotateCcw size={18} /> Reverse This Sale
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
