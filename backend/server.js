const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const QRCode = require('qrcode');
require('dotenv').config();

const prisma = new PrismaClient();
const app = express();
const baseUrl = process.env.BASE_URL || 'http://localhost:5173';

app.use(cors());
app.use(express.json());

// ดึงข้อมูลอุปกรณ์ทั้งหมด
app.get('/api/devices', async (req, res) => {
  try {
    const devices = await prisma.device.findMany({
      orderBy: { id: 'desc' },
    });
    res.json(devices);
  } catch (error) {
    console.error('Error in GET /api/devices:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการโหลดข้อมูลอุปกรณ์' });
  }
});

// ดูข้อมูลจาก code (ใช้สำหรับ QR code)
app.get('/api/devices/code/:code', async (req, res) => {
  const code = req.params.code;
  try {
    const device = await prisma.device.findUnique({ where: { code } });
    if (!device) {
      return res.status(404).json({ error: 'ไม่พบอุปกรณ์' });
    }
    res.json(device);
  } catch (error) {
    console.error('Error in GET /api/devices/code/:code:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

// สร้าง QR Code ใหม่ให้กับอุปกรณ์
app.post('/api/devices/:id/qrcode', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const device = await prisma.device.findUnique({ where: { id } });

    if (!device) {
      return res.status(404).json({ error: 'ไม่พบอุปกรณ์' });
    }

    const qrData = `${baseUrl}/device/${device.code}`;
    const qr = await QRCode.toDataURL(qrData);

    const updated = await prisma.device.update({
      where: { id },
      data: { qrCode: qr },
    });

    res.json({
      message: 'สร้าง QR Code ใหม่เรียบร้อย',
      qrCode: qr,
      device: updated,
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ error: 'ไม่สามารถสร้าง QR Code ได้' });
  }
});

// แก้ไขข้อมูลอุปกรณ์ พร้อมอัปเดต QR code ถ้ารหัสเปลี่ยน
app.put('/api/devices/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, code, brand, model, details } = req.body;

  try {
    const existing = await prisma.device.findFirst({
      where: {
        code,
        NOT: { id },
      },
    });

    if (existing) {
      return res
        .status(400)
        .json({ error: 'รหัสอุปกรณ์ซ้ำกับอุปกรณ์อื่น ไม่สามารถแก้ไขได้' });
    }

    const qrData = `${baseUrl}/device/${code}`;
    const qr = await QRCode.toDataURL(qrData);

    const updatedDevice = await prisma.device.update({
      where: { id },
      data: { name, code, brand, model, details, qrCode: qr },
    });

    res.json(updatedDevice);
  } catch (error) {
    console.error('Error in PUT /api/devices/:id:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล' });
  }
});

// ลบอุปกรณ์
app.delete('/api/devices/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await prisma.device.delete({ where: { id } });
    res.json({ message: 'ลบข้อมูลอุปกรณ์เรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Error in DELETE /api/devices/:id:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลบข้อมูล' });
  }
});

// เพิ่มอุปกรณ์ พร้อมสร้าง QR Code
app.post('/api/devices', async (req, res) => {
  try {
    const { name, code, brand, model, details } = req.body;

    if (!name || !code || !brand || !model) {
      return res.status(400).json({ error: 'กรุณาระบุข้อมูลให้ครบถ้วน' });
    }

    const qrData = `${baseUrl}/device/${code}`;
    const qr = await QRCode.toDataURL(qrData);

    const device = await prisma.device.create({
      data: {
        name,
        code,
        brand,
        model,
        details,
        qrCode: qr || null,
      },
    });

    res.json(device);
  } catch (error) {
    console.error('Error in POST /api/devices:', error);
    if (
      error.code === 'P2002' &&
      error.meta &&
      error.meta.target.includes('code')
    ) {
      return res
        .status(400)
        .json({ error: 'รหัสอุปกรณ์ซ้ำ ไม่สามารถบันทึกได้' });
    }
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});



app.get('/device/:code', async (req, res) => {
  const code = req.params.code;
  try {
    const device = await prisma.device.findUnique({ where: { code } });
    if (!device) {
      return res.status(404).send('<h1>ไม่พบอุปกรณ์</h1>');
    }

    res.send(`
      <html>
        <head><title>ข้อมูลอุปกรณ์</title></head>
        <body>
          <h1>ข้อมูลอุปกรณ์</h1>
          <p><strong>ชื่อ:</strong> ${device.name}</p>
          <p><strong>รหัส:</strong> ${device.code}</p>
          <p><strong>ยี่ห้อ:</strong> ${device.brand}</p>
          <p><strong>รุ่น:</strong> ${device.model}</p>
          <p><strong>รายละเอียด:</strong> ${device.details || '-'}</p>
        </body>
      </html>
    `);
  } catch (err) {
    console.error('Error in GET /device/:code:', err);
    res.status(500).send('<h1>เกิดข้อผิดพลาด</h1>');
  }
});

// เริ่มเซิร์ฟเวอร์
app.listen(5000, () => console.log('🚀 Server ready on http://localhost:5000'));
