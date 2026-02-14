import sharp from 'sharp';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

// 綠色背景 + 白色「宏」字的 SVG
const createSvg = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.16}" fill="#059669"/>
  <text x="${size/2}" y="${size * 0.625}" font-family="Arial, sans-serif" font-size="${size * 0.42}" font-weight="bold" fill="white" text-anchor="middle">宏</text>
</svg>
`;

async function generateIcons() {
  const sizes = [192, 512];
  
  for (const size of sizes) {
    const svg = createSvg(size);
    const pngBuffer = await sharp(Buffer.from(svg))
      .png()
      .toBuffer();
    
    const outputPath = join(publicDir, `pwa-${size}x${size}.png`);
    writeFileSync(outputPath, pngBuffer);
    console.log(`✅ 已產生: pwa-${size}x${size}.png`);
  }
  
  console.log('🎉 所有圖示已產生完成！');
}

generateIcons().catch(console.error);
