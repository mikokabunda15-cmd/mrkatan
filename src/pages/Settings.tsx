import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { db } from '../utils/database';
import { Save, RotateCcw, AlertTriangle, CheckCircle } from 'lucide-react';

export default function SettingsPage() {
  const { settings, updateSettings, currentUser, refreshData } = useApp();
  const [form, setForm] = useState({ ...settings });
  const [saved, setSaved] = useState(false);
  const [showReset, setShowReset] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    db.resetDatabase();
    refreshData();
    setShowReset(false);
    setForm(db.getSettings());
    alert('Database has been reset with demo data.');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Store Information */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">🏪 Store Information</h3>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Store Name</label>
            <input
              type="text"
              value={form.store_name}
              onChange={(e) => setForm(f => ({ ...f, store_name: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
            <input
              type="text"
              value={form.store_address}
              onChange={(e) => setForm(f => ({ ...f, store_address: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
            <input
              type="text"
              value={form.store_phone}
              onChange={(e) => setForm(f => ({ ...f, store_phone: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Currency Symbol</label>
            <input
              type="text"
              value={form.currency}
              onChange={(e) => setForm(f => ({ ...f, currency: e.target.value }))}
              className="w-32 px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
            />
          </div>

          <div className="border-t pt-4">
            <h4 className="font-bold text-gray-700 mb-3">Stock Alert Thresholds</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Low Stock Threshold</label>
                <input
                  type="number"
                  value={form.low_stock_threshold}
                  onChange={(e) => setForm(f => ({ ...f, low_stock_threshold: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
                  min="1"
                />
                <p className="text-xs text-gray-500 mt-1">Products at or below this level show as "Low Stock"</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Critical Stock Threshold</label>
                <input
                  type="number"
                  value={form.critical_stock_threshold}
                  onChange={(e) => setForm(f => ({ ...f, critical_stock_threshold: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
                  min="1"
                />
                <p className="text-xs text-gray-500 mt-1">Products at or below this level show as "Critical"</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button type="submit" className="flex items-center gap-2 px-6 py-3 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 text-lg">
              <Save size={20} /> Save Settings
            </button>
            {saved && (
              <span className="flex items-center gap-1 text-green-600 font-medium">
                <CheckCircle size={18} /> Settings saved!
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Demo Credentials */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">👤 Demo Accounts</h3>
        <div className="space-y-3">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="font-bold text-gray-800">Administrator</p>
            <p className="text-sm text-gray-600">Username: <code className="bg-gray-200 px-1 rounded">admin</code> | Password: <code className="bg-gray-200 px-1 rounded">admin123</code></p>
            <p className="text-xs text-gray-500 mt-1">Full access: manage products, sales, restocking, reports, users, and settings.</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="font-bold text-gray-800">Employee</p>
            <p className="text-sm text-gray-600">Username: <code className="bg-gray-200 px-1 rounded">employee</code> | Password: <code className="bg-gray-200 px-1 rounded">emp123</code></p>
            <p className="text-xs text-gray-500 mt-1">Limited access: view inventory, record sales, view sales history.</p>
          </div>
        </div>
      </div>

      {/* PHP Backend Source */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">🖥️ PHP Backend Source Code</h3>
        <p className="text-gray-600 mb-3">The complete PHP backend is available in the <code className="bg-gray-100 px-1 rounded">/php/</code> directory. This is a production-ready PHP application that can be deployed to any PHP/MySQL server.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <a href="/php/README.md" target="_blank" className="p-3 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors">
            <p className="font-bold text-blue-800">📖 README.md</p>
            <p className="text-sm text-blue-600">Installation guide & documentation</p>
          </a>
          <a href="/php/database/mr_ketan_inventory.sql" target="_blank" className="p-3 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors">
            <p className="font-bold text-green-800">🗄️ SQL Database File</p>
            <p className="text-sm text-green-600">Complete schema + demo data</p>
          </a>
          <a href="/php/" target="_blank" className="p-3 bg-yellow-50 rounded-lg border border-yellow-200 hover:bg-yellow-100 transition-colors">
            <p className="font-bold text-yellow-800">🚀 PHP Application</p>
            <p className="text-sm text-yellow-600">Login page (requires PHP server)</p>
          </a>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="font-bold text-gray-800">📁 PHP Files</p>
            <p className="text-sm text-gray-600">config/, includes/, *.php pages</p>
          </div>
        </div>
        <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> The PHP application requires a PHP server (Apache/Nginx + MySQL) to run. 
            For production deployment, copy the <code className="bg-yellow-100 px-1 rounded">/php/</code> folder to your web server and import the SQL file.
            This React demo works standalone using browser localStorage.
          </p>
        </div>
      </div>

      {/* USB Scanner Instructions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">📱 USB Barcode Scanner Setup</h3>
        <div className="space-y-3 text-gray-700">
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="font-bold text-blue-800">How to connect a USB barcode scanner:</p>
            <ol className="list-decimal list-inside mt-2 space-y-1 text-sm text-blue-700">
              <li>Plug the USB barcode scanner into any available USB port on your computer.</li>
              <li>Wait a few seconds for the computer to recognize the device (no drivers needed for most scanners).</li>
              <li>Open the "Record a Sale" or "Restock" page.</li>
              <li>Click on the scan input field to place the cursor there.</li>
              <li>Scan a barcode — the serial number will appear automatically.</li>
              <li>The system will find the product and display its details.</li>
            </ol>
          </div>
          <p className="text-sm text-gray-600">
            💡 Most USB barcode scanners work as "keyboard wedge" devices — they type the scanned data as if you typed it on a keyboard.
            The cursor must be in the input field for scanning to work.
          </p>
          <p className="text-sm text-gray-600">
            💡 If you don't have a physical scanner, you can manually type the serial number and press Enter or click "Find".
          </p>
        </div>
      </div>

      {/* Reset Database */}
      {currentUser?.role === 'admin' && (
        <div className="bg-white rounded-xl border border-red-200 p-6">
          <h3 className="text-lg font-bold text-red-700 mb-4">⚠️ Danger Zone</h3>
          <p className="text-gray-600 mb-4">Reset the database to its original demo state. All current data will be lost.</p>
          <button
            onClick={() => setShowReset(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white font-bold rounded-lg hover:bg-red-400"
          >
            <RotateCcw size={18} /> Reset Database
          </button>

          {showReset && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle size={24} className="text-red-500" />
                  <h3 className="text-lg font-bold text-gray-800">Confirm Reset</h3>
                </div>
                <p className="text-gray-600 mb-6">This will delete ALL data and restore the demo data. This cannot be undone!</p>
                <div className="flex gap-3">
                  <button onClick={handleReset} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-lg hover:bg-red-400">
                    Yes, Reset Everything
                  </button>
                  <button onClick={() => setShowReset(false)} className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
