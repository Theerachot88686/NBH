import { useSearchParams } from 'react-router-dom';

const [searchParams] = useSearchParams();
const deviceId = searchParams.get('id');


function EditDevice() {
  return (
    <div className="text-center mt-10">
      <h2 className="text-2xl font-bold text-green-700">หน้าแก้ไขอุปกรณ์</h2>
      <p className="text-gray-600 mt-2">อยู่ระหว่างพัฒนา...</p>
    </div>
  );
}

export default EditDevice; // ✅ ต้องมีบรรทัดนี้
