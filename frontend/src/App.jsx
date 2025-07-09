import React, { useEffect, useState } from "react";

// ✅ ดึงจาก .env (ห้ามใส่ไว้ใน function)
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
      setFormData({
        name: "",
        code: "",
        brand: "",
        model: "",
        details: "",
      });
    } catch (err) {
      setFormError(err.message || "เกิดข้อผิดพลาด");
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "auto", padding: 20, fontFamily: "Arial" }}>
      <h1>ระบบจัดการอุปกรณ์</h1>

      <input
        type="text"
        placeholder="ค้นหาชื่อ หรือ รหัสอุปกรณ์..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{
          width: "100%",
          padding: 8,
          marginBottom: 20,
          fontSize: 16,
          boxSizing: "border-box",
        }}
      />

      <button
        onClick={() => setFormVisible(!formVisible)}
        style={{ marginBottom: 20, padding: "8px 16px", cursor: "pointer" }}
      >
        {formVisible ? "ยกเลิก" : "เพิ่มรายการใหม่"}
      </button>

      {formVisible && (
        <form onSubmit={handleAddDevice} style={{ marginBottom: 20, border: "1px solid #ccc", padding: 20 }}>
          {["name", "code", "brand", "model"].map((field) => (
            <div style={{ marginBottom: 10 }} key={field}>
              <label>{field === "name" ? "ชื่ออุปกรณ์" : field === "code" ? "รหัสอุปกรณ์" : field === "brand" ? "ยี่ห้อ" : "รุ่น"}*:</label>
              <br />
              <input
                type="text"
                name={field}
                value={formData[field]}
                onChange={handleInputChange}
                required
                style={{ width: "100%", padding: 6 }}
              />
            </div>
          ))}
          <div style={{ marginBottom: 10 }}>
            <label>รายละเอียดเพิ่มเติม:</label>
            <br />
            <textarea
              name="details"
              value={formData.details}
              onChange={handleInputChange}
              rows={3}
              style={{ width: "100%", padding: 6 }}
            />
          </div>

          {formError && <div style={{ color: "red", marginBottom: 10 }}>{formError}</div>}

          <button type="submit" style={{ padding: "8px 16px", cursor: "pointer" }}>
            บันทึกอุปกรณ์ และสร้าง QR Code
          </button>
        </form>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}
      {loading && <p>กำลังโหลดข้อมูล...</p>}

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          textAlign: "left",
          fontSize: 14,
        }}
      >
        <thead>
          <tr>
            <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>ID</th>
            <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>รหัส</th>
            <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>ชื่อ</th>
            <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>ยี่ห้อ</th>
            <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>รุ่น</th>
            <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>QR Code</th>
          </tr>
        </thead>
        <tbody>
          {filteredDevices.length === 0 && (
            <tr>
              <td colSpan={6} style={{ padding: 8, textAlign: "center" }}>
                ไม่พบข้อมูลอุปกรณ์
              </td>
            </tr>
          )}
          {filteredDevices.map((d) => (
            <tr key={d.id}>
              <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{d.id}</td>
              <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{d.code}</td>
              <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{d.name}</td>
              <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{d.brand}</td>
              <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{d.model}</td>
              <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                {d.qrCode ? (
                  <a href={`${API_BASE_URL.replace('/api', '')}/device/${d.code}`} target="_blank" rel="noopener noreferrer">
                    <img src={d.qrCode} alt={`QR Code for ${d.code}`} width={80} height={80} style={{ objectFit: "contain" }} />
                  </a>
                ) : (
                  "-"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
