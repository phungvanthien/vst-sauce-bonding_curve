import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Check if sharp is available, if not provide instructions
try {
  const sharp = require('sharp');
  
  console.log('🔄 Resizing VST logo to different sizes...');
  console.log('='.repeat(50));

  async function resizeLogos() {
    try {
      const inputPath = './logo-512.jpg';
      
      // Create different sizes
      const sizes = [
        { size: 512, name: 'logo-512.png' },
        { size: 256, name: 'logo-256.png' },
        { size: 128, name: 'logo-128.png' },
        { size: 64, name: 'logo-64.png' }
      ];

      for (const { size, name } of sizes) {
        console.log(`📐 Creating ${name} (${size}x${size})...`);
        
        await sharp(inputPath)
          .resize(size, size, {
            fit: 'cover',
            position: 'center'
          })
          .png()
          .toFile(name);
          
        console.log(`✅ Created ${name}`);
      }

      console.log('🎉 All logo sizes created successfully!');
      console.log('');
      console.log('📁 Files created:');
      sizes.forEach(({ name, size }) => {
        console.log(`   - ${name} (${size}x${size})`);
      });

    } catch (error) {
      console.error('❌ Error resizing logos:', error.message);
    }
  }

  resizeLogos();

} catch (error) {
  console.log('❌ Sharp not found. Installing...');
  console.log('');
  console.log('📦 Please run: npm install sharp');
  console.log('   Then run this script again.');
  console.log('');
  console.log('🔧 Alternative: Use online tools to resize:');
  console.log('   1. Upload Vistia-logo.jpg to https://resizeimage.net/');
  console.log('   2. Create sizes: 512x512, 256x256, 128x128, 64x64');
  console.log('   3. Save as PNG files');
  console.log('   4. Place in vst-assets/ folder');
}
