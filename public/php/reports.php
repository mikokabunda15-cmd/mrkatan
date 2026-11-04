<?php
/**
 * Reports & Analytics Page
 */
require_once __DIR__ . '/includes/functions.php';
require_login();

$page_title = 'Reports & Analytics';
$currency = get_setting($pdo, 'currency', 'K');
$report_type = $_GET['type'] ?? 'inventory';
$date_from = $_GET['from'] ?? '';
$date_to = $_GET['to'] ?? '';

// Inventory Report
$inventory_stats = get_dashboard_stats($pdo);
$all_products = get_all_products($pdo);
$low_threshold = get_setting($pdo, 'low_stock_threshold', 5);

// Sales Report
$sales_where = "s.status = 'completed'";
$sales_params = [];
if ($date_from) { $sales_where .= " AND DATE(s.created_at) >= ?"; $sales_params[] = $date_from; }
if ($date_to) { $sales_where .= " AND DATE(s.created_at) <= ?"; $sales_params[] = $date_to; }

$sales_sql = "SELECT s.*, si.product_name, si.quantity, si.unit_price, si.subtotal, p.category_id, c.category_name 
              FROM sales s JOIN sale_items si ON s.id = si.sale_id 
              LEFT JOIN products p ON si.product_id = p.id LEFT JOIN categories c ON p.category_id = c.id 
              WHERE $sales_where ORDER BY s.created_at DESC";
$stmt = $pdo->prepare($sales_sql);
$stmt->execute($sales_params);
$sales_data = $stmt->fetchAll();

$total_revenue = array_sum(array_column($sales_data, 'subtotal'));
$total_cost = 0;
foreach ($sales_data as $sd) {
    $p = get_product($pdo, $sd['product_id'] ?? 0);
    if ($p) $total_cost += $p['purchase_price'] * $sd['quantity'];
}
$gross_profit = $total_revenue - $total_cost;

// Sales by category
$sales_by_cat = [];
foreach ($sales_data as $sd) {
    $cat = $sd['category_name'] ?? 'Other';
    if (!isset($sales_by_cat[$cat])) $sales_by_cat[$cat] = ['units' => 0, 'revenue' => 0];
    $sales_by_cat[$cat]['units'] += $sd['quantity'];
    $sales_by_cat[$cat]['revenue'] += $sd['subtotal'];
}

// Best sellers
$best_sellers = [];
foreach ($sales_data as $sd) {
    if (!isset($best_sellers[$sd['product_name']])) $best_sellers[$sd['product_name']] = 0;
    $best_sellers[$sd['product_name']] += $sd['quantity'];
}
arsort($best_sellers);
$best_sellers = array_slice($best_sellers, 0, 5, true);

// Restocking Report
$restocks = $pdo->query("SELECT r.*, p.product_name, p.serial_number FROM restocks r JOIN products p ON r.product_id = p.id ORDER BY r.created_at DESC")->fetchAll();
$total_restock_cost = array_sum(array_column($restocks, 'purchase_cost'));
$total_restock_units = array_sum(array_column($restocks, 'quantity_added'));

// CSV Export
if (isset($_GET['export'])) {
    header('Content-Type: text/csv');
    $out = fopen('php://output', 'w');
    
    if ($_GET['export'] === 'inventory') {
        header('Content-Disposition: attachment; filename="inventory-report-' . date('Y-m-d') . '.csv"');
        fputcsv($out, ['Product', 'Serial', 'Category', 'Colour', 'Size', 'Stock', 'Purchase Price', 'Selling Price', 'Stock Value']);
        foreach ($all_products as $p) {
            fputcsv($out, [$p['product_name'], $p['serial_number'], $p['category_name'], $p['colour'], $p['size'], $p['current_quantity'], $p['purchase_price'], $p['selling_price'], $p['current_quantity'] * $p['purchase_price']]);
        }
    } elseif ($_GET['export'] === 'sales') {
        header('Content-Disposition: attachment; filename="sales-report-' . date('Y-m-d') . '.csv"');
        fputcsv($out, ['Date', 'Reference', 'Product', 'Category', 'Qty', 'Unit Price', 'Subtotal']);
        foreach ($sales_data as $sd) {
            fputcsv($out, [$sd['created_at'], $sd['transaction_reference'], $sd['product_name'], $sd['category_name'], $sd['quantity'], $sd['unit_price'], $sd['subtotal']]);
        }
    } elseif ($_GET['export'] === 'restocking') {
        header('Content-Disposition: attachment; filename="restock-report-' . date('Y-m-d') . '.csv"');
        fputcsv($out, ['Date', 'Product', 'Serial', 'Qty', 'Cost', 'Supplier']);
        foreach ($restocks as $r) {
            fputcsv($out, [$r['created_at'], $r['product_name'], $r['serial_number'], $r['quantity_added'], $r['purchase_cost'], $r['supplier']]);
        }
    }
    fclose($out);
    exit;
}

include __DIR__ . '/includes/header.php';
include __DIR__ . '/includes/sidebar.php';
?>

<div class="space-y-6">
    <!-- Date Range -->
    <div class="bg-white rounded-xl border border-gray-200 p-4">
        <form method="GET" class="flex flex-wrap items-center gap-4">
            <input type="hidden" name="type" value="<?php echo e($report_type); ?>">
            <i class="fas fa-calendar text-gray-500"></i>
            <span class="text-sm font-medium text-gray-600">Date Range:</span>
            <input type="date" name="from" value="<?php echo e($date_from); ?>" class="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <span class="text-gray-400">to</span>
            <input type="date" name="to" value="<?php echo e($date_to); ?>" class="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <button type="submit" class="px-4 py-2 btn-gold rounded-lg text-sm">Apply</button>
            <a href="<?php echo BASE_URL; ?>reports.php?type=<?php echo e($report_type); ?>" class="text-sm text-yellow-600 hover:text-yellow-700 font-medium">Clear</a>
        </form>
    </div>

    <!-- Report Tabs -->
    <div class="flex gap-2 flex-wrap">
        <?php foreach (['inventory'=>'📦 Inventory','sales'=>'💰 Sales','restocking'=>'🔄 Restocking'] as $val => $label): ?>
        <a href="<?php echo BASE_URL; ?>reports.php?type=<?php echo $val; ?>&from=<?php echo e($date_from); ?>&to=<?php echo e($date_to); ?>"
           class="px-4 py-2 rounded-lg font-medium text-sm <?php echo $report_type === $val ? 'bg-yellow-500 text-black shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:border-yellow-400'; ?>">
            <?php echo $label; ?>
        </a>
        <?php endforeach; ?>
    </div>

    <?php if ($report_type === 'inventory'): ?>
    <!-- INVENTORY REPORT -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p class="text-sm text-gray-500">Total Products</p>
            <p class="text-2xl font-bold"><?php echo $inventory_stats['total_products']; ?></p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p class="text-sm text-gray-500">Total Units</p>
            <p class="text-2xl font-bold text-blue-600"><?php echo $inventory_stats['total_stock']; ?></p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p class="text-sm text-gray-500">Inventory Value</p>
            <p class="text-2xl font-bold text-green-600"><?php echo $currency . number_format($inventory_stats['inventory_value']); ?></p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p class="text-sm text-gray-500">Low/Out of Stock</p>
            <p class="text-2xl font-bold text-red-600"><?php echo $inventory_stats['low_stock'] + $inventory_stats['out_of_stock']; ?></p>
        </div>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 p-5">
        <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold">Stock Levels</h3>
            <a href="?export=inventory&type=inventory" class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"><i class="fas fa-download mr-1"></i>CSV</a>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="bg-gray-50 border-b"><tr>
                    <th class="text-left px-4 py-2 font-semibold text-gray-600">Product</th>
                    <th class="text-center px-4 py-2 font-semibold text-gray-600">Stock</th>
                    <th class="text-center px-4 py-2 font-semibold text-gray-600">Sold</th>
                    <th class="text-right px-4 py-2 font-semibold text-gray-600">Value</th>
                    <th class="text-center px-4 py-2 font-semibold text-gray-600">Status</th>
                </tr></thead>
                <tbody class="divide-y">
                    <?php foreach ($all_products as $p):
                        $status = get_stock_status($p['current_quantity'], $low_threshold, get_setting($pdo, 'critical_stock_threshold', 2));
                    ?>
                    <tr class="hover:bg-gray-50">
                        <td class="px-4 py-2 font-medium"><?php echo e($p['product_name']); ?></td>
                        <td class="px-4 py-2 text-center font-bold"><?php echo $p['current_quantity']; ?></td>
                        <td class="px-4 py-2 text-center"><?php echo $p['total_sold']; ?></td>
                        <td class="px-4 py-2 text-right"><?php echo $currency . number_format($p['current_quantity'] * $p['purchase_price']); ?></td>
                        <td class="px-4 py-2 text-center"><span class="px-2 py-0.5 rounded-full text-xs font-bold <?php echo $status['color']; ?>"><?php echo $status['label']; ?></span></td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </div>

    <?php elseif ($report_type === 'sales'): ?>
    <!-- SALES REPORT -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p class="text-sm text-gray-500">Total Revenue</p>
            <p class="text-2xl font-bold text-green-600"><?php echo $currency . number_format($total_revenue); ?></p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p class="text-sm text-gray-500">Cost of Goods</p>
            <p class="text-2xl font-bold text-red-600"><?php echo $currency . number_format($total_cost); ?></p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p class="text-sm text-gray-500">Gross Profit (Est.)</p>
            <p class="text-2xl font-bold text-emerald-600"><?php echo $currency . number_format($gross_profit); ?></p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p class="text-sm text-gray-500">Transactions</p>
            <p class="text-2xl font-bold text-blue-600"><?php echo count(array_unique(array_column($sales_data, 'transaction_reference'))); ?></p>
        </div>
    </div>

    <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <p class="text-sm text-yellow-800"><strong>Note:</strong> Revenue is total sales income. Gross profit = Revenue - Cost of Goods Sold. Actual profit may differ after operating expenses.</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-xl border border-gray-200 p-5">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-bold">Sales by Category</h3>
                <a href="?export=sales&type=sales&from=<?php echo e($date_from); ?>&to=<?php echo e($date_to); ?>" class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"><i class="fas fa-download mr-1"></i>CSV</a>
            </div>
            <?php foreach ($sales_by_cat as $cat => $data): ?>
            <div class="flex items-center justify-between p-2 bg-gray-50 rounded-lg mb-2">
                <span class="font-medium"><?php echo e($cat); ?></span>
                <span class="text-sm"><span class="font-bold text-green-600"><?php echo $currency . number_format($data['revenue']); ?></span> (<?php echo $data['units']; ?> units)</span>
            </div>
            <?php endforeach; ?>
            <?php if (empty($sales_by_cat)): ?><p class="text-gray-400 text-center py-4">No sales data</p><?php endif; ?>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-5">
            <h3 class="text-lg font-bold mb-4">🏆 Best Sellers</h3>
            <?php $i = 0; foreach ($best_sellers as $name => $units): $i++; ?>
            <div class="flex items-center justify-between p-2 bg-gray-50 rounded-lg mb-2">
                <div class="flex items-center gap-2">
                    <span class="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center text-xs font-bold text-yellow-700"><?php echo $i; ?></span>
                    <span class="text-sm font-medium"><?php echo e($name); ?></span>
                </div>
                <span class="text-sm font-bold text-green-600"><?php echo $units; ?> sold</span>
            </div>
            <?php endforeach; ?>
            <?php if (empty($best_sellers)): ?><p class="text-gray-400 text-center py-4">No sales data</p><?php endif; ?>
        </div>
    </div>

    <?php else: ?>
    <!-- RESTOCKING REPORT -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p class="text-sm text-gray-500">Restock Transactions</p>
            <p class="text-2xl font-bold"><?php echo count($restocks); ?></p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p class="text-sm text-gray-500">Total Units Restocked</p>
            <p class="text-2xl font-bold text-green-600"><?php echo $total_restock_units; ?></p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p class="text-sm text-gray-500">Total Cost</p>
            <p class="text-2xl font-bold text-blue-600"><?php echo $currency . number_format($total_restock_cost); ?></p>
        </div>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 p-5">
        <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold">Restocking History</h3>
            <a href="?export=restocking&type=restocking" class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"><i class="fas fa-download mr-1"></i>CSV</a>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="bg-gray-50 border-b"><tr>
                    <th class="text-left px-4 py-2 font-semibold text-gray-600">Date</th>
                    <th class="text-left px-4 py-2 font-semibold text-gray-600">Product</th>
                    <th class="text-center px-4 py-2 font-semibold text-gray-600">Qty</th>
                    <th class="text-right px-4 py-2 font-semibold text-gray-600">Cost</th>
                    <th class="text-left px-4 py-2 font-semibold text-gray-600">Supplier</th>
                </tr></thead>
                <tbody class="divide-y">
                    <?php foreach ($restocks as $r): ?>
                    <tr class="hover:bg-gray-50">
                        <td class="px-4 py-2 text-gray-600"><?php echo format_date($r['created_at']); ?></td>
                        <td class="px-4 py-2 font-medium"><?php echo e($r['product_name']); ?></td>
                        <td class="px-4 py-2 text-center font-bold text-green-600">+<?php echo $r['quantity_added']; ?></td>
                        <td class="px-4 py-2 text-right"><?php echo $currency . number_format($r['purchase_cost']); ?></td>
                        <td class="px-4 py-2 text-gray-600"><?php echo e($r['supplier'] ?: '-'); ?></td>
                    </tr>
                    <?php endforeach; ?>
                    <?php if (empty($restocks)): ?>
                    <tr><td colspan="5" class="px-4 py-8 text-center text-gray-400">No restocking records.</td></tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>
    <?php endif; ?>
</div>

<?php include __DIR__ . '/includes/footer.php'; ?>
