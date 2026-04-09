import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.join(__dirname, "..", "assets");
const logoPath = path.join(assetsDir, "logo.png");

async function generate() {
  const logo = sharp(logoPath);
  const { width, height } = await logo.metadata();
  console.log(`Source logo: ${width}x${height}`);

  // 1. icon.png — 1024x1024, logo centered on navy background
  await sharp({
    create: { width: 1024, height: 1024, channels: 4, background: { r: 27, g: 42, b: 74, alpha: 1 } },
  })
    .composite([
      {
        input: await sharp(logoPath).resize(820, 820, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer(),
        gravity: "center",
      },
    ])
    .png()
    .toFile(path.join(assetsDir, "icon.png"));
  console.log("✓ icon.png (1024x1024)");

  // 2. adaptive-icon.png — 1024x1024, logo with more padding for Android safe zone
  await sharp({
    create: { width: 1024, height: 1024, channels: 4, background: { r: 27, g: 42, b: 74, alpha: 1 } },
  })
    .composite([
      {
        input: await sharp(logoPath).resize(680, 680, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer(),
        gravity: "center",
      },
    ])
    .png()
    .toFile(path.join(assetsDir, "adaptive-icon.png"));
  console.log("✓ adaptive-icon.png (1024x1024)");

  // 3. splash-icon.png — 288x288 centered logo for splash screen
  await sharp(logoPath)
    .resize(288, 288, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(assetsDir, "splash-icon.png"));
  console.log("✓ splash-icon.png (288x288)");

  // 4. favicon.png — 48x48 for web
  await sharp(logoPath)
    .resize(48, 48, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(assetsDir, "favicon.png"));
  console.log("✓ favicon.png (48x48)");

  // 5. Dashboard favicon — copy to dashboard public folder
  const dashboardPublic = path.join(__dirname, "..", "..", "dashboard", "public");
  await sharp(logoPath)
    .resize(32, 32, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(dashboardPublic, "favicon.png"));
  console.log("✓ dashboard favicon.png (32x32)");

  // 6. Dashboard logo for sidebar — 200x200
  await sharp(logoPath)
    .resize(200, 200, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(dashboardPublic, "logo.png"));
  console.log("✓ dashboard logo.png (200x200)");

  console.log("\nAll assets generated!");
}

generate().catch(console.error);
