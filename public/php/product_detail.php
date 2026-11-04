<?php
/**
 * Product Detail Page
 */
require_once __DIR__ . '/includes/functions.php';
require_login();

$id = intval($_GET['id'] ?? 0);
$product = get_product($pdo, $id);
if (!$product) { redirect(BASE_URL . 'products.php'); }

$page_title = $product['product_name'];
$currency = get_setting($pdo, 'currency', 'K');
$low_threshold = get_setting($pdo, 'low_stock_threshold', 5);
$critical_threshold = get_setting($pdo, 'critical_stock_threshold', 2);
$status = get_stock_status($product['current_quantity'], $low_threshold, $critical_threshold);

// Product sales
$stmt = $pdo->prepare("SELECT s.*, si.quantity, si.subtotal FROM sales s JOIN sale_items si ON s.id = si.sale_id WHERE si.product_id = ? AND s.status = 'completed' ORDER BY s.created_at DESC");
$stmt->execute([$id]);
$product_sales = $stmt->fetchAll();
$total_revenue = array_sum(array_column($product_sales, 'subtotal'));

// Stock movements
$stmt = $pdo->prepare("SELECT * FROM stock_movements WHERE product_id = ? ORDER BY created_at DESC");
$stmt->execute([$id]);
$movements = $stmt->fetchAll();

// Handle archive
if (isset($_POST['archive']) && $_SESSION['role'] === 'admin') {
    $pdo->prepare("UPDATE products SET archived_at = NOW() WHERE id = ?")->execute([$id]);
    set_flash('success', 'Product archived successfully.');
    redirect(BASE_URL . 'products.php');
}

$tab = $_GET['tab'] ?? 'overview';

include __DIR__ . '/includes/header.php';
include __DIR__ . '/includes/sidebar.php';
?>

<div class="space-y-6">
    <a href="<?php echo BASE_URL; ?>products.php" class="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 font-medium">
        <i class="fas fa-arrow-left"></i> Back to Inventory
    </a>

    <!-- Product Header -->
    <div class="bg-white rounded-xl border border-gray-200 p-6">
        <div class="flex flex-col md:flex-row gap-6">
            <div class="w-full md:w-48 h-48 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <?php if ($product['product_image']): ?>
                    <img src="<?php echo BASE_URL . 'uploads/products/' . e($product['product_image']); ?>" class="w-full h-full object-cover rounded-xl">
                <?php else: ?>
                    <i class="fas fa-box text-5xl text-gray-300"></i>
                <?php endif; ?>
            </div>
            <div class="flex-1">
                <div class="flex items-start justify-between">
                    <div>
                        <h1 class="text-2xl font-bold text-gray-800"><?php echo e($product['product_name']); ?></h1>
                        <p class="text-gray-500 font-mono mt-1">Serial: <?php echo e($product['serial_number']); ?></p>
                    </div>
                    <span class="px-3 py-1 rounded-full text-sm font-bold <?php echo $status['color']; ?>"><?php echo $status['label']; ?></span>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div><p class="text-xs text-gray-500">Category</p><p class="font-medium"><?php echo e($product['category_name']); ?></p></div>
                    <div><p class="text-xs text-gray-500">Colour</p><p class="font-medium"><?php echo e($product['colour']); ?></p></div>
                    <div><p class="text-xs text-gray-500">Size</p><p class="font-medium"><?php echo e($product['size']); ?></p></div>
                    <div><p class="text-xs text-gray-500">Selling Price</p><p class="font-bold text-green-600 text-lg"><?php echo $currency . number_format($product['selling_price']); ?></p></div>
                </div>
                <div class="flex flex-wrap gap-2 mt-4">
                    <a href="<?php echo BASE_URL; ?>add_product.php?edit=<?php echo $id; ?>" class="flex items-center gap-1 px-3 py-2 btn-gold rounded-lg text-sm"><i class="fas fa-edit"></i> Edit</a>
                    <a href="<?php echo BASE_URL; ?>restock.php?id=<?php echo $id; ?>" class="flex items-center gap-1 px-3 py-2 bg-green-500 text-white font-bold rounded-lg text-sm hover:bg-green-400"><i class="fas fa-sync-alt"></i> Restock</a>
                    <a href="<?php echo BASE_URL; ?>barcode.php?id=<?php echo $id; ?>" target="_blank" class="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"><i class="fas fa-barcode"></i> Print Barcode</a>
                    <?php if ($_SESSION['role'] === 'admin'): ?>
                    <form method="POST" onsubmit="return confirm('Archive this product?')" class="inline">
                        <button type="submit" name="archive" class="flex items-center gap-1 px-3 py-2 border border-red-300 rounded-lg text-sm text-red-600 hover:bg-red-50"><i class="fas fa-archive"></i> Archive</button>
                    </form>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <i class="fas fa-box text-blue-500 text-xl mb-1"></i>
            <p class="text-xs text-gray-500">Original Qty</p>
            <p class="text-xl font-bold"><?php echo $product['original_quantity']; ?></p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <i class="fas fa-warehouse text-green-500 text-xl mb-1"></i>
            <p class="text-xs text-gray-500">Available</p>
            <p class="text-xl font-bold"><?php echo $product['current_quantity']; ?></p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <i class="fas fa-chart-line text-purple-500 text-xl mb-1"></i>
            <p class="text-xs text-gray-500">Total Sold</p>
            <p class="text-xl font-bold"><?php echo $product['total_sold']; ?></p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <i class="fas fa-dollar-sign text-yellow-500 text-xl mb-1"></i>
            <p class="text-xs text-gray-500">Sales Revenue</p>
            <p class="text-xl font-bold text-green-600"><?php echo $currency . number_format($total_revenue); ?></p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <i class="fas fa-coins text-blue-500 text-xl mb-1"></i>
            <p class="text-xs text-gray-500">Stock Value</p>
            <p class="text-xl font-bold text-blue-600"><?php echo $currency . number_format($product['current_quantity'] * $product['purchase_price']); ?></p>
        </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-2 border-b border-gray-200">
        <?php foreach (['overview'=>'Overview','sales'=>'Sales History ('.count($product_sales).')','movement'=>'Stock Movement ('.count($movements).')'] as $t => $label): ?>
        <a href="?id=<?php echo $id; ?>&tab=<?php echo $t; ?>"
           class="px-4 py-2 font-medium text-sm border-b-2 <?php echo $tab === $t ? 'border-yellow-500 text-yellow-700' : 'border-transparent text-gray-500 hover:text-gray-700'; ?>">
            <?php echo $label; ?>
        </a>
        <?php endforeach; ?>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 p-5">
        <?php if ($tab === 'overview'): ?>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="p-4 bg-gray-50 rounded-lg"><p class="text-sm text-gray-500">Purchase Price</p><p class="text-lg font-bold"><?php echo $currency . number_format($product['purchase_price']); ?></p></div>
            <div class="p-4 bg-gray-50 rounded-lg"><p class="text-sm text-gray-500">Selling Price</p><p class="text-lg font-bold text-green-600"><?php echo $currency . number_format($product['selling_price']); ?></p></div>
            <div class="p-4 bg-gray-50 rounded-lg"><p class="text-sm text-gray-500">Profit per Unit</p><p class="text-lg font-bold text-emerald-600"><?php echo $currency . number_format($product['selling_price'] - $product['purchase_price']); ?></p></div>
            <div class="p-4 bg-gray-50 rounded-lg"><p class="text-sm text-gray-500">Min Stock Level</p><p class="text-lg font-bold"><?php echo $product['minimum_stock_level']; ?></p></div>
            <div class="p-4 bg-gray-50 rounded-lg flex items-center gap-3"><i class="fas fa-calendar text-gray-400"></i><div><p class="text-sm text-gray-500">Date Added</p><p class="font-medium"><?php echo format_date($product['created_at']); ?></p></div></div>
            <div class="p-4 bg-gray-50 rounded-lg flex items-center gap-3"><i class="fas fa-calendar text-gray-400"></i><div><p class="text-sm text-gray-500">Last Updated</p><p class="font-medium"><?php echo format_date($product['updated_at']); ?></p></div></div>
            <?php if ($product['last_restocked_at']): ?>
            <div class="p-4 bg-gray-50 rounded-lg flex items-center gap-3"><i class="fas fa-sync-alt text-green-500"></i><div><p class="text-sm text-gray-500">Last Restocked</p><p class="font-medium"><?php echo format_date($product['last_restocked_at']); ?></p></div></div>
            <?php endif; ?>
        </div>

        <?php elseif ($tab === 'sales'): ?>
        <?php if (empty($product_sales)): ?>
            <p class="text-center text-gray-400 py-8">No sales recorded for this product.</p>
        <?php else: ?>
        <div class="space-y-2">
            <?php foreach ($product_sales as $s): ?>
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                    <p class="font-medium text-gray-800"><?php echo e($s['transaction_reference']); ?></p>
                    <p class="text-xs text-gray-500"><?php echo format_datetime($s['created_at']); ?></p>
                </div>
                <div class="text-right">
                    <p class="font-bold"><?php echo $s['quantity']; ?> units</p>
                    <p class="text-sm text-green-600"><?php echo $currency . number_format($s['subtotal']); ?></p>
                </div>
            </div>
            <?php endforeach; ?>
        </div>
        <?php endif; ?>

        <?php elseif ($tab === 'movement'): ?>
        <?php if (empty($movements)): ?>
            <p class="text-center text-gray-400 py-8">No stock movements recorded.</p>
        <?php else: ?>
        <div class="space-y-2">
            <?php foreach ($movements as $m):
                $type_colors = ['sale' => 'bg-red-100 text-red-700', 'restock' => 'bg-green-100 text-green-700', 'adjustment' => 'bg-blue-100 text-blue-700'];
            ?>
            <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span class="px-2 py-0.5 rounded text-xs font-bold <?php echo $type_colors[$m['movement_type']] ?? 'bg-gray-100'; ?>"><?php echo ucfirst($m['movement_type']); ?></span>
                <span class="font-bold <?php echo $m['quantity_changed'] > 0 ? 'text-green-600' : 'text-red-600'; ?>"><?php echo $m['quantity_changed'] > 0 ? '+' : ''; ?><?php echo $m['quantity_changed']; ?></span>
                <span class="text-sm text-gray-500">(<?php echo $m['previous_quantity']; ?> → <?php echo $m['new_quantity']; ?>)</span>
                <span class="text-xs text-gray-400 ml-auto"><?php echo format_date($m['created_at']); ?></span>
            </div>
            <?php endforeach; ?>
        </div>
        <?php endif; ?>
        <?php endif; ?>
    </div>
</div>

<?php include __DIR__ . '/includes/footer.php'; ?>
