const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

async function makePerfectLogo() {
  const src = 'C:\\Users\\HP\\.gemini\\antigravity-ide\\brain\\3a6c788f-2fa1-4711-9843-a83101b7e7bc\\media__1786169825073.png';
  const destDir = path.join(__dirname, '..', 'client', 'assets');
  const dest = path.join(destDir, 'ecell_logo.png');

  console.log('Processing original logo image with sharp...');

  // 1. Trim outer white padding
  const trimmedBuffer = await sharp(src)
    .trim({ background: '#ffffff', threshold: 10 })
    .toBuffer();

  const metadata = await sharp(trimmedBuffer).metadata();
  const width = metadata.width;
  const height = metadata.height;
  const size = Math.max(width, height);

  // 2. Extract raw RGBA pixels to convert white background to transparent
  const { data, info } = await sharp(trimmedBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixelArray = new Uint8ClampedArray(data.buffer);

  for (let i = 0; i < pixelArray.length; i += 4) {
    const r = pixelArray[i];
    const g = pixelArray[i + 1];
    const b = pixelArray[i + 2];
    
    // If pixel is white or near-white (background), turn alpha to 0 (transparent)
    if (r > 235 && g > 235 && b > 235) {
      pixelArray[i + 3] = 0; // Transparent
    }
  }

  // 3. Re-create image with transparent background, resize cleanly to 512x512 with high quality
  const perfectLogoBuffer = await sharp(pixelArray, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4
    }
  })
  .resize(512, 512, {
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
    kernel: 'lanczos3'
  })
  .png({ quality: 100, compressionLevel: 9 })
  .toBuffer();

  fs.writeFileSync(dest, perfectLogoBuffer);
  console.log('✨ Perfect high-resolution transparent logo saved to:', dest);

  // 4. Upload to Cloudinary CDN
  const cloudinary = require('cloudinary').v2;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  try {
    const res = await cloudinary.uploader.upload(dest, {
      folder: 'pitch_competition/branding',
      public_id: 'ecell_logo',
      overwrite: true
    });
    console.log('☁️ Perfect Logo Uploaded to Cloudinary CDN:', res.secure_url);
  } catch (cloudErr) {
    console.error('Cloudinary upload error:', cloudErr.message);
  }
}

makePerfectLogo();
