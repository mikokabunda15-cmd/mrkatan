import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { db } from '../utils/database';
import { generateBarcodeForProduct } from '../utils/barcode';
import { Save, Camera, AlertCircle, CheckCircle } from 'lucide-react';

export default function AddProduct() {
  const { refreshData, settings } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const editId = new URLSearchParams(location.search).get('edit');
  const isEdit = !!editId;

  const [form, setForm] = useState({
    serial_number: '',
    product_name: '',
    category: 'Shirts',
    colour: '',
    size: 'M',
    original_quantity: '',
    current_quantity: '',
    purchase_price: '',
    selling_price: '',
    minimum_stock_level: String(settings.low_stock_threshold),
    product_image: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [barcodePreview, setBarcodePreview] = useState('');

  useEffect(() => {
    if (isEdit && editId) {
      const product = db.getProductById(editId);
      if (product) {
        setForm({
          serial_number: product.serial_number,
          product_name: product.product_name,
          category: product.category,
          colour: product.colour,
          size: product.size,
          original_quantity: String(product.original_quantity),
          current_quantity: String(product.current_quantity),
          purchase_price: String(product.purchase_price),
          selling_price: String(product.selling_price),
          minimum_stock_level: String(product.minimum_stock_level),
          product_image: product.product_image,
        });
        setBarcodePreview(generateBarcodeForProduct(product.serial_number));
      }
    }
  }, [editId, isEdit]);

  useEffect(() => {
    if (form.serial_number && /^[A-Za-z0-9\-_]+$/.test(form.serial_number)) {
      setBarcodePreview(generateBarcodeForProduct(form.serial_number));
    } else {
      setBarcodePreview('');
    }
  }, [form.serial_number]);

  const categories = ['Shirts', 'Trousers', 'Shoes', 'Jackets', 'T-Shirts', 'Jeans', 'Accessories', 'Other'];
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!form.serial_number || !form.product_name || !form.colour || !form.original_quantity || !form.purchase_price || !form.selling_price) {
      setError('Please fill in all required fields.');
      return;
    }

    // Allow alphanumeric serial numbers (e.g. MKS-001, MKS001, etc.)
    if (!/^[A-Za-z0-9\-_]+$/.test(form.serial_number)) {
      setError('Serial number must contain only letters, numbers, hyphens or underscores.');
      return;
    }

    // Check duplicate serial number
    const existing = db.getProductBySerial(form.serial_number);
    if (existing && (!isEdit || existing.id !== editId)) {
      setError('This serial number already exists. Please use a different one.');
      return;
    }

    const originalQty = parseInt(form.original_quantity);
    const currentQty = isEdit ? parseInt(form.current_quantity) : originalQty;

    if (isNaN(originalQty) || originalQty < 0) {
      setError('Original quantity must be a positive number.');
      return;
    }

    const barcodeImage = generateBarcodeForProduct(form.serial_number);

    if (isEdit && editId) {
      db.updateProduct(editId, {
        serial_number: form.serial_number,
        product_name: form.product_name,
        category: form.category,
        colour: form.colour,
        size: form.size,
        original_quantity: originalQty,
        current_quantity: currentQty,
        purchase_price: parseFloat(form.purchase_price),
        selling_price: parseFloat(form.selling_price),
        minimum_stock_level: parseInt(form.minimum_stock_level) || settings.low_stock_threshold,
        product_image: form.product_image,
        barcode_image: barcodeImage,
      });
      setSuccess('Product updated successfully!');
    } else {
      db.addProduct({
        serial_number: form.serial_number,
        product_name: form.product_name,
        category: form.category,
        colour: form.colour,
        size: form.size,
        original_quantity: originalQty,
        current_quantity: currentQty,
        total_sold: 0,
        purchase_price: parseFloat(form.purchase_price),
        selling_price: parseFloat(form.selling_price),
        product_image: form.product_image,
        barcode_image: barcodeImage,
        minimum_stock_level: parseInt(form.minimum_stock_level) || settings.low_stock_threshold,
        archived: false,
        last_restocked_at: null,
      });
      setSuccess('Product registered successfully! Barcode generated.');
    }

    refreshData();

    // Download barcode
    if (barcodePreview) {
      const link = document.createElement('a');
      link.href = barcodeImage;
      link.download = `barcode-${form.serial_number}.png`;
      link.click();
    }

    if (!isEdit) {
      setTimeout(() => {
        setForm({
          serial_number: '',
          product_name: '',
          category: 'Shirts',
          colour: '',
          size: 'M',
          original_quantity: '',
          current_quantity: '',
          purchase_price: '',
          selling_price: '',
          minimum_stock_level: String(settings.low_stock_threshold),
          product_image: '',
        });
        setBarcodePreview('');
        setSuccess('');
      }, 2000);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Image must be less than 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        setForm(f => ({ ...f, product_image: ev.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">
          {isEdit ? '✏️ Edit Product' : '➕ Register New Product'}
        </h2>

        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            <CheckCircle size={18} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Serial Number *</label>
              <input
                type="text"
                value={form.serial_number}
                onChange={(e) => setForm(f => ({ ...f, serial_number: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg font-mono focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
                placeholder="e.g. MKS-001"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Letters, numbers, hyphens. Must be unique (e.g. MKS-001).</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Product Name *</label>
              <input
                type="text"
                value={form.product_name}
                onChange={(e) => setForm(f => ({ ...f, product_name: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
                placeholder="e.g. Black Formal Shirt"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Category *</label>
              <select
                value={form.category}
                onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Colour *</label>
              <input
                type="text"
                value={form.colour}
                onChange={(e) => setForm(f => ({ ...f, colour: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
                placeholder="e.g. Black"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Size *</label>
              <select
                value={form.size}
                onChange={(e) => setForm(f => ({ ...f, size: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
              >
                {sizes.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Quantities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Original Quantity *</label>
              <input
                type="number"
                value={form.original_quantity}
                onChange={(e) => setForm(f => ({ ...f, original_quantity: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
                placeholder="e.g. 20"
                min="0"
                required
              />
            </div>
            {isEdit && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Current Available Quantity</label>
                <input
                  type="number"
                  value={form.current_quantity}
                  onChange={(e) => setForm(f => ({ ...f, current_quantity: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
                  min="0"
                />
              </div>
            )}
          </div>

          {/* Prices */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Purchase Price ({settings.currency}) *</label>
              <input
                type="number"
                value={form.purchase_price}
                onChange={(e) => setForm(f => ({ ...f, purchase_price: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
                placeholder="e.g. 150"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Selling Price ({settings.currency}) *</label>
              <input
                type="number"
                value={form.selling_price}
                onChange={(e) => setForm(f => ({ ...f, selling_price: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
                placeholder="e.g. 250"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Min. Stock Level</label>
              <input
                type="number"
                value={form.minimum_stock_level}
                onChange={(e) => setForm(f => ({ ...f, minimum_stock_level: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
                placeholder="e.g. 5"
                min="0"
              />
            </div>
          </div>

          {/* Product Image */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Product Image (optional)</label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <Camera size={20} className="text-gray-500" />
                <span className="text-gray-600">Upload Image</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
              {form.product_image && (
                <img src={form.product_image} alt="Preview" className="w-16 h-16 object-cover rounded-lg border" />
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">Max 2MB. JPG, PNG supported.</p>
          </div>

          {/* Barcode Preview */}
          {barcodePreview && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm font-semibold text-gray-700 mb-2">📊 Generated Barcode Preview:</p>
              <div className="bg-white p-4 rounded-lg border inline-block">
                <img src={barcodePreview} alt="Barcode" className="max-w-full" />
              </div>
              <p className="text-xs text-gray-500 mt-2">This barcode will be automatically saved and downloaded upon registration.</p>
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold rounded-lg hover:from-yellow-400 hover:to-yellow-500 shadow-lg text-lg"
            >
              <Save size={20} />
              {isEdit ? 'Update Product' : 'Register Product'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/inventory')}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 font-medium text-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
