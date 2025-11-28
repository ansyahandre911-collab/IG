const express = require('express');
const { spawn } = require('child_process');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

app.get('/download', async (req, res) => {
  try {
    const target = req.query.url;
    if (!target) return res.status(400).send('Missing url parameter.');
    if (!/^https?:\/\/(www\.)?instagram\.com\//i.test(target))
      return res.status(400).send('URL harus dari instagram.com');

    const ytdlp = spawn('yt-dlp', ['-g', target]);
    let out='', err='';
    ytdlp.stdout.on('data', d=> out+=d.toString());
    ytdlp.stderr.on('data', d=> err+=d.toString());

    ytdlp.on('close', async code=>{
      if(code!==0||!out) return res.status(500).send('Gagal mendapatkan media URL.');
      const mediaUrl = out.split(/\r?\n/).filter(Boolean)[0];
      try{
        const upstream = await fetch(mediaUrl);
        res.setHeader('Content-Type', upstream.headers.get('content-type')||'application/octet-stream');
        const cl=upstream.headers.get('content-length');
        if(cl) res.setHeader('Content-Length', cl);
        res.setHeader('Content-Disposition','attachment; filename="instagram-media"');
        upstream.body.pipe(res);
      }catch(e){ res.status(500).send('Gagal mengunduh media.'); }
    });
  } catch(e){ res.status(500).send('Internal server error'); }
});

app.listen(PORT, ()=> console.log("Server berjalan di http://localhost:"+PORT));
