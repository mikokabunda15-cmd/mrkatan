import React, { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { Link } from 'react-router-dom';
import { Search, Filter, Eye, Edit, RefreshCw, Printer, Archive, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { generateBarcodeForProduct } from '../utils/barcode';
import { db } from '../utils/database';

export default function Inventory() {
  const { products, settings, refreshData } = useApp();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [sizeFilter, setSizeFilter] = useState('');
  const [colourFilter, setColourFilter] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  const activeProducts = products.filter(p => !p.archived);
  const categories = [...new Set(activeProducts.map(p => p.category))];
  const sizes = [...new Set(activeProducts.map(p => p.size))].sort();
  const colours = [...new Set(activeProducts.map(p => p.colour))].sort();

  const filtered = useMemo(() => {
    return activeProducts.filter(p => {
      const searchLower = search.toLowerCase();
      const matchesSearch = !search ||
        p.product_name.toLowerCase().includes(searchLower) ||
        p.serial_number.toLowerCase().includes(searchLower) ||
        p.category.toLowerCase().includes(searchLower) ||
        p.colour.toLowerCase().includes(searchLower) ||
        p.size.toLowerCase().includes(searchLower);
      const matchesCategory = !categoryFilter || p.category === categoryFilter;
      const matchesSize = !sizeFilter || p.size === sizeFilter;
      const matchesColour = !colourFilter || p.colour === colourFilter;

      let matchesStock = true;
      if (stockFilter === 'in_stock') matchesStock = p.current_quantity > settings.low_stock_threshold;
      else if (stockFilter === 'low') matchesStock = p.current_quantity > 0 && p.current_quantity <= settings.low_stock_threshold;
      else if (stockFilter === 'critical') matchesStock = p.current_quantity > 0 && p.current_quantity <= settings.critical_stock_threshold;
      else if (stockFilter === 'out') matchesStock = p.current_quantity === 0;

      return matchesSearch && matchesCategory && matchesStock && matchesSize && matchesColour;
    });
  }, [activeProducts, search, categoryFilter, stockFilter, sizeFilter, colourFilter, settings]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const getStockStatus = (qty: number) => {
    if (qty === 0) return { label: 'Out of Stock', color: 'bg-gray-100 text-gray-600' };
    if (qty <= settings.critical_stock_threshold) return { label: 'Critical', color: 'bg-red-100 text-red-700' };
    if (qty <= settings.low_stock_threshold) return { label: 'Low Stock', color: 'bg-orange-100 text-orange-700' };
    return { label: 'In Stock', color: 'bg-green-100 text-green-700' };
  };

  const handlePrintBarcode = (product: any) => {
    const barcodeImg = generateBarcodeForProduct(product.serial_number);
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`
        <html><head><title>Barcode - ${product.product_name}</title>
        <style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif}
        h2{margin-bottom:8px}p{color:#666;margin:4px 0}img{margin:16px 0;border:1px solid #ddd;padding:8px;border-radius:8px}</style></head>
        <body><h2>${product.product_name}</h2><p>Serial: ${product.serial_number}</p><p>Size: ${product.size} | Colour: ${product.colour}</p>
        <img src="${barcodeImg}" /><p style="font-size:12px">${settings.store_name}</p>
        <script>window.onload=()=>window.print()</script></body></html>
      `);
    }
  };

  const handleArchive = (id: string, name: string) => {
    if (confirm(`Are you sure you want to archive "${name}"? It will no longer appear in the active inventory.`)) {
      db.archiveProduct(id);
      refreshData();
    }
  };

  const resetFilters = () => {
    setSearch('');
    setCategoryFilter('');
    setStockFilter('');
    setSizeFilter('');
    setColourFilter('');
    setPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name, serial number, category, colour, size..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
            />
          </div>
          <button onClick={resetFilters} className="px-4 py-3 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 font-medium text-sm flex items-center gap-2">
            <Filter size={16} /> Reset Filters
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={stockFilter} onChange={(e) => { setStockFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="">All Stock Levels</option>
            <option value="in_stock">Fully Stocked</option>
            <option value="low">Low Stock</option>
            <option value="critical">Critically Low</option>
            <option value="out">Out of Stock</option>
          </select>
          <select value={sizeFilter} onChange={(e) => { setSizeFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="">All Sizes</option>
            {sizes.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={colourFilter} onChange={(e) => { setColourFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="">All Colours</option>
            {colours.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing <span className="font-bold">{filtered.length}</span> product{filtered.length !== 1 ? 's' : ''}
        </p>
        <Link to="/add-product" className="px-4 py-2 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 text-sm">
          + Add New Product
        </Link>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Product</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Serial</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Category</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Colour</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Size</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Stock</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Price</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map(p => {
                const status = getStockStatus(p.current_quantity);
                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Package size={18} className="text-gray-400" />
                        </div>
                        <span className="font-medium text-gray-800">{p.product_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell font-mono text-xs">{p.serial_number}</td>
                    <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{p.category}</td>
                    <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{p.colour}</td>
                    <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{p.size}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-bold">{p.current_quantity}</span>
                      <span className="text-gray-400 text-xs">/{p.original_quantity}</span>
                    </td>
                    <td className="px-4 py-3 text-right hidden md:table-cell font-medium">{settings.currency}{p.selling_price}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${status.color}`}>{status.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Link to={`/product/${p.id}`} className="p-1.5 hover:bg-blue-50 rounded text-blue-600" title="View Details">
                          <Eye size={16} />
                        </Link>
                        <Link to={`/product/${p.id}?edit=true`} className="p-1.5 hover:bg-yellow-50 rounded text-yellow-600" title="Edit">
                          <Edit size={16} />
                        </Link>
                        <button onClick={() => handlePrintBarcode(p)} className="p-1.5 hover:bg-gray-100 rounded text-gray-600" title="Print Barcode">
                          <Printer size={16} />
                        </button>
                        <Link to="/restock" state={{ productId: p.id }} className="p-1.5 hover:bg-green-50 rounded text-green-600" title="Restock">
                          <RefreshCw size={16} />
                        </Link>
                        <button onClick={() => handleArchive(p.id, p.product_name)} className="p-1.5 hover:bg-red-50 rounded text-red-500" title="Archive">
                          <Archive size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                    No products found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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
