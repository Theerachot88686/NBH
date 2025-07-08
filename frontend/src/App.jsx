import { useState } from 'react';
import axios from 'axios';

export default function AddDevice() {
  const [form, setForm] = useState({
    name: '',
    code: '',
    brand: '',
    model: '',
    details: '',
  });
  const [qr, setQr] = useState('');
  const [device, setDevice] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/devices', form);
      setQr(res.data.qr);
      setDevice(res.data.device);
      setShowModal(true);
      setErrorMsg('');
    } catch (error) {
      if (error.response && error.response.data && error.response.data.error) {
        setErrorMsg(error.response.data.error);
      } else {
        setErrorMsg('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4 py-10">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-700">
          เพิ่มข้อมูลอุปกรณ์
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {Object.entries(form).map(([key, value]) => (
            <div key={key}>
              <label className="block text-gray-700 capitalize mb-1">{key}</label>
              <input
                type="text"
                name={key}
                value={value}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder={`กรอก ${key}`}
                required
              />
            </div>
          ))}

          {errorMsg && (
            <p className="text-red-600 text-sm mt-1 text-center font-medium">{errorMsg}</p>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition"
          >
            บันทึกอุปกรณ์
          </button>
        </form>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-xl p-8 w-full max-w-2xl shadow-lg relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl"
              aria-label="Close modal"
            >
              ✕
            </button>

            <h3 className="text-2xl font-semibold mb-6 text-center">QR Code สำหรับอุปกรณ์</h3>

            {/* ปุ่มพิมพ์ */}
            <div className="text-center mb-6">
              <button
                onClick={() => window.print()}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              >
                พิมพ์ QR Code
              </button>
            </div>

            <img
              src={qr}
              alt="QR Code"
              className="mx-auto rounded shadow-md max-w-full h-auto mb-6"
            />

            {/* รายละเอียดอุปกรณ์ */}
            {device && (
              <div className="text-gray-700 max-w-md mx-auto">
                <h4 className="text-xl font-semibold mb-3 text-center">รายละเอียดอุปกรณ์</h4>
                <ul className="space-y-2">
                  <li><strong>ชื่อ:</strong> {device.name}</li>
                  <li><strong>รหัส:</strong> {device.code}</li>
                  <li><strong>แบรนด์:</strong> {device.brand}</li>
                  <li><strong>รุ่น:</strong> {device.model}</li>
                  <li><strong>รายละเอียด:</strong> {device.details}</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
