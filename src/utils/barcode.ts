// Barcode Generator - Code 128B (supports full ASCII including letters)
// Encodes the COMPLETE serial number (e.g. "MKS-001" stays "MKS-001")

// Code 128B pattern table (values 0-106)
const CODE128B_PATTERNS = [
  "212222","222122","222221","121223","121322","131222","122213","122312",
  "132212","221213","221312","231212","112232","122132","122231","113222",
  "123122","123221","223211","221132","221231","213212","223112","312131",
  "311222","321122","321221","312212","322112","322211","212123","212321",
  "232121","111323","131123","131321","112313","132113","132311","211313",
  "231113","231311","112133","112331","132131","113123","113321","133121",
  "313121","211331","231131","213113","213311","213131","311123","311321",
  "331121","312113","312311","332111","314111","221411","431111","111224",
  "111422","121124","121421","141122","141221","112214","112412","122114",
  "122411","142112","142211","241211","221114","413111","241112","134111",
  "111242","121142","121241","114212","124112","124211","411212","421112",
  "421211","212141","214121","412121","111143","111341","131141","114113",
  "114311","411113","411311","113141","114131","311141","411131","211412",
  "211214","211232","2331112"
];

function patternToBits(patternIndex: number): string {
  const s = CODE128B_PATTERNS[patternIndex];
  let out = "";
  let bar = true;
  for (let k = 0; k < s.length; k++) {
    out += (bar ? "1" : "0").repeat(+s[k]);
    bar = !bar;
  }
  return out;
}

// Code 128B encoding - supports full ASCII (chars 32-127)
// Value = ASCII code - 32 for characters in range 32-127
function encodeCode128B(data: string): string {
  const values: number[] = [];
  
  // Start Code B (value 104)
  values.push(104);
  
  // Encode each character: value = charCode - 32
  for (let i = 0; i < data.length; i++) {
    const charCode = data.charCodeAt(i);
    if (charCode >= 32 && charCode <= 127) {
      values.push(charCode - 32);
    } else if (charCode < 32) {
      // For control chars, use the char code directly (special mapping)
      values.push(charCode);
    } else {
      // For chars > 127, replace with ?
      values.push(127 - 32); // '?' character
    }
  }
  
  // Calculate checksum
  let checksum = values[0]; // Start code
  for (let i = 1; i < values.length; i++) {
    checksum += i * values[i];
  }
  checksum = checksum % 103;
  values.push(checksum);
  
  // Stop code (value 106)
  values.push(106);
  
  // Convert to bit pattern
  return values.map(patternToBits).join("");
}

// Check if string is all digits (for optimized Code 128C)
function isAllDigits(s: string): boolean {
  return /^\d+$/.test(s) && s.length > 0;
}

export function generateBarcodeImage(
  serialNumber: string,
  scale = 3,
  height = 100,
  showText = true
): string {
  // Use the FULL serial number - do NOT strip any characters
  const data = serialNumber.trim() || "000000";
  
  // Encode using Code 128B (handles all printable ASCII)
  const bits = encodeCode128B(data);
  
  const quiet = 10;
  const pad = 8;
  const textH = showText ? 18 + scale * 5 : 0;
  const W = (bits.length + quiet * 2) * scale;
  const H = height + pad * 2 + textH;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // White background
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, W, H);
  
  // Draw bars
  ctx.fillStyle = "#000";
  let i = 0;
  while (i < bits.length) {
    if (bits[i] === "1") {
      let j = i;
      while (j < bits.length && bits[j] === "1") j++;
      ctx.fillRect((quiet + i) * scale, pad, (j - i) * scale, height);
      i = j;
    } else {
      i++;
    }
  }

  // Draw text below barcode
  if (showText) {
    const fs = Math.max(14, scale * 5);
    ctx.font = `${fs}px ui-monospace,Menlo,Consolas,monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    // Show the full serial number as-is
    ctx.fillText(data, W / 2, pad + height + 6);
  }

  return canvas.toDataURL("image/png");
}

export function generateBarcodeForProduct(serialNumber: string): string {
  return generateBarcodeImage(serialNumber, 3, 100, true);
}
