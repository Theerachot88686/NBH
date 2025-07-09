const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const QRCode = require('qrcode');

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

// ดึงข้อมูลอุปกรณ์ทั้งหมด (เรียง id DESC)
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

// ดูข้อมูลอุปกรณ์ตาม id
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

// เพิ่มอุปกรณ์ พร้อมสร้าง QR code เก็บใน DB

app.post('/api/devices/:id/qrcode', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const device = await prisma.device.findUnique({ where: { id } });

    if (!device) {
      return res.status(404).json({ error: 'ไม่พบอุปกรณ์' });
    }

    // แก้ตรงนี้ให้เป็น URL หน้าแสดงข้อมูล ไม่ใช่ API
    const qrData = `https://nbh-6j1m.onrender.com/device/${device.code}`;
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



// แก้ไขข้อมูลอุปกรณ์พร้อมอัปเดต QR code (ถ้า code เปลี่ยน)
app.put('/api/devices/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, code, brand, model, details } = req.body;

  try {
    // ตรวจสอบว่า code ซ้ำกับ device อื่นหรือไม่
    const existing = await prisma.device.findFirst({
      where: {
        code,
        NOT: { id }, // ยกเว้นตัวที่กำลังแก้
      },
    });

    if (existing) {
      return res
        .status(400)
        .json({ error: 'รหัสอุปกรณ์ซ้ำกับอุปกรณ์อื่น ไม่สามารถแก้ไขได้' });
    }

    const qrData = `http://localhost:5173/device/${code}`;
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


// ลบอุปกรณ์ตาม id
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

app.post('/api/devices', async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: 'ไม่มีข้อมูลในคำขอ' });
    }

    const { name, code, brand, model, details } = req.body;

    if (!name || !code || !brand || !model) {
      return res.status(400).json({ error: 'กรุณาระบุข้อมูลให้ครบถ้วน' });
    }

    const qrData = `http://localhost:5173/device/${code}`;
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




app.listen(5000, () => console.log('🚀 Server ready on http://localhost:5000'));
