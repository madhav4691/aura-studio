const fs = require('fs');
const zlib = require('zlib');

function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  crcTable[n] = c;
}
function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) crc = crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function isInsideRoundedRect(x, y, size, r) {
  if (x >= r && x <= size - r && y >= 0 && y <= size) return true;
  if (y >= r && y <= size - r && x >= 0 && x <= size) return true;
  const corners = [[r, r], [size - r, r], [r, size - r], [size - r, size - r]];
  for (const [cx, cy] of corners) {
    if (Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) <= r) return true;
  }
  return false;
}

function createPNG(size, bgColor, fgColor) {
  const bg = hexToRgb(bgColor);
  const fg = hexToRgb(fgColor);
  const pixels = Buffer.alloc(size * size * 4);
  const cornerRadius = size * 0.19;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const cx = x - size / 2;
      const cy = y - size / 2;
      const dist = Math.sqrt(cx * cx + cy * cy);
      const normDist = dist / (size / 2);

      if (!isInsideRoundedRect(x, y, size, cornerRadius)) {
        pixels[idx] = 0; pixels[idx+1] = 0; pixels[idx+2] = 0; pixels[idx+3] = 0;
        continue;
      }

      const ring1 = Math.abs(normDist - 0.72) < 0.06;
      const ring2 = Math.abs(normDist - 0.52) < 0.065;
      const ring3 = Math.abs(normDist - 0.32) < 0.07;
      const center = normDist < 0.13;
      const onAxis = (Math.abs(cx) < size * 0.018 && (normDist > 0.13 && normDist < 0.78)) ||
                     (Math.abs(cy) < size * 0.018 && (normDist > 0.13 && normDist < 0.78));

      let r, g, b, a;
      if (center || onAxis) {
        r = fg.r; g = fg.g; b = fg.b; a = 255;
      } else if (ring3) {
        r = fg.r; g = fg.g; b = fg.b; a = 210;
      } else if (ring2) {
        r = fg.r; g = fg.g; b = fg.b; a = 160;
      } else if (ring1) {
        r = fg.r; g = fg.g; b = fg.b; a = 100;
      } else {
        r = bg.r; g = bg.g; b = bg.b; a = 255;
      }
      pixels[idx] = r; pixels[idx+1] = g; pixels[idx+2] = b; pixels[idx+3] = a;
    }
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6;

  const rowBytes = 1 + size * 4;
  const raw = Buffer.alloc(size * rowBytes);
  for (let y = 0; y < size; y++) {
    raw[y * rowBytes] = 0;
    pixels.copy(raw, y * rowBytes + 1, y * size * 4, (y + 1) * size * 4);
  }

  const compressed = zlib.deflateSync(raw);

  function makeChunk(type, data) {
    const tb = Buffer.from(type, 'ascii');
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const combined = Buffer.concat([tb, data]);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(combined) >>> 0, 0);
    return Buffer.concat([len, combined, crcBuf]);
  }

  return Buffer.concat([sig, makeChunk('IHDR', ihdr), makeChunk('IDAT', compressed), makeChunk('IEND', Buffer.alloc(0))]);
}

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const dir = 'public/icons';
fs.mkdirSync(dir, { recursive: true });
for (const s of sizes) {
  const png = createPNG(s, '#faf9f7', '#2c2418');
  fs.writeFileSync(`${dir}/icon-${s}.png`, png);
  console.log(`icon-${s}.png (${png.length} bytes)`);
}
console.log('All icons generated!');
