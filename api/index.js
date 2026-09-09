const express = require('express');
const proxy = require('express-http-proxy');
const app = express();

const TARGET_URL = 'https://rarestudy.testuk.org';

app.use('/', proxy(TARGET_URL, {
  // 1. Target server SSL Security handling
  proxyReqOptDecorator(proxyReqOpts, srcReq) {
    proxyReqOpts.headers['Referer'] = TARGET_URL;
    proxyReqOpts.headers['Origin'] = TARGET_URL;
    proxyReqOpts.headers['Host'] = 'rarestudy.testuk.org';
    
    // User login/token session ko target site par maintain rakhna
    if (srcReq.headers['authorization']) {
      proxyReqOpts.headers['authorization'] = srcReq.headers['authorization'];
    }
    return proxyReqOpts;
  },

  // 2. CORS Bypass for API calls
  userResHeaderDecorator(headers, userReq, userRes, proxyReq, proxyRes) {
    headers['access-control-allow-origin'] = '*';
    headers['access-control-allow-methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    headers['access-control-allow-headers'] = '*';
    headers['access-control-allow-credentials'] = 'true';
    return headers;
  },

  // 3. Dynamic DOM & Link Modification (Branding Changes)
  userResDecorator: function(proxyRes, proxyResData, userReq, userRes) {
    let contentType = proxyRes.headers['content-type'] || '';
    
    if (contentType.includes('text/html')) {
      let html = proxyResData.toString('utf8');
      
      // Target API domain ko current Vercel URL se bind karna
      html = html.replaceAll('https://rarestudy.testuk.org', '');
      
      // Brand Name / Title Edit
      html = html.replace(/<title>.*?<\/title>/gi, '<title>AURA MAX</title>');

      return html;
    }
    // Baaki sabhi JSON Batch API/Video streams raw bypass honge
    return proxyResData;
  }
}));

module.exports = app;
