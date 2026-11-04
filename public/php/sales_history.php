<?php
/**
 * Sales History Page
 */
require_once __DIR__ . '/includes/functions.php';
require_login();

$page_title = 'Sales History';
$currency = get_setting($pdo, 'currency', 'K');

// Handle sale reversal
if (isset($_POST['reverse_sale']) && $_SESSION['role'] === 'admin') {
    $sale_id = intval($_POST['sale_id'] ?? 0);
    $result = reverse_sale($pdo, $sale_id, $_SESSION['user_id']);
    if ($result['success']) {
        set_flash('success', 'Sale reversed successfully. Stock has been restored.');
    } else {
        set_flash('error', 'Error reversing sale: ' . $result['error']);
    }
    redirect(BASE_URL . 'sales_history.php');
}

// Filters
$search = trim($_GET['search'] ?? '');
$date_filter = $_GET['date'] ?? '';
$date_from = $_GET['from'] ?? '';
$date_to = $_GET['to'] ?? '';

$where = ["1=1"];
$params = [];

if ($search) {
    $where[] = "(s.transaction_reference LIKE ? OR si.product_name LIKE ?)";
    $s = "%$search%";
    $params = array_merge($params, [$s, $s]);
}

if ($date_filter === 'today') { $where[] = "DATE(s.created_at) = CURDATE()"; }
elseif ($date_filter === 'yesterday') { $where[] = "DATE(s.created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)"; }
elseif ($date_filter === 'week') { $where[] = "s.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)"; }
elseif ($date_filter === 'month') { $where[] = "MONTH(s.created_at) = MONTH(NOW()) AND YEAR(s.created_at) = YEAR(NOW())"; }
elseif ($date_filter === 'year') { $where[] = "YEAR(s.created_at) = YEAR(NOW())"; }
elseif ($date_filter === 'custom' && $date_from && $date_to) {
    $where[] = "DATE(s.created_at) BETWEEN ? AND ?";
    $params = array_merge($params, [$date_from, $date_to]);
}

$where_clause = implode(' AND ', $where);
$sql = "SELECT DISTINCT s.* FROM sales s LEFT JOIN sale_items si ON s.id = si.sale_id WHERE $where_clause ORDER BY s.created_at DESC";
$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$sales = $stmt->fetchAll();

// Get sale items for each sale
foreach ($sales as &$sale) {
    $stmt = $pdo->prepare("SELECT si.*, p.serial_number FROM sale_items si LEFT JOIN products p ON si.product_id = p.id WHERE si.sale_id = ?");
    $stmt->execute([$sale['id']]);
    $sale['items'] = $stmt->fetchAll();
}

// Summary stats
$total_revenue = array_sum(array_map(fn($s) => $s['status'] === 'completed' ? $s['total_amount'] : 0, $sales));
$total_items = 0;
foreach ($sales as $s) { if ($s['status'] === 'completed') foreach ($s['items'] as $i) $total_items += $i['quantity']; }

// CSV Export
if (isset($_GET['export']) && $_GET['export'] === 'csv') {
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="sales-history-' . date('Y-m-d') . '.csv"');
    $out = fopen('php://output', 'w');
    fputcsv($out, ['Reference', 'Date', 'Product', 'Serial', 'Qty', 'Unit Price', 'Subtotal', 'Total', 'Status']);
    foreach ($sales as $sale) {
        foreach ($sale['items'] as $item) {
            fputcsv($out, [$sale['transaction_reference'], $sale['created_at'], $item['product_name'], $item['serial_number'] ?? '', $item['quantity'], $item['unit_price'], $item['subtotal'], $sale['total_amount'], $sale['status']]);
        }
    }
    fclose($out);
    exit;
}

include __DIR__ . '/includes/header.php';
include __DIR__ . '/includes/sidebar.php';
?>

<div class="space-y-4">
    <!-- Filters -->
    <div class="bg-white rounded-xl border border-gray-200 p-4">
        <form method="GET" class="space-y-3">
            <div class="flex flex-col lg:flex-row gap-3">
                <div class="relative flex-1">
                    <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                    <input type="text" name="search" value="<?php echo e($search); ?>"
                           placeholder="Search by reference, product name..."
                           class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-yellow-500 outline-none">
                </div>
                <a href="<?php echo BASE_URL; ?>sales_history.php?export=csv&<?php echo http_build_query($_GET); ?>" class="px-4 py-3 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 font-medium text-sm flex items-center gap-2">
                    <i class="fas fa-download"></i> Export CSV
                </a>
            </div>
            <div class="flex flex-wrap gap-2 items-center">
                <i class="fas fa-calendar text-gray-500"></i>
                <?php foreach (['today'=>'Today','yesterday'=>'Yesterday','week'=>'This Week','month'=>'This Month','year'=>'This Year','custom'=>'Custom'] as $val => $label): ?>
                <button type="submit" name="date" value="<?php echo $val; ?>"
                        class="px-3 py-1.5 rounded-lg text-sm font-medium capitalize <?php echo $date_filter === $val ? 'bg-yellow-500 text-black' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'; ?>">
                    <?php echo $label; ?>
                </button>
                <?php endforeach; ?>
                <?php if ($date_filter === 'custom'): ?>
                <input type="date" name="from" value="<?php echo e($date_from); ?>" class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm">
                <span class="text-gray-400">to</span>
                <input type="date" name="to" value="<?php echo e($date_to); ?>" class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm">
                <?php endif; ?>
            </div>
        </form>
    </div>

    <!-- Summary -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p class="text-sm text-gray-500">Total Transactions</p>
            <p class="text-2xl font-bold text-gray-800"><?php echo count($sales); ?></p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p class="text-sm text-gray-500">Total Revenue</p>
            <p class="text-2xl font-bold text-green-600"><?php echo $currency . number_format($total_revenue); ?></p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p class="text-sm text-gray-500">Items Sold</p>
            <p class="text-2xl font-bold text-blue-600"><?php echo $total_items; ?></p>
        </div>
    </div>

    <!-- Sales Table -->
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th class="text-left px-4 py-3 font-semibold text-gray-600">Reference</th>
                        <th class="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                        <th class="text-left px-4 py-3 font-semibold text-gray-600">Products</th>
                        <th class="text-right px-4 py-3 font-semibold text-gray-600">Amount</th>
                        <th class="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                        <?php if ($_SESSION['role'] === 'admin'): ?>
                        <th class="text-center px-4 py-3 font-semibold text-gray-600">Actions</th>
                        <?php endif; ?>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                    <?php foreach ($sales as $sale): ?>
                    <tr class="<?php echo $sale['status'] === 'reversed' ? 'opacity-60' : ''; ?> hover:bg-gray-50">
                        <td class="px-4 py-3 font-mono text-xs font-bold text-gray-700"><?php echo e($sale['transaction_reference']); ?></td>
                        <td class="px-4 py-3 text-gray-600"><?php echo format_datetime($sale['created_at']); ?></td>
                        <td class="px-4 py-3">
                            <?php foreach ($sale['items'] as $item): ?>
                            <p class="text-gray-700"><?php echo e($item['product_name']); ?> <span class="text-gray-400">×<?php echo $item['quantity']; ?></span></p>
                            <?php endforeach; ?>
                        </td>
                        <td class="px-4 py-3 text-right font-bold text-gray-800"><?php echo $currency . number_format($sale['total_amount']); ?></td>
                        <td class="px-4 py-3 text-center">
                            <span class="px-2 py-1 rounded-full text-xs font-bold <?php echo $sale['status'] === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'; ?>">
                                <?php echo ucfirst($sale['status']); ?>
                            </span>
                        </td>
                        <?php if ($_SESSION['role'] === 'admin'): ?>
                        <td class="px-4 py-3 text-center">
                            <?php if ($sale['status'] === 'completed'): ?>
                            <form method="POST" onsubmit="return confirm('Reverse this sale? Stock will be restored.');" class="inline">
                                <input type="hidden" name="sale_id" value="<?php echo $sale['id']; ?>">
                                <button type="submit" name="reverse_sale" class="p-1.5 hover:bg-red-50 rounded text-red-500" title="Reverse">
                                    <i class="fas fa-undo"></i>
                                </button>
                            </form>
                            <?php endif; ?>
                        </td>
                        <?php endif; ?>
                    </tr>
                    <?php endforeach; ?>
                    <?php if (empty($sales)): ?>
                    <tr><td colspan="6" class="px-4 py-12 text-center text-gray-400">No sales found.</td></tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>

<?php include __DIR__ . '/includes/footer.php'; ?>
