const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
  const TARGET_URL = 'https://vidcloud.eu.org';
  
  // CORS Headers allow karein taaki frontend API block na ho
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 1. Target URL par Server-to-Server request bhejna
    const targetResponse = await axios({
      method: req.method,
      url: `${TARGET_URL}${req.url}`,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': TARGET_URL,
        'Origin': TARGET_URL,
        'Authorization': req.headers['authorization'] || ''
      },
      data: req.body,
      responseType: 'text',
      validateStatus: false
    });

    const contentType = targetResponse.headers['content-type'] || '';

    // 2. Agar Response JSON Data (Batches/Lectures Details) hai
    if (contentType.includes('application/json')) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(targetResponse.status).send(targetResponse.data);
    }

    // 3. Agar Response Static File (CSS, JS, Images, Video Stream) hai
    if (!contentType.includes('text/html')) {
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
      return res.status(targetResponse.status).send(targetResponse.data);
    }

    // 4. HTML Modify & Rewrite (Using Cheerio)
    const $ = cheerio.load(targetResponse.data);

    // Hardcoded API calls ko target site ki jagah aapke proxy par divert karna
    $('script').each((i, el) => {
      let scriptContent = $(el).html();
      if (scriptContent && scriptContent.includes('vidcloud.eu.org')) {
        let updatedScript = scriptContent.replaceAll('https://vidcloud.eu.org', '');
        $(el).html(updatedScript);
      }
    });

    // Custom Name & Logo Modify
    $('title').text('AURA MAX');
    $('img[src*="logo"]').attr('src', 'https://aapka-domain.com/my-logo.png');

    // Caching Enable Karein (Offline Availability)
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800');
    res.setHeader('Content-Type', 'text/html');

    return res.status(200).send($.html());

  } catch (error) {
    return res.status(500).json({ error: 'Proxy Request Failed: ' + error.message });
  }
};
