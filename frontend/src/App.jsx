import React, { useEffect, useState, useRef } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://nbh-1.onrender.com";

export default function DeviceManager() {
  const [devices, setDevices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formVisible, setFormVisible] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    brand: "",
    model: "",
    details: "",
  });
  const [formError, setFormError] = useState("");

  const fetchDevices = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/devices`);
      if (!res.ok) throw new Error("โหลดข้อมูลล้มเหลว");
      const data = await res.json();
      setDevices(data);
    } catch (err) {
      setError(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const filteredDevices = devices.filter(
    (d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddDevice = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.name || !formData.code || !formData.brand || !formData.model) {
      setFormError("กรุณากรอกข้อมูลให้ครบทุกช่องที่จำเป็น");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/devices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        return;
      }

      setDevices((prev) => [data, ...prev]);
      setFormVisible(false);
      setFormData({ name: "", code: "", brand: "", model: "", details: "" });
    } catch (err) {
      setFormError(err.message || "เกิดข้อผิดพลาด");
    }
  };

  const regenerateQRCode = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/devices/${id}/qrcode`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("ไม่สามารถสร้าง QR Code ได้");
      const updated = await res.json();
      setDevices((prev) =>
        prev.map((d) => (d.id === id ? updated.device : d))
      );
    } catch (err) {
      alert(err.message || "เกิดข้อผิดพลาด");
    }
  };

  const handlePrint = (qrSrc) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Code</title>
        </head>
        <body style="display: flex; justify-content: center; align-items: center; height: 100vh;">
          <img src="${qrSrc}" style="width: 300px; height: 300px; object-fit: contain;" />
          <script>
            window.onload = function () {
              window.print();
              window.onafterprint = function () {
                window.close();
              };
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 font-sans">
      <h1 className="text-2xl font-bold mb-4">ระบบจัดการอุปกรณ์</h1>

      <input
        type="text"
        placeholder="ค้นหาชื่อ หรือ รหัสอุปกรณ์..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full border border-gray-300 rounded px-3 py-2 mb-4 text-sm"
      />

      <button
        onClick={() => setFormVisible(!formVisible)}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        {formVisible ? "ยกเลิก" : "เพิ่มรายการใหม่"}
      </button>

      {formVisible && (
        <form onSubmit={handleAddDevice} className="border p-4 mb-6 rounded bg-gray-50">
          {["name", "code", "brand", "model"].map((field) => (
            <div className="mb-4" key={field}>
              <label className="block mb-1 font-medium">
                {field === "name"
                  ? "ชื่ออุปกรณ์"
                  : field === "code"
                  ? "รหัสอุปกรณ์"
                  : field === "brand"
                  ? "ยี่ห้อ"
                  : "รุ่น"}
                *:
              </label>
              <input
                type="text"
                name={field}
                value={formData[field]}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 px-3 py-2 rounded text-sm"
              />
            </div>
          ))}

          <div className="mb-4">
            <label className="block mb-1 font-medium">รายละเอียดเพิ่มเติม:</label>
            <textarea
              name="details"
              value={formData.details}
              onChange={handleInputChange}
              rows={3}
              className="w-full border border-gray-300 px-3 py-2 rounded text-sm"
            />
          </div>

          {formError && <div className="text-red-600 mb-4 text-sm">{formError}</div>}

          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            บันทึกอุปกรณ์ และสร้าง QR Code
          </button>
        </form>
      )}

      {error && <p className="text-red-600 mb-2">{error}</p>}
      {loading && <p>กำลังโหลดข้อมูล...</p>}

      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border-collapse">
          <thead>
            <tr className="bg-gray-100 text-left text-sm">
              <th className="border px-4 py-2">ID</th>
              <th className="border px-4 py-2">รหัส</th>
              <th className="border px-4 py-2">ชื่อ</th>
              <th className="border px-4 py-2">ยี่ห้อ</th>
              <th className="border px-4 py-2">รุ่น</th>
              <th className="border px-4 py-2">QR Code</th>
            </tr>
          </thead>
          <tbody>
            {filteredDevices.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-4 text-gray-500">
                  ไม่พบข้อมูลอุปกรณ์
                </td>
              </tr>
            )}
            {filteredDevices.map((d) => (
              <tr key={d.id} className="text-sm">
                <td className="border px-4 py-2">{d.id}</td>
                <td className="border px-4 py-2">{d.code}</td>
                <td className="border px-4 py-2">{d.name}</td>
                <td className="border px-4 py-2">{d.brand}</td>
                <td className="border px-4 py-2">{d.model}</td>
                <td className="border px-4 py-2">
                  {d.qrCode ? (
                    <div className="flex flex-col items-center gap-2">
                      <a
                        href={`${API_BASE_URL.replace("/api", "")}/device/${d.code}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <img
                          src={d.qrCode}
                          alt={`QR Code for ${d.code}`}
                          className="w-20 h-20 object-contain"
                        />
                      </a>
                      <div className="flex gap-2">
                        <button
                          onClick={() => regenerateQRCode(d.id)}
                          className="text-blue-600 hover:underline text-xs"
                        >
                          สร้างใหม่
                        </button>
                        <button
                          onClick={() => handlePrint(d.qrCode)}
                          className="text-green-600 hover:underline text-xs"
                        >
                          ปริ้น
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => regenerateQRCode(d.id)}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      สร้าง QR Code
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}