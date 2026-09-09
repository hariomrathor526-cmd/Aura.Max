const express = require('express');
const proxy = require('express-http-proxy');
const app = express();

const TARGET_URL = 'https://vidcloud.eu.org';

app.use('/', proxy(TARGET_URL, {
  // Target server ki HTTPS SSL verify bypass
  userResHeaderDecorator(headers, userReq, userRes, proxyReq, proxyRes) {
    // CORS Errors completely remove karna
    headers['access-control-allow-origin'] = '*';
    headers['access-control-allow-methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    headers['access-control-allow-headers'] = '*';
    headers['access-control-allow-credentials'] = 'true';
    return headers;
  },
  proxyReqOptDecorator(proxyReqOpts, srcReq) {
    // Target server ko convince karna ki request authentic origin se hai
    proxyReqOpts.headers['Referer'] = TARGET_URL;
    proxyReqOpts.headers['Origin'] = TARGET_URL;
    proxyReqOpts.headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
    return proxyReqOpts;
  },
  userResDecorator: function(proxyRes, proxyResData, userReq, userRes) {
    let contentType = proxyRes.headers['content-type'] || '';
    
    // Sirf HTML Content me Brand Modifications karna
    if (contentType.includes('text/html')) {
      let html = proxyResData.toString('utf8');
      
      // Hardcoded API Domains Rewrite
      html = html.replaceAll('https://vidcloud.eu.org', '');
      
      // Title & Logo Edit
      html = html.replace(/<title>.*?<\/title>/gi, '<title>AURA MAX</title>');
      
      return html;
    }
    // Baaki saare JSON/Batch APIs, Videos, & CSS/JS raw Pass-Through honge
    return proxyResData;
  }
}));

module.exports = app;
