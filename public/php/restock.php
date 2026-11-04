<?php
/**
 * Restock Inventory Page
 */
require_once __DIR__ . '/includes/functions.php';
require_login();

$page_title = 'Restock Inventory';
$currency = get_setting($pdo, 'currency', 'K');
$low_threshold = get_setting($pdo, 'low_stock_threshold', 5);
$user = current_user();
$error = '';

// Handle restock submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $product_id = intval($_POST['product_id'] ?? 0);
    $quantity = intval($_POST['quantity'] ?? 0);
    $purchase_cost = floatval($_POST['unit_cost'] ?? 0) * $quantity;
    $supplier = trim($_POST['supplier'] ?? '');

    if (!$product_id || $quantity <= 0) {
        $error = 'Please select a product and enter a valid quantity.';
    } else {
        $result = record_restock($pdo, $user['id'], $product_id, $quantity, $purchase_cost, $supplier);
        if ($result['success']) {
            set_flash('success', "Successfully restocked with $quantity units!");
        } else {
            $error = 'Error: ' . $result['error'];
        }
        redirect(BASE_URL . 'restock.php');
    }
}

// Pre-selected product
$selected_product = null;
$preselect_id = $_GET['id'] ?? null;
if ($preselect_id) {
    $selected_product = get_product($pdo, $preselect_id);
}

// Low stock products for quick restock
$low_stock = $pdo->query("SELECT p.*, c.category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.archived_at IS NULL AND p.current_quantity <= $low_threshold ORDER BY p.current_quantity ASC")->fetchAll();

include __DIR__ . '/includes/header.php';
include __DIR__ . '/includes/sidebar.php';
?>

<div class="max-w-3xl mx-auto space-y-6">
    <?php if ($error): ?>
    <div class="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <i class="fas fa-exclamation-circle"></i><span><?php echo e($error); ?></span>
    </div>
    <?php endif; ?>

    <!-- Product Scanner -->
    <div class="bg-white rounded-xl border border-gray-200 p-5">
        <div class="flex items-center gap-3 mb-4">
            <i class="fas fa-sync-alt text-2xl text-yellow-600"></i>
            <h3 class="text-lg font-bold text-gray-800">Find Product to Restock</h3>
        </div>
        <div class="flex gap-3">
            <div class="relative flex-1">
                <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input type="text" id="restockScan"
                       class="w-full pl-10 pr-4 py-4 border-2 border-gray-300 rounded-xl text-xl font-mono focus:ring-2 focus:ring-yellow-500 outline-none"
                       placeholder="Scan barcode or enter serial number..." autofocus>
            </div>
            <button onclick="findProduct()" class="px-6 py-4 btn-gold rounded-xl text-lg">Find</button>
        </div>
        <div id="restockError" class="hidden mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
            <i class="fas fa-exclamation-circle"></i><span id="restockErrorText"></span>
        </div>
    </div>

    <!-- Restock Form -->
    <div id="restockForm" class="<?php echo $selected_product ? '' : 'hidden'; ?> bg-white rounded-xl border border-gray-200 p-5">
        <form method="POST">
            <input type="hidden" name="product_id" id="restockProductId" value="<?php echo $selected_product['id'] ?? ''; ?>">
            
            <div id="productInfo" class="flex items-center gap-4 mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div class="w-14 h-14 bg-yellow-100 rounded-xl flex items-center justify-center">
                    <i class="fas fa-box text-2xl text-yellow-700"></i>
                </div>
                <div class="flex-1">
                    <h4 id="productName" class="text-xl font-bold text-gray-800"><?php echo e($selected_product['product_name'] ?? ''); ?></h4>
                    <p id="productDetails" class="text-sm text-gray-600">Serial: <?php echo e($selected_product['serial_number'] ?? ''); ?> | <?php echo e($selected_product['colour'] ?? ''); ?> | Size: <?php echo e($selected_product['size'] ?? ''); ?></p>
                </div>
                <div class="text-right">
                    <p class="text-sm text-gray-500">Current Stock</p>
                    <p id="currentStock" class="text-2xl font-bold <?php echo ($selected_product['current_quantity'] ?? 0) == 0 ? 'text-red-600' : 'text-green-600'; ?>"><?php echo $selected_product['current_quantity'] ?? 0; ?></p>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1">Quantity Received *</label>
                    <input type="number" name="quantity" id="restockQty"
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg text-xl font-bold focus:ring-2 focus:ring-yellow-500 outline-none"
                           placeholder="e.g. 20" min="1" required>
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1">Unit Cost (<?php echo $currency; ?>)</label>
                    <input type="number" name="unit_cost" id="unitCost"
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg text-xl focus:ring-2 focus:ring-yellow-500 outline-none"
                           placeholder="e.g. 150" min="0" step="0.01" value="<?php echo $selected_product['purchase_price'] ?? ''; ?>">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1">Supplier</label>
                    <input type="text" name="supplier"
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                           placeholder="e.g. Supplier A">
                </div>
            </div>

            <div id="newStockPreview" class="hidden mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <p class="text-lg font-bold text-green-800">New Available Stock: <span id="newStockValue" class="text-2xl">0</span> units</p>
                <p id="totalCostPreview" class="text-sm text-green-700 mt-1"></p>
            </div>

            <button type="submit" class="w-full mt-4 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-xl text-xl shadow-lg hover:from-green-400 hover:to-green-500">
                ✓ Confirm Restock
            </button>
        </form>
    </div>

    <!-- Quick Restock List -->
    <?php if (!$selected_product): ?>
    <div class="bg-white rounded-xl border border-gray-200 p-5">
        <h3 class="text-lg font-bold text-gray-800 mb-4">⚡ Quick Restock - Low Stock Items</h3>
        <div class="space-y-2">
            <?php foreach ($low_stock as $p):
                $status = get_stock_status($p['current_quantity'], $low_threshold, get_setting($pdo, 'critical_stock_threshold', 2));
            ?>
            <a href="<?php echo BASE_URL; ?>restock.php?id=<?php echo $p['id']; ?>"
               class="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg border border-gray-100">
                <div class="px-2 py-1 rounded text-xs font-bold <?php echo $status['color']; ?>"><?php echo $p['current_quantity']; ?></div>
                <div class="flex-1">
                    <p class="font-medium text-gray-800"><?php echo e($p['product_name']); ?></p>
                    <p class="text-xs text-gray-500"><?php echo e($p['colour']); ?> • <?php echo e($p['size']); ?> • <?php echo e($p['serial_number']); ?></p>
                </div>
                <i class="fas fa-sync-alt text-yellow-600"></i>
            </a>
            <?php endforeach; ?>
            <?php if (empty($low_stock)): ?>
            <p class="text-center text-gray-400 py-6">All products are well stocked!</p>
            <?php endif; ?>
        </div>
    </div>
    <?php endif; ?>
</div>

<script>
document.getElementById('restockScan')?.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') { e.preventDefault(); findProduct(); }
});

function findProduct() {
    const serial = document.getElementById('restockScan').value.trim().replace(/[^A-Za-z0-9\-_]/g, '');
    if (!serial) return;
    
    fetch('<?php echo BASE_URL; ?>record_sale.php?ajax=lookup&serial=' + encodeURIComponent(serial))
        .then(r => r.json())
        .then(data => {
            if (data.error) {
                document.getElementById('restockErrorText').textContent = data.error;
                document.getElementById('restockError').classList.remove('hidden');
                return;
            }
            const p = data.product;
            document.getElementById('restockProductId').value = p.id;
            document.getElementById('productName').textContent = p.name;
            document.getElementById('productDetails').textContent = 'Serial: ' + p.serial + ' | ' + p.colour + ' | Size: ' + p.size;
            document.getElementById('currentStock').textContent = p.stock;
            document.getElementById('unitCost').value = p.price;
            document.getElementById('restockForm').classList.remove('hidden');
            document.getElementById('restockScan').value = '';
            document.getElementById('restockQty').focus();
        });
}

document.getElementById('restockQty')?.addEventListener('input', function() {
    const qty = parseInt(this.value) || 0;
    const current = parseInt(document.getElementById('currentStock').textContent) || 0;
    const cost = parseFloat(document.getElementById('unitCost').value) || 0;
    
    if (qty > 0) {
        document.getElementById('newStockPreview').classList.remove('hidden');
        document.getElementById('newStockValue').textContent = current + qty;
        document.getElementById('totalCostPreview').textContent = 'Total Purchase Cost: <?php echo $currency; ?>' + (cost * qty).toLocaleString();
    } else {
        document.getElementById('newStockPreview').classList.add('hidden');
    }
});
</script>

<?php include __DIR__ . '/includes/footer.php'; ?>
