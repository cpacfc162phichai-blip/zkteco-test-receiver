// ZKTeco ADMS Test Receiver
// ใช้ทดสอบว่าเครื่องสแกนเชื่อมต่อเซิร์ฟเวอร์นี้สำเร็จหรือไม่
// รันด้วย: node server.js  (ต้องมี Node.js และรัน npm install express ก่อน)

const express = require('express');
const app = express();
app.use(express.text({ type: '*/*', limit: '5mb' }));

const PORT = process.env.PORT || 8080;

// เก็บ log ไว้ในหน่วยความจำ (สำหรับทดสอบเท่านั้น ไม่ใช่ฐานข้อมูลจริง)
let logs = [];

function addLog(entry) {
  logs.unshift({ time: new Date().toISOString(), ...entry });
  if (logs.length > 200) logs.pop();
}

// เครื่องสแกนจะเรียก endpoint นี้เป็นระยะเพื่อ "เช็คอิน" และถามว่ามีคำสั่งอะไรไหม
app.get('/iclock/getrequest', (req, res) => {
  addLog({ type: 'getrequest (heartbeat)', query: req.query, ip: req.ip });
  console.log('[getrequest] เครื่องเช็คอิน:', req.query);
  res.send('OK');
});

// เครื่องสแกนจะ POST ข้อมูลสแกนจริง (ATTLOG) มาที่นี่
app.post('/iclock/cdata', (req, res) => {
  addLog({ type: 'cdata (ข้อมูลสแกน)', query: req.query, body: req.body, ip: req.ip });
  console.log('[cdata] ได้รับข้อมูล:', req.query, req.body);
  res.send('OK');
});

// เผื่อบางรุ่นเรียกแบบ GET ตอนลงทะเบียนครั้งแรก
app.get('/iclock/cdata', (req, res) => {
  addLog({ type: 'cdata (GET - ลงทะเบียนเครื่อง)', query: req.query, ip: req.ip });
  console.log('[cdata GET] เครื่องลงทะเบียน:', req.query);
  res.send('OK');
});

// หน้าเว็บดู log แบบง่าย ๆ
app.get('/', (req, res) => {
  const rows = logs.map(l => `
    <tr>
      <td>${l.time}</td>
      <td>${l.type}</td>
      <td>${l.ip}</td>
      <td><pre>${JSON.stringify(l.query)}</pre></td>
      <td><pre>${(l.body || '').toString().slice(0, 300)}</pre></td>
    </tr>`).join('');

  res.send(`
    <html><head><meta charset="utf-8"><title>ZKTeco Test Receiver</title>
    <meta http-equiv="refresh" content="5">
    <style>
      body{font-family:sans-serif;margin:20px;background:#f5f5f5}
      table{width:100%;border-collapse:collapse;background:#fff}
      td,th{border:1px solid #ddd;padding:8px;font-size:13px;vertical-align:top}
      th{background:#333;color:#fff}
      h1{color:#222}
      .status{padding:10px;background:${logs.length ? '#d4edda' : '#fff3cd'};border-radius:6px;margin-bottom:15px}
      pre{white-space:pre-wrap;margin:0;font-size:11px}
    </style></head>
    <body>
      <h1>ZKTeco ADMS Test Receiver</h1>
      <div class="status">
        ${logs.length
          ? `✅ ได้รับการเชื่อมต่อแล้ว ${logs.length} ครั้ง — ระบบทำงานถูกต้อง`
          : '⏳ ยังไม่มีเครื่องสแกนติดต่อเข้ามา — ตรวจสอบการตั้งค่า Server Address/Port ในเครื่อง'}
      </div>
      <p>หน้านี้รีเฟรชอัตโนมัติทุก 5 วินาที</p>
      <table>
        <tr><th>เวลา</th><th>ประเภท</th><th>IP เครื่อง</th><th>Query</th><th>ข้อมูล</th></tr>
        ${rows || '<tr><td colspan="5">ยังไม่มีข้อมูล</td></tr>'}
      </table>
    </body></html>
  `);
});

app.listen(PORT, () => {
  console.log(`ZKTeco test receiver พร้อมทำงานที่พอร์ต ${PORT}`);
});
