// server.js
const express = require('express');
const path = require('path');

function startBackendServer() {
  return new Promise((resolve) => {
    const app = express();

    app.use(express.json());

    // Your exact proxy endpoint
    app.get("/api/proxy-image", async (req, res) => {
      const imageUrl = req.query.url;
      if (!imageUrl) return res.status(400).send("URL is required");

      try {
        // Node 18+ (which Electron uses) has built-in fetch
        const response = await fetch(imageUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Accept': 'image/*, */*'
          }
        });
        
        if (!response.ok) {
          return res.status(response.status).send(`Failed to fetch image`);
        }
        
        const contentType = response.headers.get("content-type");
        if (contentType) res.setHeader("Content-Type", contentType);
        
        res.setHeader("Cache-Control", "public, max-age=3600");
        
        const arrayBuffer = await response.arrayBuffer();
        res.send(Buffer.from(arrayBuffer));
      } catch (error) {
        console.error("Proxy error:", error);
        res.status(500).send("Failed to proxy image");
      }
    });

    // Serve your /dist folder statically
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });

    // Start on Port 0 (Random available port) to prevent collisions
    const server = app.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      resolve(port); // Return the port number so Electron knows where to look!
    });
  });
}

module.exports = startBackendServer;
