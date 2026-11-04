<?php
/**
 * All Products Page
 */
require_once __DIR__ . '/includes/functions.php';
require_login();

$page_title = 'All Products';
$currency = get_setting($pdo, 'currency', 'K');
$low_threshold = get_setting($pdo, 'low_stock_threshold', 5);
$critical_threshold = get_setting($pdo, 'critical_stock_threshold', 2);

// Filters
$search = trim($_GET['search'] ?? '');
$category_filter = $_GET['category'] ?? '';
$stock_filter = $_GET['stock'] ?? '';
$size_filter = $_GET['size'] ?? '';

// Build query
$where = ["p.archived_at IS NULL"];
$params = [];

if ($search) {
    $where[] = "(p.product_name LIKE ? OR p.serial_number LIKE ? OR c.category_name LIKE ? OR p.colour LIKE ? OR p.size LIKE ?)";
    $s = "%$search%";
    $params = array_merge($params, [$s, $s, $s, $s, $s]);
}
if ($category_filter) { $where[] = "c.category_name = ?"; $params[] = $category_filter; }
if ($size_filter) { $where[] = "p.size = ?"; $params[] = $size_filter; }
if ($stock_filter === 'in_stock') { $where[] = "p.current_quantity > $low_threshold"; }
elseif ($stock_filter === 'low') { $where[] = "p.current_quantity > 0 AND p.current_quantity <= $low_threshold"; }
elseif ($stock_filter === 'critical') { $where[] = "p.current_quantity > 0 AND p.current_quantity <= $critical_threshold"; }
elseif ($stock_filter === 'out') { $where[] = "p.current_quantity = 0"; }

$where_clause = implode(' AND ', $where);
$sql = "SELECT p.*, c.category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE $where_clause ORDER BY p.created_at DESC";
$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$products = $stmt->fetchAll();

$categories = $pdo->query("SELECT DISTINCT category_name FROM categories ORDER BY category_name")->fetchAll(PDO::FETCH_COLUMN);
$sizes = $pdo->query("SELECT DISTINCT size FROM products WHERE archived_at IS NULL ORDER BY size")->fetchAll(PDO::FETCH_COLUMN);

include __DIR__ . '/includes/header.php';
include __DIR__ . '/includes/sidebar.php';
?>

<div class="space-y-4">
    <!-- Search & Filters -->
    <div class="bg-white rounded-xl border border-gray-200 p-4">
        <form method="GET" class="space-y-3">
            <div class="flex flex-col lg:flex-row gap-3">
                <div class="relative flex-1">
                    <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                    <input type="text" name="search" value="<?php echo e($search); ?>"
                           placeholder="Search by name, serial number, category, colour, size..."
                           class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none">
                </div>
                <button type="submit" class="px-6 py-3 btn-gold rounded-lg text-lg">Search</button>
                <a href="<?php echo BASE_URL; ?>products.php" class="px-4 py-3 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 font-medium text-sm text-center">Reset</a>
            </div>
            <div class="flex flex-wrap gap-2">
                <select name="category" onchange="this.form.submit()" class="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option value="">All Categories</option>
                    <?php foreach ($categories as $c): ?>
                    <option value="<?php echo e($c); ?>" <?php echo $category_filter === $c ? 'selected' : ''; ?>><?php echo e($c); ?></option>
                    <?php endforeach; ?>
                </select>
                <select name="stock" onchange="this.form.submit()" class="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option value="">All Stock Levels</option>
                    <option value="in_stock" <?php echo $stock_filter === 'in_stock' ? 'selected' : ''; ?>>Fully Stocked</option>
                    <option value="low" <?php echo $stock_filter === 'low' ? 'selected' : ''; ?>>Low Stock</option>
                    <option value="critical" <?php echo $stock_filter === 'critical' ? 'selected' : ''; ?>>Critically Low</option>
                    <option value="out" <?php echo $stock_filter === 'out' ? 'selected' : ''; ?>>Out of Stock</option>
                </select>
                <select name="size" onchange="this.form.submit()" class="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option value="">All Sizes</option>
                    <?php foreach ($sizes as $s): ?>
                    <option value="<?php echo e($s); ?>" <?php echo $size_filter === $s ? 'selected' : ''; ?>><?php echo e($s); ?></option>
                    <?php endforeach; ?>
                </select>
            </div>
        </form>
    </div>

    <!-- Results Count -->
    <div class="flex items-center justify-between">
        <p class="text-sm text-gray-600">Showing <span class="font-bold"><?php echo count($products); ?></span> product(s)</p>
        <a href="<?php echo BASE_URL; ?>add_product.php" class="px-4 py-2 btn-gold rounded-lg text-sm">+ Add New Product</a>
    </div>

    <!-- Products Table -->
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th class="text-left px-4 py-3 font-semibold text-gray-600">Product</th>
                        <th class="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Serial</th>
                        <th class="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Category</th>
                        <th class="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Colour/Size</th>
                        <th class="text-center px-4 py-3 font-semibold text-gray-600">Stock</th>
                        <th class="text-right px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Price</th>
                        <th class="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                        <th class="text-center px-4 py-3 font-semibold text-gray-600">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                    <?php foreach ($products as $p):
                        $status = get_stock_status($p['current_quantity'], $low_threshold, $critical_threshold);
                    ?>
                    <tr class="hover:bg-gray-50">
                        <td class="px-4 py-3">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <?php if ($p['product_image']): ?>
                                        <img src="<?php echo BASE_URL . 'uploads/products/' . e($p['product_image']); ?>" class="w-10 h-10 rounded-lg object-cover">
                                    <?php else: ?>
                                        <i class="fas fa-box text-gray-400"></i>
                                    <?php endif; ?>
                                </div>
                                <span class="font-medium text-gray-800"><?php echo e($p['product_name']); ?></span>
                            </div>
                        </td>
                        <td class="px-4 py-3 text-gray-600 hidden md:table-cell font-mono text-xs"><?php echo e($p['serial_number']); ?></td>
                        <td class="px-4 py-3 text-gray-600 hidden lg:table-cell"><?php echo e($p['category_name']); ?></td>
                        <td class="px-4 py-3 text-gray-600 hidden lg:table-cell"><?php echo e($p['colour']); ?> / <?php echo e($p['size']); ?></td>
                        <td class="px-4 py-3 text-center"><span class="font-bold"><?php echo $p['current_quantity']; ?></span><span class="text-gray-400 text-xs">/<?php echo $p['original_quantity']; ?></span></td>
                        <td class="px-4 py-3 text-right hidden md:table-cell font-medium"><?php echo $currency; ?><?php echo number_format($p['selling_price']); ?></td>
                        <td class="px-4 py-3 text-center"><span class="px-2 py-1 rounded-full text-xs font-bold <?php echo $status['color']; ?>"><?php echo $status['label']; ?></span></td>
                        <td class="px-4 py-3">
                            <div class="flex items-center justify-center gap-1">
                                <a href="<?php echo BASE_URL; ?>product_detail.php?id=<?php echo $p['id']; ?>" class="p-1.5 hover:bg-blue-50 rounded text-blue-600" title="View"><i class="fas fa-eye"></i></a>
                                <a href="<?php echo BASE_URL; ?>add_product.php?edit=<?php echo $p['id']; ?>" class="p-1.5 hover:bg-yellow-50 rounded text-yellow-600" title="Edit"><i class="fas fa-edit"></i></a>
                                <a href="<?php echo BASE_URL; ?>barcode.php?id=<?php echo $p['id']; ?>" target="_blank" class="p-1.5 hover:bg-gray-100 rounded text-gray-600" title="Barcode"><i class="fas fa-barcode"></i></a>
                                <a href="<?php echo BASE_URL; ?>restock.php?id=<?php echo $p['id']; ?>" class="p-1.5 hover:bg-green-50 rounded text-green-600" title="Restock"><i class="fas fa-sync-alt"></i></a>
                            </div>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                    <?php if (empty($products)): ?>
                    <tr><td colspan="8" class="px-4 py-12 text-center text-gray-400">No products found.</td></tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>

<?php include __DIR__ . '/includes/footer.php'; ?>
