<?php
/**
 * Sidebar Navigation
 */
$current_page = basename($_SERVER['PHP_SELF'], '.php');
$user = current_user();
?>
<!-- Sidebar -->
<aside class="w-72 sidebar-gradient text-white flex flex-col fixed h-full z-50 transform -translate-x-full lg:translate-x-0 transition-transform" id="sidebar">
    <!-- Logo -->
    <div class="p-5 border-b border-yellow-600/30">
        <div class="flex items-center gap-3">
            <div class="w-12 h-12 gold-gradient rounded-xl flex items-center justify-center text-black font-bold text-lg shadow-lg">MK</div>
            <div>
                <h1 class="text-lg font-bold text-yellow-400 leading-tight">Mr Ketan</h1>
                <p class="text-xs text-gray-400">Fashion Store</p>
            </div>
        </div>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto py-4 px-3">
        <ul class="space-y-1">
            <?php
            $nav_items = [
                ['dashboard', 'Dashboard', 'fa-chart-line'],
                ['products', 'All Products', 'fa-box'],
                ['add_product', 'Add New Product', 'fa-plus-circle'],
                ['record_sale', 'Record a Sale', 'fa-shopping-cart'],
                ['restock', 'Restock Inventory', 'fa-sync-alt'],
                ['sales_history', 'Sales History', 'fa-history'],
                ['stock_movement', 'Stock Movement', 'fa-exchange-alt'],
                ['reports', 'Reports & Analytics', 'fa-chart-bar'],
            ];
            if ($user && $user['role'] === 'admin') {
                $nav_items[] = ['settings', 'Settings', 'fa-cog'];
            }
            foreach ($nav_items as $item):
                $active = $current_page === $item[0];
            ?>
            <li>
                <a href="<?php echo BASE_URL . $item[0]; ?>.php"
                   class="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all <?php echo $active ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'text-gray-300 hover:bg-white/5 hover:text-white'; ?>">
                    <i class="fas <?php echo $item[2]; ?> w-5 text-center"></i>
                    <span><?php echo $item[1]; ?></span>
                    <?php if ($active): ?><i class="fas fa-chevron-right ml-auto text-sm"></i><?php endif; ?>
                </a>
            </li>
            <?php endforeach; ?>
        </ul>
    </nav>

    <!-- User Info -->
    <div class="p-4 border-t border-gray-700">
        <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <span class="text-yellow-400 font-bold text-sm"><?php echo strtoupper(substr($user['full_name'] ?? 'U', 0, 1)); ?></span>
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-white truncate"><?php echo e($user['full_name'] ?? 'Guest'); ?></p>
                <p class="text-xs text-gray-400 capitalize"><?php echo e($user['role'] ?? ''); ?></p>
            </div>
        </div>
        <a href="<?php echo BASE_URL; ?>logout.php" class="flex items-center gap-2 w-full px-4 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium">
            <i class="fas fa-sign-out-alt"></i>
            <span>Logout</span>
        </a>
    </div>
</aside>

<!-- Main Content -->
<div class="flex-1 lg:ml-72 flex flex-col">
    <!-- Top Bar -->
    <header class="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex items-center gap-4 sticky top-0 z-30">
        <button onclick="document.getElementById('sidebar').classList.toggle('-translate-x-full')" class="lg:hidden p-2 rounded-lg hover:bg-gray-100">
            <i class="fas fa-bars text-xl"></i>
        </button>
        <div class="flex-1">
            <h2 class="text-lg font-semibold text-gray-800"><?php echo e($page_title); ?></h2>
        </div>
        <div class="text-sm text-gray-500 hidden sm:block">Inventory Management System</div>
    </header>

    <!-- Flash Messages -->
    <?php $flash = get_flash(); if ($flash): ?>
    <div class="mx-4 lg:mx-6 mt-4">
        <div class="p-3 rounded-lg border <?php echo $flash['type'] === 'success' ? 'bg-green-50 border-green-200 text-green-700' : ($flash['type'] === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-blue-50 border-blue-200 text-blue-700'); ?>">
            <i class="fas <?php echo $flash['type'] === 'success' ? 'fa-check-circle' : ($flash['type'] === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'); ?> mr-2"></i>
            <?php echo e($flash['message']); ?>
        </div>
    </div>
    <?php endif; ?>

    <!-- Page Content -->
    <main class="flex-1 p-4 lg:p-6 overflow-auto">
