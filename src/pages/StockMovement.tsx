import React, { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { Search, Download, ArrowUpRight, ArrowDownRight, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

export default function StockMovement() {
  const { movements, settings } = useApp();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 20;

  const filtered = useMemo(() => {
    return movements.filter(m => {
      const searchLower = search.toLowerCase();
      const matchesSearch = !search ||
        m.product_name.toLowerCase().includes(searchLower) ||
        m.serial_number.toLowerCase().includes(searchLower) ||
        m.notes.toLowerCase().includes(searchLower);
      const matchesType = !typeFilter || m.movement_type === typeFilter;
      return matchesSearch && matchesType;
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [movements, search, typeFilter]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sale': return <ArrowDownRight size={16} className="text-red-500" />;
      case 'restock': return <ArrowUpRight size={16} className="text-green-500" />;
      case 'adjustment': return <RefreshCw size={16} className="text-blue-500" />;
      default: return <ArrowUpRight size={16} className="text-gray-500" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'sale': return 'bg-red-100 text-red-700';
      case 'restock': return 'bg-green-100 text-green-700';
      case 'adjustment': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const exportCSV = () => {
    const headers = ['Date', 'Product', 'Serial', 'Type', 'Change', 'Previous Qty', 'New Qty', 'Notes'];
    const rows = filtered.map(m => [
      new Date(m.created_at).toLocaleString(),
      m.product_name,
      m.serial_number,
      m.movement_type,
      String(m.quantity_changed),
      String(m.previous_quantity),
      String(m.new_quantity),
      m.notes,
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock-movements-${new Date().toISOString().split('T')[0]}.csv`;
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
              placeholder="Search by product name, serial number, or notes..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
            />
          </div>
          <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className="px-4 py-3 border border-gray-300 rounded-lg">
            <option value="">All Types</option>
            <option value="sale">Sales</option>
            <option value="restock">Restocks</option>
            <option value="adjustment">Adjustments</option>
          </select>
          <button onClick={exportCSV} className="px-4 py-3 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 font-medium text-sm flex items-center gap-2">
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-sm text-gray-500">Total Movements</p>
          <p className="text-2xl font-bold text-gray-800">{filtered.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-sm text-gray-500">Stock Added</p>
          <p className="text-2xl font-bold text-green-600">+{filtered.filter(m => m.quantity_changed > 0).reduce((s, m) => s + m.quantity_changed, 0)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-sm text-gray-500">Stock Removed</p>
          <p className="text-2xl font-bold text-red-600">{filtered.filter(m => m.quantity_changed < 0).reduce((s, m) => s + m.quantity_changed, 0)}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Date & Time</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Product</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Type</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Change</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Previous</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">New</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map(m => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    <div>{new Date(m.created_at).toLocaleDateString()}</div>
                    <div className="text-xs text-gray-400">{new Date(m.created_at).toLocaleTimeString()}</div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{m.product_name}</p>
                    <p className="text-xs text-gray-500 font-mono">{m.serial_number}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {getTypeIcon(m.movement_type)}
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getTypeBadge(m.movement_type)}`}>
                        {m.movement_type}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-bold ${m.quantity_changed > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {m.quantity_changed > 0 ? '+' : ''}{m.quantity_changed}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500 hidden md:table-cell">{m.previous_quantity}</td>
                  <td className="px-4 py-3 text-center font-bold text-gray-700 hidden md:table-cell">{m.new_quantity}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell max-w-[200px] truncate">{m.notes}</td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">No stock movements found.</td></tr>
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
    </div>
  );
}
