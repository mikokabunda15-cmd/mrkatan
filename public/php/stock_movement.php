<?php
/**
 * Stock Movement History Page
 */
require_once __DIR__ . '/includes/functions.php';
require_login();

$page_title = 'Stock Movement History';
$currency = get_setting($pdo, 'currency', 'K');

// Filters
$search = trim($_GET['search'] ?? '');
$type_filter = $_GET['type'] ?? '';

$where = ["1=1"];
$params = [];

if ($search) {
    $where[] = "(sm.notes LIKE ? OR p.product_name LIKE ? OR p.serial_number LIKE ?)";
    $s = "%$search%";
    $params = array_merge($params, [$s, $s, $s]);
}
if ($type_filter) { $where[] = "sm.movement_type = ?"; $params[] = $type_filter; }

$where_clause = implode(' AND ', $where);
$sql = "SELECT sm.*, p.product_name, p.serial_number FROM stock_movements sm 
        JOIN products p ON sm.product_id = p.id 
        WHERE $where_clause ORDER BY sm.created_at DESC LIMIT 200";
$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$movements = $stmt->fetchAll();

// Summary
$total_added = array_sum(array_map(fn($m) => $m['quantity_changed'] > 0 ? $m['quantity_changed'] : 0, $movements));
$total_removed = array_sum(array_map(fn($m) => $m['quantity_changed'] < 0 ? $m['quantity_changed'] : 0, $movements));

// CSV Export
if (isset($_GET['export']) && $_GET['export'] === 'csv') {
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="stock-movements-' . date('Y-m-d') . '.csv"');
    $out = fopen('php://output', 'w');
    fputcsv($out, ['Date', 'Product', 'Serial', 'Type', 'Change', 'Previous', 'New', 'Notes']);
    foreach ($movements as $m) {
        fputcsv($out, [$m['created_at'], $m['product_name'], $m['serial_number'], $m['movement_type'], $m['quantity_changed'], $m['previous_quantity'], $m['new_quantity'], $m['notes']]);
    }
    fclose($out);
    exit;
}

include __DIR__ . '/includes/header.php';
include __DIR__ . '/includes/sidebar.php';
?>

<div class="space-y-4">
    <div class="bg-white rounded-xl border border-gray-200 p-4">
        <form method="GET" class="flex flex-col lg:flex-row gap-3">
            <div class="relative flex-1">
                <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input type="text" name="search" value="<?php echo e($search); ?>" placeholder="Search by product, serial, or notes..."
                       class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-yellow-500 outline-none">
            </div>
            <select name="type" onchange="this.form.submit()" class="px-4 py-3 border border-gray-300 rounded-lg">
                <option value="">All Types</option>
                <option value="sale" <?php echo $type_filter === 'sale' ? 'selected' : ''; ?>>Sales</option>
                <option value="restock" <?php echo $type_filter === 'restock' ? 'selected' : ''; ?>>Restocks</option>
                <option value="adjustment" <?php echo $type_filter === 'adjustment' ? 'selected' : ''; ?>>Adjustments</option>
            </select>
            <a href="<?php echo BASE_URL; ?>stock_movement.php?export=csv&<?php echo http_build_query($_GET); ?>" class="px-4 py-3 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 text-sm flex items-center gap-2">
                <i class="fas fa-download"></i> CSV
            </a>
        </form>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p class="text-sm text-gray-500">Total Movements</p>
            <p class="text-2xl font-bold text-gray-800"><?php echo count($movements); ?></p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p class="text-sm text-gray-500">Stock Added</p>
            <p class="text-2xl font-bold text-green-600">+<?php echo $total_added; ?></p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p class="text-sm text-gray-500">Stock Removed</p>
            <p class="text-2xl font-bold text-red-600"><?php echo $total_removed; ?></p>
        </div>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="bg-gray-50 border-b">
                    <tr>
                        <th class="text-left px-4 py-3 font-semibold text-gray-600">Date & Time</th>
                        <th class="text-left px-4 py-3 font-semibold text-gray-600">Product</th>
                        <th class="text-center px-4 py-3 font-semibold text-gray-600">Type</th>
                        <th class="text-center px-4 py-3 font-semibold text-gray-600">Change</th>
                        <th class="text-center px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Previous → New</th>
                        <th class="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Notes</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                    <?php foreach ($movements as $m):
                        $type_colors = ['sale' => 'bg-red-100 text-red-700', 'restock' => 'bg-green-100 text-green-700', 'adjustment' => 'bg-blue-100 text-blue-700'];
                    ?>
                    <tr class="hover:bg-gray-50">
                        <td class="px-4 py-3 text-gray-600 whitespace-nowrap">
                            <div><?php echo format_date($m['created_at']); ?></div>
                            <div class="text-xs text-gray-400"><?php echo date('H:i', strtotime($m['created_at'])); ?></div>
                        </td>
                        <td class="px-4 py-3">
                            <p class="font-medium text-gray-800"><?php echo e($m['product_name']); ?></p>
                            <p class="text-xs text-gray-500 font-mono"><?php echo e($m['serial_number']); ?></p>
                        </td>
                        <td class="px-4 py-3 text-center">
                            <span class="px-2 py-0.5 rounded-full text-xs font-bold <?php echo $type_colors[$m['movement_type']] ?? 'bg-gray-100 text-gray-700'; ?>">
                                <?php echo ucfirst($m['movement_type']); ?>
                            </span>
                        </td>
                        <td class="px-4 py-3 text-center">
                            <span class="font-bold <?php echo $m['quantity_changed'] > 0 ? 'text-green-600' : 'text-red-600'; ?>">
                                <?php echo $m['quantity_changed'] > 0 ? '+' : ''; ?><?php echo $m['quantity_changed']; ?>
                            </span>
                        </td>
                        <td class="px-4 py-3 text-center text-gray-500 hidden md:table-cell"><?php echo $m['previous_quantity']; ?> → <span class="font-bold text-gray-700"><?php echo $m['new_quantity']; ?></span></td>
                        <td class="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell max-w-[200px] truncate"><?php echo e($m['notes']); ?></td>
                    </tr>
                    <?php endforeach; ?>
                    <?php if (empty($movements)): ?>
                    <tr><td colspan="6" class="px-4 py-12 text-center text-gray-400">No stock movements found.</td></tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>

<?php include __DIR__ . '/includes/footer.php'; ?>
