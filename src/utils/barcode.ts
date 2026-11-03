// Barcode Generator - Based on Code 128 encoding
// Adapted from the existing generator implementation

const P = "212222,222122,222221,121223,121322,131222,122213,122312,132212,221213,221312,231212,112232,122132,122231,113222,123122,123221,223211,221132,221231,213212,223112,312131,311222,321122,321221,312212,322112,322211,212123,212321,232121,111323,131123,131321,112313,132113,132311,211313,231113,231311,112133,112331,132131,113123,113321,133121,313121,211331,231131,213113,213311,213131,311123,311321,331121,312113,312311,332111,314111,221411,431111,111224,111422,121124,121421,141122,141221,112214,112412,122114,122411,142112,142211,241211,221114,413111,241112,134111,111242,121142,121241,114212,124112,124211,411212,421112,421211,212141,214121,412121,111143,111341,131141,114113,114311,411113,411311,113141,114131,311141,411131,211412,211214,211232,2331112".split(",");

function pat(i: number): string {
  const s = P[i];
  let out = "";
  let bar = true;
  for (let k = 0; k < s.length; k++) {
    out += (bar ? "1" : "0").repeat(+s[k]);
    bar = !bar;
  }
  return out;
}

function code128(d: string): string {
  const v: number[] = [];
  const n = d.length;
  if (n === 1) {
    v.push(104, 16 + +d);
  } else {
    v.push(105);
    const pairs = n - (n % 2);
    for (let i = 0; i < pairs; i += 2) v.push(+d.substr(i, 2));
    if (n % 2) {
      v.push(100, 16 + +d[n - 1]);
    }
  }
  let sum = v[0];
  for (let i = 1; i < v.length; i++) sum += i * v[i];
  v.push(sum % 103, 106);
  return v.map(pat).join("");
}

export function generateBarcodeImage(serialNumber: string, scale = 3, height = 100, showText = true): string {
  const digits = serialNumber.replace(/\D/g, "") || "000000";
  const bits = code128(digits);
  const quiet = 10;
  const pad = 8;
  const textH = showText ? 18 + scale * 5 : 0;
  const W = (bits.length + quiet * 2) * scale;
  const H = height + pad * 2 + textH;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

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
    } else {
      i++;
    }
  }

  if (showText) {
    const fs = Math.max(14, scale * 5);
    ctx.font = `${fs}px ui-monospace,Menlo,Consolas,monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const label = digits.replace(/(\d{4})(?=\d)/g, "$1 ");
    ctx.fillText(label, W / 2, pad + height + 6);
  }

  return canvas.toDataURL("image/png");
}

export function generateBarcodeForProduct(serialNumber: string): string {
  return generateBarcodeImage(serialNumber, 3, 100, true);
}
