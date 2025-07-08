const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const QRCode = require('qrcode');

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

// เพิ่มอุปกรณ์
app.post('/api/devices', async (req, res) => {
  try {
    const { name, code, brand, model, details } = req.body;

    // สร้าง device ใหม่
    const device = await prisma.device.create({
      data: { name, code, brand, model, details },
    });

    // สร้าง QR Code สำหรับ device
    const qrData = `http://localhost:5173/device/${device.id}`;
    const qr = await QRCode.toDataURL(qrData);

    res.json({ device, qr });
  } catch (error) {
    console.error('Error in POST /api/devices:', error);

    // เช็คข้อผิดพลาด unique constraint สำหรับ code ซ้ำ
    if (error.code === 'P2002' && error.meta && error.meta.target.includes('code')) {
      return res.status(400).json({ error: 'รหัสอุปกรณ์ซ้ำ ไม่สามารถบันทึกได้' });
    }

    res.status(500).json({ error: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

// ดูข้อมูลอุปกรณ์ตาม id
app.get('/api/devices/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const device = await prisma.device.findUnique({ where: { id } });
    if (!device) {
      return res.status(404).json({ error: 'ไม่พบอุปกรณ์' });
    }
    res.json(device);
  } catch (error) {
    console.error('Error in GET /api/devices/:id:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

// แก้ไขข้อมูลอุปกรณ์ตาม id
app.put('/api/devices/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, code, brand, model, details } = req.body;

  try {
    const updatedDevice = await prisma.device.update({
      where: { id },
      data: { name, code, brand, model, details },
    });
    res.json(updatedDevice);
  } catch (error) {
    console.error('Error in PUT /api/devices/:id:', error);
    if (error.code === 'P2002' && error.meta && error.meta.target.includes('code')) {
      return res.status(400).json({ error: 'รหัสอุปกรณ์ซ้ำ ไม่สามารถแก้ไขได้' });
    }
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล' });
  }
});

app.listen(5000, () => console.log('🚀 Server ready on http://localhost:5000'));
