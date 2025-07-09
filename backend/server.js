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
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="th">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <script src="https://cdn.tailwindcss.com"></script>
            <title>ไม่พบอุปกรณ์</title>
          </head>
          <body class="bg-red-50 text-center pt-20 text-red-600 text-xl font-semibold">
            ❌ ไม่พบอุปกรณ์ที่คุณต้องการค้นหา
          </body>
        </html>
      `);
    }

    res.send(`
      <!DOCTYPE html>
      <html lang="th">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <script src="https://cdn.tailwindcss.com"></script>
          <title>ข้อมูลอุปกรณ์ - ${device.name}</title>
        </head>
        <body class="bg-gradient-to-br from-blue-50 to-white text-gray-800 font-sans">
          <div class="max-w-xl mx-auto p-6 mt-12 bg-white rounded-xl shadow-xl border border-gray-200">
            <h1 class="text-3xl font-bold text-blue-700 text-center mb-6">📦 ข้อมูลอุปกรณ์</h1>

            <div class="grid grid-cols-1 gap-4 text-base">
              <p><span class="font-semibold text-gray-700">📛 ชื่อ:</span> ${device.name}</p>
              <p><span class="font-semibold text-gray-700">🔢 รหัส:</span> ${device.code}</p>
              <p><span class="font-semibold text-gray-700">🏷️ ยี่ห้อ:</span> ${device.brand}</p>
              <p><span class="font-semibold text-gray-700">🛠️ รุ่น:</span> ${device.model}</p>
              <p><span class="font-semibold text-gray-700">📝 รายละเอียด:</span> ${device.details || '-'}</p>
            </div>

            ${
              device.qrCode
                ? `<div class="mt-6 text-center">
                    <img src="${device.qrCode}" alt="QR Code" class="mx-auto w-40 h-40 object-contain border border-gray-300 rounded shadow-sm" />
                    <p class="mt-2 text-sm text-gray-500">QR Code สำหรับลิงก์หน้านี้</p>
                  </div>`
                : ''
            }

            <div class="mt-8 text-center">
              <a href="/" class="inline-block text-blue-600 hover:text-blue-800 underline text-sm">← กลับหน้าหลัก</a>
            </div>
          </div>
        </body>
      </html>
    `);
  } catch (err) {
    console.error('Error in GET /device/:code:', err);
    res.status(500).send(`
      <!DOCTYPE html>
      <html lang="th">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <script src="https://cdn.tailwindcss.com"></script>
          <title>เกิดข้อผิดพลาด</title>
        </head>
        <body class="bg-red-50 text-center pt-20 text-red-600 text-xl font-semibold">
          ⚠️ เกิดข้อผิดพลาดในระบบ
        </body>
      </html>
    `);
  }
});



// เริ่มเซิร์ฟเวอร์
app.listen(5000, () => console.log('🚀 Server ready on https://nbh-1.onrender.com'));
