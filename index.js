const express = require('express');
const cors = require('cors');
const { WhatsAppClientManager } = require('./whatsapp-manager');
const { format } = require('date-fns');

const port = process.env.PORT || 8080;
const app = express();
app.use(express.json({ limit: "20mb" }));
app.use(cors());

// WhatsApp client manager (single session)
const whatsappManager = new WhatsAppClientManager();

app.post('/whatsapp/init-session', async (req, res) => {
  try {
    const result = await whatsappManager.initSession();
    console.log('Result', result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/send', async (req, res) => {
  var { to, message, fileName, mimeType, base64data } = req.body;
  mimeType = mimeType || "application/pdf"
  message = "Terima kasih sudah sewa di Timur Outdoor ✨ Semoga perlengkapan kami bikin kegiatanmu lebih nyaman dan berkesan. Ditunggu sewa berikutnya ya!"
  fileName = fileName || `Nota - ${format(new Date(), "dd MMMM yyyy, HH:mm")}`
  try {
    const result = await whatsappManager.sendMessage(message, to, fileName, mimeType, base64data);
    console.log('Result', result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/whatsapp/session-status', async (req, res) => {
  try {
    const status = whatsappManager.checkSessionStatus();
    res.json({ status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.listen(port, () => console.info(`Server on port ${port}`))