<?php
/**
 * Settings Page (Admin only)
 */
require_once __DIR__ . '/includes/functions.php';
require_admin();

$page_title = 'Settings';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['update_settings'])) {
        update_setting($pdo, 'store_name', trim($_POST['store_name']));
        update_setting($pdo, 'store_address', trim($_POST['store_address']));
        update_setting($pdo, 'store_phone', trim($_POST['store_phone']));
        update_setting($pdo, 'currency', trim($_POST['currency']));
        update_setting($pdo, 'low_stock_threshold', intval($_POST['low_stock_threshold']));
        update_setting($pdo, 'critical_stock_threshold', intval($_POST['critical_stock_threshold']));
        set_flash('success', 'Settings saved successfully!');
        redirect(BASE_URL . 'settings.php');
    }
    
    if (isset($_POST['reset_database'])) {
        set_flash('error', 'Database reset is only available via the SQL installation file. Please re-run the SQL script to reset.');
        redirect(BASE_URL . 'settings.php');
    }
}

$settings = [
    'store_name' => get_setting($pdo, 'store_name', 'Mr Ketan Fashion Store'),
    'store_address' => get_setting($pdo, 'store_address', ''),
    'store_phone' => get_setting($pdo, 'store_phone', ''),
    'currency' => get_setting($pdo, 'currency', 'K'),
    'low_stock_threshold' => get_setting($pdo, 'low_stock_threshold', '5'),
    'critical_stock_threshold' => get_setting($pdo, 'critical_stock_threshold', '2'),
];

include __DIR__ . '/includes/header.php';
include __DIR__ . '/includes/sidebar.php';
?>

<div class="max-w-3xl mx-auto space-y-6">
    <div class="bg-white rounded-xl border border-gray-200 p-6">
        <h3 class="text-lg font-bold text-gray-800 mb-4">🏪 Store Information</h3>
        <form method="POST" class="space-y-4">
            <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1">Store Name</label>
                <input type="text" name="store_name" value="<?php echo e($settings['store_name']); ?>"
                       class="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-yellow-500 outline-none">
            </div>
            <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1">Address</label>
                <input type="text" name="store_address" value="<?php echo e($settings['store_address']); ?>"
                       class="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-yellow-500 outline-none">
            </div>
            <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
                <input type="text" name="store_phone" value="<?php echo e($settings['store_phone']); ?>"
                       class="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-yellow-500 outline-none">
            </div>
            <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1">Currency Symbol</label>
                <input type="text" name="currency" value="<?php echo e($settings['currency']); ?>"
                       class="w-32 px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-yellow-500 outline-none">
            </div>
            <div class="border-t pt-4">
                <h4 class="font-bold text-gray-700 mb-3">Stock Alert Thresholds</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-1">Low Stock Threshold</label>
                        <input type="number" name="low_stock_threshold" value="<?php echo e($settings['low_stock_threshold']); ?>"
                               class="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-yellow-500 outline-none" min="1">
                        <p class="text-xs text-gray-500 mt-1">Products at or below this level show as "Low Stock"</p>
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-1">Critical Stock Threshold</label>
                        <input type="number" name="critical_stock_threshold" value="<?php echo e($settings['critical_stock_threshold']); ?>"
                               class="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-yellow-500 outline-none" min="1">
                        <p class="text-xs text-gray-500 mt-1">Products at or below this level show as "Critical"</p>
                    </div>
                </div>
            </div>
            <button type="submit" name="update_settings" class="flex items-center gap-2 px-6 py-3 btn-gold rounded-lg text-lg">
                <i class="fas fa-save"></i> Save Settings
            </button>
        </form>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 p-6">
        <h3 class="text-lg font-bold text-gray-800 mb-4">👤 Demo Accounts</h3>
        <div class="space-y-3">
            <div class="p-3 bg-gray-50 rounded-lg">
                <p class="font-bold text-gray-800">Administrator</p>
                <p class="text-sm text-gray-600">Username: <code class="bg-gray-200 px-1 rounded">admin</code> | Password: <code class="bg-gray-200 px-1 rounded">admin123</code></p>
            </div>
            <div class="p-3 bg-gray-50 rounded-lg">
                <p class="font-bold text-gray-800">Employee</p>
                <p class="text-sm text-gray-600">Username: <code class="bg-gray-200 px-1 rounded">employee</code> | Password: <code class="bg-gray-200 px-1 rounded">emp123</code></p>
            </div>
        </div>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 p-6">
        <h3 class="text-lg font-bold text-gray-800 mb-4">📱 USB Barcode Scanner Setup</h3>
        <div class="space-y-3 text-gray-700">
            <div class="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p class="font-bold text-blue-800">How to connect a USB barcode scanner:</p>
                <ol class="list-decimal list-inside mt-2 space-y-1 text-sm text-blue-700">
                    <li>Plug the USB barcode scanner into any available USB port.</li>
                    <li>Wait a few seconds for the computer to recognize the device.</li>
                    <li>Open the "Record a Sale" or "Restock" page.</li>
                    <li>Click on the scan input field to place the cursor there.</li>
                    <li>Scan a barcode — the serial number will appear automatically.</li>
                    <li>Press Enter or click "Find" to look up the product.</li>
                </ol>
            </div>
            <p class="text-sm text-gray-600">💡 Most USB barcode scanners work as "keyboard wedge" devices. The cursor must be in the input field for scanning to work.</p>
        </div>
    </div>
</div>

<?php include __DIR__ . '/includes/footer.php'; ?>
