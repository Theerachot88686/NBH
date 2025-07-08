import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

export default function DeviceDetails() {
  const { id } = useParams();
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchDevice() {
      try {
        const res = await axios.get(`http://localhost:5000/api/devices/${id}`);
        setDevice(res.data);
      } catch (err) {
        setError('ไม่พบข้อมูลอุปกรณ์');
      } finally {
        setLoading(false);
      }
    }
    fetchDevice();
  }, [id]);

  if (loading) return <p className="text-center mt-10">กำลังโหลดข้อมูล...</p>;
  if (error) return <p className="text-center mt-10 text-red-600">{error}</p>;

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4 text-green-700">ข้อมูลอุปกรณ์</h2>
      <ul className="space-y-2 text-gray-700">
        <li><strong>ชื่อ:</strong> {device.name}</li>
        <li><strong>รหัส:</strong> {device.code}</li>
        <li><strong>แบรนด์:</strong> {device.brand}</li>
        <li><strong>รุ่น:</strong> {device.model}</li>
        <li><strong>รายละเอียด:</strong> {device.details}</li>
      </ul>
    </div>
  );
}
