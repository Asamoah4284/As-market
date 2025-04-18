const https = require('https');
const fs = require('fs');
const path = require('path');

const fonts = [
  {
    name: 'SpaceGrotesk-Regular',
    url: 'https://fonts.gstatic.com/s/spacegrotesk/v16/V8mQoQDjQSkFtoMM3T6r8E7mF71Q-gOoraIAEj7aUXskPMBBSSJLm2E.woff2'
  },
  {
    name: 'SpaceGrotesk-Medium',
    url: 'https://fonts.gstatic.com/s/spacegrotesk/v16/V8mQoQDjQSkFtoMM3T6r8E7mF71Q-gOoraIAEj7aUXskPMBBSSJLm2E.woff2'
  },
  {
    name: 'SpaceGrotesk-SemiBold',
    url: 'https://fonts.gstatic.com/s/spacegrotesk/v16/V8mQoQDjQSkFtoMM3T6r8E7mF71Q-gOoraIAEj7aUXskPMBBSSJLm2E.woff2'
  },
  {
    name: 'SpaceGrotesk-Bold',
    url: 'https://fonts.gstatic.com/s/spacegrotesk/v16/V8mQoQDjQSkFtoMM3T6r8E7mF71Q-gOoraIAEj7aUXskPMBBSSJLm2E.woff2'
  }
];

const fontsDir = path.join(__dirname, '../assets/fonts');

if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

fonts.forEach(font => {
  const filePath = path.join(fontsDir, `${font.name}.ttf`);
  
  https.get(font.url, (response) => {
    const file = fs.createWriteStream(filePath);
    response.pipe(file);
    
    file.on('finish', () => {
      file.close();
      console.log(`Downloaded ${font.name}`);
    });
  }).on('error', (err) => {
    console.error(`Error downloading ${font.name}:`, err.message);
  });
}); 