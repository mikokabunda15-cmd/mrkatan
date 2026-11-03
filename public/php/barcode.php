<?php
/**
 * Barcode Display/Print Page
 */
require_once __DIR__ . '/includes/functions.php';
require_login();

$product_id = intval($_GET['id'] ?? 0);
$product = get_product($pdo, $product_id);
if (!$product) { die('Product not found.'); }

$currency = get_setting($pdo, 'currency', 'K');
$store_name = get_setting($pdo, 'store_name', 'Mr Ketan Fashion Store');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Barcode - <?php echo e($product['product_name']); ?></title>
    <style>
        body { font-family: Arial, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
        .barcode-container { text-align: center; border: 1px solid #ddd; padding: 20px; border-radius: 8px; max-width: 400px; }
        h2 { margin: 0 0 8px; font-size: 18px; }
        .info { color: #666; margin: 4px 0; font-size: 14px; }
        .price { font-size: 20px; font-weight: bold; margin: 8px 0; }
        canvas { margin: 16px 0; }
        .store { font-size: 12px; color: #999; margin-top: 8px; }
        .btn { display: inline-block; margin: 10px 5px; padding: 10px 20px; background: #D4A017; color: #000; font-weight: bold; border: none; border-radius: 8px; cursor: pointer; text-decoration: none; }
        @media print { .no-print { display: none !important; } body { padding: 0; } .barcode-container { border: none; } }
    </style>
</head>
<body>
    <div class="barcode-container">
        <h2><?php echo e($product['product_name']); ?></h2>
        <p class="info">Serial: <?php echo e($product['serial_number']); ?></p>
        <p class="info">Size: <?php echo e($product['size']); ?> | Colour: <?php echo e($product['colour']); ?></p>
        <p class="price"><?php echo $currency; ?><?php echo number_format($product['selling_price']); ?></p>
        <canvas id="barcode"></canvas>
        <p class="store"><?php echo e($store_name); ?></p>
    </div>
    
    <div class="no-print">
        <button onclick="window.print()" class="btn">🖨️ Print Barcode</button>
        <button onclick="downloadBarcode()" class="btn">💾 Download PNG</button>
        <a href="<?php echo BASE_URL; ?>products.php" class="btn">← Back</a>
    </div>

    <script>
    // Code 128 Barcode Generator
    const P = "212222,222122,222221,121223,121322,131222,122213,122312,132212,221213,221312,231212,112232,122132,122231,113222,123122,123221,223211,221132,221231,213212,223112,312131,311222,321122,321221,312212,322112,322211,212123,212321,232121,111323,131123,131321,112313,132113,132311,211313,231113,231311,112133,112331,132131,113123,113321,133121,313121,211331,231131,213113,213311,213131,311123,311321,331121,312113,312311,332111,314111,221411,431111,111224,111422,121124,121421,141122,141221,112214,112412,122114,122411,142112,142211,241211,221114,413111,241112,134111,111242,121142,121241,114212,124112,124211,411212,421112,421211,212141,214121,412121,111143,111341,131141,114113,114311,411113,411311,113141,114131,311141,411131,211412,211214,211232,2331112".split(",");

    function pat(i) {
        let s = P[i], out = "", bar = true;
        for (let k = 0; k < s.length; k++) { out += (bar ? "1" : "0").repeat(+s[k]); bar = !bar; }
        return out;
    }

    function code128(d) {
        const v = []; const n = d.length;
        if (n === 1) { v.push(104, 16 + +d); }
        else {
            v.push(105);
            const pairs = n - (n % 2);
            for (let i = 0; i < pairs; i += 2) v.push(+d.substr(i, 2));
            if (n % 2) v.push(100, 16 + +d[n - 1]);
        }
        let sum = v[0];
        for (let i = 1; i < v.length; i++) sum += i * v[i];
        v.push(sum % 103, 106);
        return v.map(pat).join("");
    }

    const serial = "<?php echo $product['serial_number']; ?>";
    const digits = serial.replace(/\D/g, "") || "000000";
    const bits = code128(digits);
    const scale = 3, height = 100, quiet = 10, pad = 8;
    const textH = 30;
    const W = (bits.length + quiet * 2) * scale;
    const H = height + pad * 2 + textH;

    const canvas = document.getElementById("barcode");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#000";

    let i = 0;
    while (i < bits.length) {
        if (bits[i] === "1") {
            let j = i;
            while (j < bits.length && bits[j] === "1") j++;
            ctx.fillRect((quiet + i) * scale, pad, (j - i) * scale, height);
            i = j;
        } else i++;
    }

    const fs = 16;
    ctx.font = fs + "px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(digits, W / 2, pad + height + 8);

    function downloadBarcode() {
        const link = document.createElement("a");
        link.download = "barcode-<?php echo $product['serial_number']; ?>.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
    }
    </script>
</body>
</html>
