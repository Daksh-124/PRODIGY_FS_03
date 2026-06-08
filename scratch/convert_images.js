const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const imagesDir = path.join(__dirname, '..', 'public', 'images');

fs.readdir(imagesDir, (err, files) => {
  if (err) {
    console.error('Failed to read images directory:', err);
    process.exit(1);
  }

  const pngFiles = files.filter(f => f.endsWith('.png'));
  console.log(`Found ${pngFiles.length} PNG files to convert.`);

  let completed = 0;
  if (pngFiles.length === 0) {
    console.log('No PNG files found.');
    process.exit(0);
  }

  pngFiles.forEach(file => {
    const inputPath = path.join(imagesDir, file);
    const outputPath = path.join(imagesDir, file.replace('.png', '.webp'));

    sharp(inputPath)
      .webp({ quality: 85 })
      .toFile(outputPath)
      .then(() => {
        console.log(`Successfully converted: ${file} -> ${file.replace('.png', '.webp')}`);
        // Delete original PNG to save space and clean up
        fs.unlinkSync(inputPath);
        completed++;
        if (completed === pngFiles.length) {
          console.log('All image conversions completed successfully!');
          process.exit(0);
        }
      })
      .catch(err => {
        console.error(`Error converting ${file}:`, err);
      });
  });
});
