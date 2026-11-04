<?php
/**
 * Record Sale Page
 */
require_once __DIR__ . '/includes/functions.php';
require_login();

$page_title = 'Record a Sale';
$currency = get_setting($pdo, 'currency', 'K');
$user = current_user();

// Handle AJAX product lookup
if (isset($_GET['ajax']) && $_GET['ajax'] === 'lookup') {
    header('Content-Type: application/json');
    $serial = trim($_GET['serial'] ?? '');
    // Keep full serial number (alphanumeric, hyphens, underscores)
    $serial = preg_replace('/[^A-Za-z0-9\-_]/', '', $serial);
    
    if (empty($serial)) {
        echo json_encode(['error' => 'Please enter a serial number.']);
        exit;
    }
    
    $product = get_product_by_serial($pdo, $serial);
    if (!$product) {
        echo json_encode(['error' => 'Product not found. Please check the barcode or serial number.']);
        exit;
    }
    if ($product['current_quantity'] <= 0) {
        echo json_encode(['error' => '"' . $product['product_name'] . '" is out of stock.']);
        exit;
    }
    
    echo json_encode([
        'success' => true,
        'product' => [
            'id' => $product['id'],
            'name' => $product['product_name'],
            'serial' => $product['serial_number'],
            'colour' => $product['colour'],
            'size' => $product['size'],
            'stock' => $product['current_quantity'],
            'price' => $product['selling_price'],
        ]
    ]);
    exit;
}

// Handle sale submission
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['confirm_sale'])) {
    $items = json_decode($_POST['cart_items'] ?? '[]', true);
    
    if (empty($items)) {
        set_flash('error', 'Cart is empty. Please add items before confirming.');
        redirect(BASE_URL . 'record_sale.php');
    }
    
    // Validate items
    $sale_items = [];
    foreach ($items as $item) {
        $product = get_product($pdo, $item['product_id']);
        if (!$product || $product['current_quantity'] < $item['quantity']) {
            set_flash('error', 'Insufficient stock for "' . ($product['product_name'] ?? 'Unknown') . '".');
            redirect(BASE_URL . 'record_sale.php');
        }
        $sale_items[] = [
            'product_id' => $item['product_id'],
            'quantity' => intval($item['quantity']),
            'unit_price' => floatval($product['selling_price']),
        ];
    }
    
    $result = record_sale($pdo, $user['id'], $sale_items);
    if ($result['success']) {
        set_flash('success', "SALE RECORDED SUCCESSFULLY! Reference: {$result['reference']} | Total: {$currency}" . number_format($result['total']));
    } else {
        set_flash('error', 'Error recording sale: ' . $result['error']);
    }
    redirect(BASE_URL . 'record_sale.php');
}

include __DIR__ . '/includes/header.php';
include __DIR__ . '/includes/sidebar.php';
?>

<div class="max-w-5xl mx-auto space-y-6">
    <!-- Scanner -->
    <div class="bg-white rounded-xl border border-gray-200 p-5">
        <div class="flex items-center gap-3 mb-4">
            <i class="fas fa-barcode text-2xl text-yellow-600"></i>
            <h3 class="text-lg font-bold text-gray-800">Scan Barcode or Enter Serial Number</h3>
        </div>
        <div class="flex gap-3">
            <div class="relative flex-1">
                <i class="fas fa-barcode absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input type="text" id="scanInput"
                       class="w-full pl-10 pr-4 py-4 border-2 border-gray-300 rounded-xl text-xl font-mono focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
                       placeholder="Scan barcode or type serial number..." autofocus>
            </div>
            <button onclick="lookupProduct()" class="px-6 py-4 btn-gold rounded-xl text-lg">
                <i class="fas fa-search mr-2"></i>Find
            </button>
        </div>
        <div id="scanError" class="hidden mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
            <i class="fas fa-exclamation-circle"></i><span id="scanErrorText"></span>
        </div>
        <p class="text-sm text-gray-500 mt-2">💡 Tip: Simply scan the barcode with a USB scanner. The serial number will be read automatically.</p>
    </div>

    <!-- Cart -->
    <div id="cartSection" class="hidden bg-white rounded-xl border border-gray-200 p-5">
        <div class="flex items-center gap-3 mb-4">
            <i class="fas fa-shopping-cart text-2xl text-yellow-600"></i>
            <h3 class="text-lg font-bold text-gray-800">Current Transaction (<span id="cartCount">0</span> items)</h3>
        </div>
        <div id="cartItems" class="space-y-3"></div>
        
        <!-- Total -->
        <div class="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
            <div>
                <p class="text-sm text-gray-500">Total Items: <span id="totalQty">0</span></p>
                <p class="text-2xl font-bold text-gray-800">Total: <span id="totalAmount"><?php echo $currency; ?>0</span></p>
            </div>
            <form method="POST" id="saleForm">
                <input type="hidden" name="cart_items" id="cartItemsInput">
                <input type="hidden" name="confirm_sale" value="1">
                <button type="submit" onclick="return confirmSale()" class="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-xl hover:from-green-400 hover:to-green-500 text-lg shadow-lg">
                    ✓ Confirm Sale
                </button>
            </form>
        </div>
    </div>

    <!-- Empty State -->
    <div id="emptyState" class="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <i class="fas fa-shopping-cart text-5xl text-gray-300 mb-4"></i>
        <p class="text-gray-500 text-lg">No items in the current transaction.</p>
        <p class="text-gray-400 mt-1">Scan a barcode or enter a serial number above to begin.</p>
    </div>
</div>

<script>
let cart = [];
const currency = '<?php echo $currency; ?>';

// Handle barcode scanner input (Enter key)
document.getElementById('scanInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        lookupProduct();
    }
});

function lookupProduct() {
    const serial = document.getElementById('scanInput').value.trim();
    if (!serial) return;
    
    const errorDiv = document.getElementById('scanError');
    errorDiv.classList.add('hidden');
    
    fetch('<?php echo BASE_URL; ?>record_sale.php?ajax=lookup&serial=' + encodeURIComponent(serial))
        .then(r => r.json())
        .then(data => {
            if (data.error) {
                document.getElementById('scanErrorText').textContent = data.error;
                errorDiv.classList.remove('hidden');
                document.getElementById('scanInput').value = '';
                document.getElementById('scanInput').focus();
                return;
            }
            
            addToCart(data.product);
            document.getElementById('scanInput').value = '';
            document.getElementById('scanInput').focus();
        })
        .catch(err => {
            document.getElementById('scanErrorText').textContent = 'Network error. Please try again.';
            errorDiv.classList.remove('hidden');
        });
}

function addToCart(product) {
    const existing = cart.find(c => c.product_id === product.id);
    if (existing) {
        if (existing.quantity >= product.stock) {
            document.getElementById('scanErrorText').textContent = 'Only ' + product.stock + ' units available.';
            document.getElementById('scanError').classList.remove('hidden');
            return;
        }
        existing.quantity++;
    } else {
        cart.push({
            product_id: product.id,
            name: product.name,
            serial: product.serial,
            colour: product.colour,
            size: product.size,
            stock: product.stock,
            price: product.price,
            quantity: 1,
        });
    }
    renderCart();
}

function updateQty(productId, qty) {
    const item = cart.find(c => c.product_id === productId);
    if (!item) return;
    qty = parseInt(qty) || 0;
    if (qty <= 0) {
        cart = cart.filter(c => c.product_id !== productId);
    } else if (qty > item.stock) {
        document.getElementById('scanErrorText').textContent = 'Only ' + item.stock + ' units available.';
        document.getElementById('scanError').classList.remove('hidden');
        return;
    } else {
        item.quantity = qty;
    }
    renderCart();
}

function removeItem(productId) {
    cart = cart.filter(c => c.product_id !== productId);
    renderCart();
}

function renderCart() {
    const cartSection = document.getElementById('cartSection');
    const emptyState = document.getElementById('emptyState');
    const cartItemsDiv = document.getElementById('cartItems');
    
    if (cart.length === 0) {
        cartSection.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }
    
    cartSection.classList.remove('hidden');
    emptyState.classList.add('hidden');
    
    let html = '';
    let total = 0;
    let totalQty = 0;
    
    cart.forEach(item => {
        const subtotal = item.price * item.quantity;
        total += subtotal;
        totalQty += item.quantity;
        html += `
        <div class="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div class="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
                <i class="fas fa-box text-xl"></i>
            </div>
            <div class="flex-1 min-w-0">
                <p class="font-bold text-gray-800">${item.name}</p>
                <p class="text-sm text-gray-500">${item.colour} • ${item.size} • ${item.serial}</p>
                <p class="text-sm text-gray-500">Available: ${item.stock} | Price: ${currency}${item.price}</p>
            </div>
            <div class="flex items-center gap-2">
                <label class="text-sm text-gray-600">Qty:</label>
                <input type="number" value="${item.quantity}" onchange="updateQty(${item.product_id}, this.value)"
                       class="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center font-bold text-lg" min="1" max="${item.stock}">
            </div>
            <div class="text-right min-w-[80px]">
                <p class="font-bold text-lg text-gray-800">${currency}${subtotal.toLocaleString()}</p>
            </div>
            <button onclick="removeItem(${item.product_id})" class="p-2 hover:bg-red-50 rounded-lg text-red-500">
                <i class="fas fa-trash"></i>
            </button>
        </div>`;
    });
    
    cartItemsDiv.innerHTML = html;
    document.getElementById('cartCount').textContent = cart.length;
    document.getElementById('totalQty').textContent = totalQty;
    document.getElementById('totalAmount').textContent = currency + total.toLocaleString();
    document.getElementById('cartItemsInput').value = JSON.stringify(cart);
}

function confirmSale() {
    if (cart.length === 0) return false;
    return confirm('Are you sure you want to complete this sale?\n\nTotal: ' + document.getElementById('totalAmount').textContent);
}
</script>

<?php include __DIR__ . '/includes/footer.php'; ?>
