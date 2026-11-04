<?php
/**
 * Dashboard Page
 */
require_once __DIR__ . '/includes/functions.php';
require_login();

$page_title = 'Dashboard';
$stats = get_dashboard_stats($pdo);
$best_selling = get_best_selling($pdo, 5);
$currency = get_setting($pdo, 'currency', 'K');

// Low stock products
$low_threshold = get_setting($pdo, 'low_stock_threshold', 5);
$stmt = $pdo->prepare("SELECT p.*, c.category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.archived_at IS NULL AND p.current_quantity <= ? ORDER BY p.current_quantity ASC LIMIT 5");
$stmt->execute([$low_threshold]);
$low_stock_products = $stmt->fetchAll();

// Recent activities
$recent_sales = $pdo->query("SELECT s.*, si.product_name, si.quantity FROM sales s JOIN sale_items si ON s.id = si.sale_id WHERE s.status = 'completed' ORDER BY s.created_at DESC LIMIT 5")->fetchAll();
$recent_restocks = $pdo->query("SELECT r.*, p.product_name FROM restocks r JOIN products p ON r.product_id = p.id ORDER BY r.created_at DESC LIMIT 3")->fetchAll();

include __DIR__ . '/includes/header.php';
include __DIR__ . '/includes/sidebar.php';
?>

<div class="space-y-6">
    <!-- Stats Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <?php
        $cards = [
            ['Total Products', $stats['total_products'], 'fa-box', 'blue'],
            ['Total Stock', $stats['total_stock'], 'fa-warehouse', 'green'],
            ['Total Sold', $stats['total_sold'], 'fa-chart-line', 'purple'],
            ['Inventory Value', $currency . number_format($stats['inventory_value']), 'fa-dollar-sign', 'yellow'],
            ['Total Sales', $currency . number_format($stats['total_sales']), 'fa-shopping-cart', 'emerald'],
            ['Low Stock Items', $stats['low_stock'], 'fa-exclamation-triangle', 'orange'],
            ['Out of Stock', $stats['out_of_stock'], 'fa-times-circle', 'red'],
            ['Restock Transactions', $stats['total_restocks'], 'fa-sync-alt', 'cyan'],
        ];
        $colors = [
            'blue' => 'bg-blue-50 text-blue-600 border-blue-100',
            'green' => 'bg-green-50 text-green-600 border-green-100',
            'purple' => 'bg-purple-50 text-purple-600 border-purple-100',
            'yellow' => 'bg-yellow-50 text-yellow-600 border-yellow-100',
            'emerald' => 'bg-emerald-50 text-emerald-600 border-emerald-100',
            'orange' => 'bg-orange-50 text-orange-600 border-orange-100',
            'red' => 'bg-red-50 text-red-600 border-red-100',
            'cyan' => 'bg-cyan-50 text-cyan-600 border-cyan-100',
        ];
        foreach ($cards as $card):
        ?>
        <div class="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div class="flex items-center gap-3">
                <div class="w-11 h-11 rounded-lg flex items-center justify-center border <?php echo $colors[$card[3]]; ?>">
                    <i class="fas <?php echo $card[2]; ?> text-xl"></i>
                </div>
                <div>
                    <p class="text-xs text-gray-500 font-medium"><?php echo $card[0]; ?></p>
                    <p class="text-xl font-bold text-gray-800"><?php echo $card[1]; ?></p>
                </div>
            </div>
        </div>
        <?php endforeach; ?>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Best Selling Products -->
        <div class="bg-white rounded-xl border border-gray-200 p-5">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-bold text-gray-800">🏆 Top Selling Products</h3>
                <a href="<?php echo BASE_URL; ?>products.php" class="text-sm text-yellow-600 hover:text-yellow-700 font-medium">View All →</a>
            </div>
            <?php if (empty($best_selling)): ?>
                <p class="text-gray-400 text-center py-8">No sales data yet</p>
            <?php else: ?>
            <div class="space-y-3">
                <?php foreach ($best_selling as $i => $p): ?>
                <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div class="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-700 font-bold text-sm"><?php echo $i + 1; ?></div>
                    <div class="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500"><i class="fas fa-box"></i></div>
                    <div class="flex-1 min-w-0">
                        <p class="font-medium text-gray-800 truncate"><?php echo e($p['product_name']); ?></p>
                        <p class="text-xs text-gray-500"><?php echo e($p['colour']); ?> • <?php echo e($p['size']); ?> • <?php echo e($p['serial_number']); ?></p>
                    </div>
                    <div class="text-right">
                        <p class="font-bold text-green-600"><?php echo $p['total_sold']; ?> sold</p>
                        <p class="text-xs text-gray-500"><?php echo $p['current_quantity']; ?> left</p>
                    </div>
                </div>
                <?php endforeach; ?>
            </div>
            <?php endif; ?>
        </div>

        <!-- Stock Alerts -->
        <div class="bg-white rounded-xl border border-gray-200 p-5">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-bold text-gray-800">⚠️ Stock Alerts</h3>
                <a href="<?php echo BASE_URL; ?>restock.php" class="text-sm text-yellow-600 hover:text-yellow-700 font-medium">Restock →</a>
            </div>
            <?php if (empty($low_stock_products)): ?>
                <p class="text-gray-400 text-center py-8">All products are well stocked!</p>
            <?php else: ?>
            <div class="space-y-3">
                <?php foreach ($low_stock_products as $p):
                    $status = get_stock_status($p['current_quantity'], $low_threshold, get_setting($pdo, 'critical_stock_threshold', 2));
                ?>
                <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div class="px-2 py-1 rounded text-xs font-bold <?php echo $status['color']; ?>">
                        <?php echo $p['current_quantity'] == 0 ? 'OUT' : $p['current_quantity']; ?>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="font-medium text-gray-800 truncate"><?php echo e($p['product_name']); ?></p>
                        <p class="text-xs text-gray-500"><?php echo e($p['colour']); ?> • <?php echo e($p['size']); ?></p>
                    </div>
                    <a href="<?php echo BASE_URL; ?>restock.php?id=<?php echo $p['id']; ?>" class="px-3 py-1.5 bg-yellow-500 text-black text-xs font-bold rounded-lg hover:bg-yellow-400">Restock</a>
                </div>
                <?php endforeach; ?>
            </div>
            <?php endif; ?>
        </div>
    </div>

    <!-- Recent Activities -->
    <div class="bg-white rounded-xl border border-gray-200 p-5">
        <h3 class="text-lg font-bold text-gray-800 mb-4">📋 Recent Activities</h3>
        <div class="space-y-2">
            <?php foreach ($recent_sales as $s): ?>
            <div class="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg">
                <div class="w-2 h-2 rounded-full bg-green-500"></div>
                <span class="text-xs font-bold px-2 py-0.5 rounded bg-green-100 text-green-700">Sold</span>
                <span class="font-medium text-gray-800 text-sm"><?php echo e($s['product_name']); ?></span>
                <span class="text-sm text-gray-500"><?php echo $s['quantity']; ?> units - <?php echo $currency; ?><?php echo number_format($s['total_amount']); ?></span>
                <span class="ml-auto text-xs text-gray-400"><?php echo format_date($s['created_at']); ?></span>
            </div>
            <?php endforeach; ?>
            <?php foreach ($recent_restocks as $r): ?>
            <div class="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg">
                <div class="w-2 h-2 rounded-full bg-yellow-500"></div>
                <span class="text-xs font-bold px-2 py-0.5 rounded bg-yellow-100 text-yellow-700">Restocked</span>
                <span class="font-medium text-gray-800 text-sm"><?php echo e($r['product_name']); ?></span>
                <span class="text-sm text-gray-500">+<?php echo $r['quantity_added']; ?> units</span>
                <span class="ml-auto text-xs text-gray-400"><?php echo format_date($r['created_at']); ?></span>
            </div>
            <?php endforeach; ?>
            <?php if (empty($recent_sales) && empty($recent_restocks)): ?>
                <p class="text-gray-400 text-center py-8">No recent activities</p>
            <?php endif; ?>
        </div>
    </div>
</div>

<?php include __DIR__ . '/includes/footer.php'; ?>
