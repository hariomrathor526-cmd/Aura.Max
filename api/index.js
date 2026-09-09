const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
  const TARGET_URL = 'https://vidcloud.eu.org';
  
  try {
    // 1. Fetching original website with custom headers to bypass Error 429
    const response = await axios.get(`${TARGET_URL}${req.url}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Referer': TARGET_URL
      },
      responseType: 'text',
      validateStatus: false
    });

    // Handle non-HTML assets (CSS, JS, Images, Video streams)
    const contentType = response.headers['content-type'] || '';
    if (!contentType.includes('text/html')) {
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400, stale-while-revalidate'); // Caching for offline availability
      return res.status(response.status).send(response.data);
    }

    // 2. Load HTML into Cheerio parser for custom modifications
    const $ = cheerio.load(response.data);

    // --- CUSTOMIZATIONS SECTION (Aap yahan kuch bhi add/remove/change kar sakte hain) ---

    // A. Title Change Karein
    $('title').text('Mera Naya Brand Name');

    // B. Purana Logo Remove karke Naya Logo Add Karein
    $('img.logo, img[src*="logo"]').attr('src', 'https://aapka-domain.com/my-new-logo.png');

    // C. Unwanted Elements/Ads Remove Karein
    $('.ad-banner, .unwanted-class, #popup-notice').remove();

    // D. Naya Script / Styling / Custom Button Add Karein
    $('head').append('<style> body { font-family: Arial, sans-serif; } </style>');
    $('body').append('<script> console.log("Custom Clone Active"); </script>');

    // E. Internal Links Ko Apne Site URL Se Replace Karein
    $('a').each((i, el) => {
      let href = $(el).attr('href');
      if (href && href.includes('vidcloud.eu.org')) {
        $(el).attr('href', href.replace('vidcloud.eu.org', req.headers.host));
      }
    });

    // 3. Enable Vercel Edge Caching (Original Down Hoga Tab Bhi Aapki Site Chale-gi)
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800');
    res.setHeader('Content-Type', 'text/html');

    return res.status(200).send($.html());

  } catch (error) {
    res.status(500).send('Proxy Server Error: ' + error.message);
  }
};
