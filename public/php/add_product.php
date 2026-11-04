<?php
/**
 * Add/Edit Product Page
 */
require_once __DIR__ . '/includes/functions.php';
require_login();

$page_title = 'Add New Product';
$currency = get_setting($pdo, 'currency', 'K');
$categories = get_categories($pdo);
$edit_id = $_GET['edit'] ?? null;
$product = null;
$error = '';
$success = '';

if ($edit_id) {
    $product = get_product($pdo, $edit_id);
    if (!$product) { redirect(BASE_URL . 'products.php'); }
    $page_title = 'Edit Product';
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $serial = trim($_POST['serial_number'] ?? '');
    $name = trim($_POST['product_name'] ?? '');
    $category_id = intval($_POST['category_id'] ?? 0);
    $colour = trim($_POST['colour'] ?? '');
    $size = trim($_POST['size'] ?? '');
    $original_qty = intval($_POST['original_quantity'] ?? 0);
    $current_qty = intval($_POST['current_quantity'] ?? $original_qty);
    $purchase_price = floatval($_POST['purchase_price'] ?? 0);
    $selling_price = floatval($_POST['selling_price'] ?? 0);
    $min_stock = intval($_POST['minimum_stock_level'] ?? 5);

    // Validation
    if (empty($serial) || empty($name) || empty($colour) || !$category_id || !$original_qty) {
        $error = 'Please fill in all required fields.';
    } elseif (!preg_match('/^[A-Za-z0-9\-_]+$/', $serial)) {
        $error = 'Serial number must contain only letters, numbers, hyphens or underscores.';
    } else {
        // Check duplicate serial
        $stmt = $pdo->prepare("SELECT id FROM products WHERE serial_number = ? AND id != ?");
        $stmt->execute([$serial, $edit_id ?? 0]);
        if ($stmt->fetch()) {
            $error = 'This serial number already exists.';
        }
    }

    if (!$error) {
        // Handle image upload
        $image_path = $product['product_image'] ?? null;
        if (isset($_FILES['product_image']) && $_FILES['product_image']['error'] === UPLOAD_ERR_OK) {
            $file = $_FILES['product_image'];
            $max_size = 2 * 1024 * 1024; // 2MB
            $allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            
            if ($file['size'] > $max_size) {
                $error = 'Image must be less than 2MB.';
            } elseif (!in_array($file['type'], $allowed)) {
                $error = 'Invalid image format. Use JPG, PNG, GIF, or WebP.';
            } else {
                $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
                $filename = uniqid('prod_') . '.' . $ext;
                $dir = PRODUCT_IMG_DIR;
                if (!is_dir($dir)) mkdir($dir, 0755, true);
                if (move_uploaded_file($file['tmp_name'], $dir . $filename)) {
                    $image_path = $filename;
                }
            }
        }

        if (!$error) {
            if ($edit_id) {
                $stmt = $pdo->prepare("UPDATE products SET serial_number=?, product_name=?, category_id=?, colour=?, size=?, original_quantity=?, current_quantity=?, purchase_price=?, selling_price=?, minimum_stock_level=?, product_image=? WHERE id=?");
                $stmt->execute([$serial, $name, $category_id, $colour, $size, $original_qty, $current_qty, $purchase_price, $selling_price, $min_stock, $image_path, $edit_id]);
                set_flash('success', 'Product updated successfully!');
            } else {
                $stmt = $pdo->prepare("INSERT INTO products (serial_number, product_name, category_id, colour, size, original_quantity, current_quantity, purchase_price, selling_price, minimum_stock_level, product_image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([$serial, $name, $category_id, $colour, $size, $original_qty, $current_qty, $purchase_price, $selling_price, $min_stock, $image_path]);
                set_flash('success', 'Product registered successfully!');
            }
            redirect(BASE_URL . 'products.php');
        }
    }
}

// Pre-fill form for edit
if ($product) {
    $form = $product;
} else {
    $form = [
        'serial_number' => $_POST['serial_number'] ?? '',
        'product_name' => $_POST['product_name'] ?? '',
        'category_id' => $_POST['category_id'] ?? 1,
        'colour' => $_POST['colour'] ?? '',
        'size' => $_POST['size'] ?? 'M',
        'original_quantity' => $_POST['original_quantity'] ?? '',
        'current_quantity' => $_POST['current_quantity'] ?? '',
        'purchase_price' => $_POST['purchase_price'] ?? '',
        'selling_price' => $_POST['selling_price'] ?? '',
        'minimum_stock_level' => $_POST['minimum_stock_level'] ?? get_setting($pdo, 'low_stock_threshold', 5),
    ];
}

$sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];

include __DIR__ . '/includes/header.php';
include __DIR__ . '/includes/sidebar.php';
?>

<div class="max-w-4xl mx-auto">
    <div class="bg-white rounded-xl border border-gray-200 p-6">
        <h2 class="text-xl font-bold text-gray-800 mb-6"><?php echo $edit_id ? '✏️ Edit Product' : '➕ Register New Product'; ?></h2>

        <?php if ($error): ?>
        <div class="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <i class="fas fa-exclamation-circle"></i><span><?php echo e($error); ?></span>
        </div>
        <?php endif; ?>

        <form method="POST" enctype="multipart/form-data" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1">Serial Number *</label>
                    <input type="text" name="serial_number" value="<?php echo e($form['serial_number']); ?>"
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg font-mono focus:ring-2 focus:ring-yellow-500 outline-none"
                           placeholder="e.g. MKS-001" required>
                    <p class="text-xs text-gray-500 mt-1">Letters, numbers, hyphens. Must be unique (e.g. MKS-001).</p>
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1">Product Name *</label>
                    <input type="text" name="product_name" value="<?php echo e($form['product_name']); ?>"
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                           placeholder="e.g. Black Formal Shirt" required>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1">Category *</label>
                    <select name="category_id" class="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-yellow-500 outline-none" required>
                        <?php foreach ($categories as $c): ?>
                        <option value="<?php echo $c['id']; ?>" <?php echo $form['category_id'] == $c['id'] ? 'selected' : ''; ?>><?php echo e($c['category_name']); ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1">Colour *</label>
                    <input type="text" name="colour" value="<?php echo e($form['colour']); ?>"
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                           placeholder="e.g. Black" required>
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1">Size *</label>
                    <select name="size" class="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-yellow-500 outline-none">
                        <?php foreach ($sizes as $s): ?>
                        <option value="<?php echo $s; ?>" <?php echo $form['size'] === $s ? 'selected' : ''; ?>><?php echo $s; ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1">Original Quantity *</label>
                    <input type="number" name="original_quantity" value="<?php echo e($form['original_quantity']); ?>"
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                           min="0" required>
                </div>
                <?php if ($edit_id): ?>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1">Current Available Quantity</label>
                    <input type="number" name="current_quantity" value="<?php echo e($form['current_quantity']); ?>"
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-yellow-500 outline-none" min="0">
                </div>
                <?php endif; ?>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1">Purchase Price (<?php echo $currency; ?>) *</label>
                    <input type="number" name="purchase_price" value="<?php echo e($form['purchase_price']); ?>"
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                           min="0" step="0.01" required>
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1">Selling Price (<?php echo $currency; ?>) *</label>
                    <input type="number" name="selling_price" value="<?php echo e($form['selling_price']); ?>"
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                           min="0" step="0.01" required>
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1">Min. Stock Level</label>
                    <input type="number" name="minimum_stock_level" value="<?php echo e($form['minimum_stock_level']); ?>"
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-yellow-500 outline-none" min="0">
                </div>
            </div>

            <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1">Product Image (optional)</label>
                <div class="flex items-center gap-4">
                    <label class="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                        <i class="fas fa-camera text-gray-500"></i>
                        <span class="text-gray-600">Upload Image</span>
                        <input type="file" name="product_image" accept="image/*" class="hidden">
                    </label>
                    <?php if (!empty($form['product_image'])): ?>
                    <img src="<?php echo BASE_URL . 'uploads/products/' . e($form['product_image']); ?>" alt="Current" class="w-16 h-16 object-cover rounded-lg border">
                    <?php endif; ?>
                </div>
                <p class="text-xs text-gray-500 mt-1">Max 2MB. JPG, PNG supported.</p>
            </div>

            <div class="flex gap-3 pt-4">
                <button type="submit" class="flex items-center gap-2 px-6 py-3 btn-gold rounded-lg text-lg">
                    <i class="fas fa-save"></i> <?php echo $edit_id ? 'Update Product' : 'Register Product'; ?>
                </button>
                <a href="<?php echo BASE_URL; ?>products.php" class="px-6 py-3 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 font-medium text-lg">Cancel</a>
            </div>
        </form>
    </div>
</div>

<?php include __DIR__ . '/includes/footer.php'; ?>
