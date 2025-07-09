import React, { useEffect, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://nbh-1.onrender.com";

export default function DeviceManager() {
  const [devices, setDevices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formVisible, setFormVisible] = useState(false);
  const [formData, setFormData] = useState({
    brand: "",
    model: "",
    price: "",
    createdAt: "",
    details: "",
    location: "",
  });
  const [formError, setFormError] = useState("");
  const [editingDeviceId, setEditingDeviceId] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "asc" });

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditClick = (device) => {
    setFormData({
      brand: device.brand || "",
      model: device.model || "",
      price: device.price != null ? device.price : "",
      createdAt: device.createdAt ? device.createdAt.split("T")[0] : "",
      details: device.details || "",
      location: device.location || "",
    });
    setEditingDeviceId(device.id);
    setFormVisible(true);
    setFormError("");
  };

  const handleDeleteClick = async (id) => {
    if (!confirm("ต้องการลบอุปกรณ์นี้ใช่หรือไม่?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/devices/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("ลบข้อมูลไม่สำเร็จ");
      setDevices((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      alert(err.message || "เกิดข้อผิดพลาดในการลบข้อมูล");
    }
  };

  const handleSaveDevice = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.brand || !formData.model || !formData.location) {
      setFormError("กรุณากรอกข้อมูลให้ครบทุกช่องที่จำเป็น");
      return;
    }

    const payload = {
      brand: formData.brand,
      model: formData.model,
      price: formData.price ? Number(formData.price) : null,
      createdAt: formData.createdAt || undefined,
      details: formData.details || "",
      location: formData.location || "",
    };

    try {
      const method = editingDeviceId ? "PUT" : "POST";
      const url = editingDeviceId
        ? `${API_BASE_URL}/api/devices/${editingDeviceId}`
        : `${API_BASE_URL}/api/devices`;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        return;
      }

      if (editingDeviceId) {
        setDevices((prev) =>
          prev.map((d) => (d.id === editingDeviceId ? data : d))
        );
      } else {
        setDevices((prev) => [data, ...prev]);
      }

      setFormVisible(false);
      setFormData({
        brand: "",
        model: "",
        price: "",
        createdAt: "",
        details: "",
        location: "",
      });
      setEditingDeviceId(null);
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

  const handlePrint = (qrSrc, deviceInfo = {}) => {
    const {
      id = "",
      brand = "",
      model = "",
      price = "",
      createdAt = "",
      details = "",
      location = "",
    } = deviceInfo;

    const priceText =
      price != null && price !== ""
        ? `${Number(price).toLocaleString("th-TH")} บาท`
        : "-";
    const createdAtText = createdAt
      ? new Date(createdAt).toLocaleDateString("th-TH", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "-";
    const detailsText = details || "-";
    const locationText = location || "-";

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Code</title>
          <style>
            body { font-family: sans-serif; margin: 30px; background: #fff; color: #333; }
            .container { display: flex; gap: 20px; background: white; padding: 20px; border-radius: 10px; }
            .qr { width: 300px; height: 300px; object-fit: contain; border: 1px solid #ccc; }
            .info { font-size: 16px; line-height: 1.6; }
            .label { font-weight: bold; min-width: 100px; display: inline-block; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="container">
            <img src="${qrSrc}" class="qr" alt="QR Code" />
            <div class="info">
              <div><span class="label">เลขคุมครุภัณฑ์:</span> ${id}</div>
              <div><span class="label">ยี่ห้อ:</span> ${brand}</div>
              <div><span class="label">รุ่น:</span> ${model}</div>
              <div><span class="label">ราคา:</span> ${priceText}</div>
              <div><span class="label">วันลงบันทึก:</span> ${createdAtText}</div>
              <div><span class="label">รายละเอียด:</span> ${detailsText}</div>
              <div><span class="label">สถานที่จัดเก็บ:</span> ${locationText}</div>
            </div>
          </div>
          <script> window.onload = () => { window.print(); window.onafterprint = () => window.close(); }; </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedDevices = React.useMemo(() => {
    let sortableDevices = [...devices];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      sortableDevices = sortableDevices.filter(
        (d) =>
          (d.brand && d.brand.toLowerCase().includes(term)) ||
          (d.model && d.model.toLowerCase().includes(term)) ||
          (d.details && d.details.toLowerCase().includes(term)) ||
          (d.location && d.location.toLowerCase().includes(term))
      );
    }
    sortableDevices.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (sortConfig.key === "price") {
        aVal = aVal != null ? Number(aVal) : 0;
        bVal = bVal != null ? Number(bVal) : 0;
      } else if (sortConfig.key === "createdAt") {
        aVal = aVal ? new Date(aVal).getTime() : 0;
        bVal = bVal ? new Date(bVal).getTime() : 0;
      } else if (sortConfig.key === "id") {
        aVal = aVal || 0;
        bVal = bVal || 0;
      } else {
        aVal = aVal ? aVal.toString().toLowerCase() : "";
        bVal = bVal ? bVal.toString().toLowerCase() : "";
      }

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
    return sortableDevices;
  }, [devices, searchTerm, sortConfig]);

  return (
    <div className="px-4 py-6 font-sans">
      <h1 className="text-4xl font-bold text-center mb-10 text-gray-800 tracking-tight font-sans">
        📦 ระบบจัดการอุปกรณ์
      </h1>

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <input
          type="text"
          placeholder="🔍 ค้นหายี่ห้อ, รุ่น หรือรายละเอียด..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-96 border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-4 focus:ring-blue-400 focus:outline-none transition"
        />
        <button
          onClick={() => {
            setFormVisible(!formVisible);
            setFormError("");
            setEditingDeviceId(null);
            setFormData({
              brand: "",
              model: "",
              price: "",
              createdAt: "",
              details: "",
              location: "",
            });
          }}
          className={`flex items-center gap-2 px-5 py-3 rounded-lg text-white text-base font-semibold shadow-md transition
            ${formVisible ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}
          `}
          aria-label={formVisible ? "ยกเลิกการเพิ่มอุปกรณ์" : "เพิ่มอุปกรณ์ใหม่"}
        >
          {formVisible ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              ยกเลิก
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              เพิ่มอุปกรณ์
            </>
          )}
        </button>
      </div>

      {formVisible && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setFormVisible(false)}
          aria-modal="true"
          role="dialog"
          aria-labelledby="modal-title"
        >
          <form
            onSubmit={(e) => {
              e.stopPropagation();
              handleSaveDevice(e);
            }}
            className="bg-white rounded-xl shadow-lg p-6 max-w-lg w-full mx-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setFormVisible(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 focus:outline-none"
              aria-label="ปิดฟอร์ม"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {editingDeviceId && (
              <div className="mb-5">
                <label className="block mb-2 font-semibold text-gray-700">เลขคุมครุภัณฑ์:</label>
                <input
                  type="text"
                  value={editingDeviceId}
                  disabled
                  className="w-full border border-gray-300 px-4 py-3 rounded-lg bg-gray-100 cursor-not-allowed text-gray-600"
                />
              </div>
            )}

            {["brand", "model"].map((field) => (
              <div className="mb-5" key={field}>
                <label className="block mb-2 font-semibold text-gray-700">
                  {field === "brand" ? "ยี่ห้อ" : "รุ่น"}*:
                </label>
                <input
                  type="text"
                  name={field}
                  value={formData[field]}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
                />
              </div>
            ))}

            <div className="mb-5">
              <label className="block mb-2 font-semibold text-gray-700">สถานที่จัดเก็บ*:</label>
              <input
                type="text"
                name="location"
                value={formData.location ?? ""}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
              />
            </div>

            <div className="mb-5">
              <label className="block mb-2 font-semibold text-gray-700">ราคา (บาท):</label>
              <input
                type="number"
                name="price"
                value={formData.price ?? ""}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
              />
            </div>

            <div className="mb-5">
              <label className="block mb-2 font-semibold text-gray-700">วันลงบันทึก:</label>
              <input
                type="date"
                name="createdAt"
                value={formData.createdAt}
                onChange={handleInputChange}
                className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
              />
            </div>

            <div className="mb-5">
              <label className="block mb-2 font-semibold text-gray-700">รายละเรียดเติมเติม:</label>
              <textarea
                name="details"
                value={formData.details}
                onChange={handleInputChange}
                rows={3}
                className="w-full border border-gray-300 px-4 py-3 rounded-lg resize-none focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
                placeholder="ระบุรายละเพิ่มเติม (ถ้ามี)"
              />
            </div>

            {formError && (
              <p className="text-red-600 mb-4 text-sm font-medium">{formError}</p>
            )}

            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold text-lg shadow-md transition"
              aria-label={editingDeviceId ? "บันทึกการแก้ไขอุปกรณ์" : "บันทึกอุปกรณ์ใหม่"}
            >
              {editingDeviceId ? "📎 บันทึกการแก้ไข" : "✅ บันทึก"}
            </button>
          </form>
        </div>
      )}

      {error && <p className="text-red-600 mb-4 text-center font-semibold">{error}</p>}
      {loading && <p className="text-center text-gray-600 italic">กำลังโหลดข้อมูล...</p>}

      <div className="overflow-x-auto rounded-lg shadow-lg border border-gray-200">
        <table className="min-w-full table-auto border-collapse">
         <thead className="bg-gradient-to-r from-blue-500 to-blue-600 text-white select-none">
  <tr>
    {[
      { key: "id", label: "เลขคุมครุภัณฑ์" },
      { key: "brand", label: "ยี่ห้อ" },
      { key: "model", label: "รุ่น" },
      { key: "price", label: "ราคา" },
      { key: "createdAt", label: "วันลงบันทึก" },
      { key: "location", label: "สถานที่จัดเก็บ" }, // เพิ่มตรงนี้
      { key: "details", label: "รายละเอียด" },
      { key: "qrCode", label: "QR Code" },
      { key: "actions", label: "จัดการ" },
    ].map(({ key, label }) => (
      <th
        key={key}
        className={`px-6 py-3 text-left text-sm font-semibold ${
          key !== "actions" && key !== "qrCode"
            ? "cursor-pointer select-none"
            : ""
        }`}
        onClick={
          key !== "actions" && key !== "qrCode"
            ? () => handleSort(key)
            : undefined
        }
        role={key !== "actions" && key !== "qrCode" ? "button" : undefined}
        tabIndex={key !== "actions" && key !== "qrCode" ? 0 : undefined}
        aria-sort={
          sortConfig.key === key
            ? sortConfig.direction === "asc"
              ? "ascending"
              : "descending"
            : "none"
        }
      >
        <div className="flex items-center gap-1 select-none">
          {label}
          {sortConfig.key === key && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-4 w-4 transition-transform ${
                sortConfig.direction === "asc" ? "" : "rotate-180"
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          )}
        </div>
      </th>
    ))}
  </tr>
</thead>
<tbody className="bg-white divide-y divide-gray-200">
  {sortedDevices.length === 0 ? (
    <tr>
      <td colSpan={9} className="py-6 text-center text-gray-500 font-medium">
        ไม่พบข้อมูลอุปกรณ์
      </td>
    </tr>
  ) : (
    sortedDevices.map((d) => (
      <tr
        key={d.id}
        className="hover:bg-gray-50 transition-colors duration-150"
        tabIndex={0}
      >
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">{d.id}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{d.brand}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{d.model}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
          {d.price != null ? d.price.toLocaleString("th-TH") + " บาท" : "-"}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
          {d.createdAt
            ? new Date(d.createdAt).toLocaleDateString("th-TH", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : "-"}
        </td>
        <td className="px-6 py-4 whitespace-nowrap max-w-xs truncate text-sm text-gray-700">
          {d.location || "-"}
        </td>
        <td className="px-6 py-4 max-w-xs truncate text-sm text-gray-700">{d.details || "-"}</td>
        <td className="px-6 py-4 whitespace-nowrap text-center">
          {d.qrCode ? (
            <div className="flex flex-col items-center gap-2">
              <a
                href={`${API_BASE_URL.replace("/api", "")}/device/${d.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block hover:scale-110 transform transition-transform"
                title={`ดู QR Code อุปกรณ์ ${d.id}`}
              >
                <img
                  src={d.qrCode}
                  alt={`QR Code for device ${d.id}`}
                  className="w-20 h-20 object-contain rounded-md shadow-md border border-gray-300"
                />
              </a>
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => regenerateQRCode(d.id)}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold text-xs px-2 py-1 rounded-md border border-blue-600 hover:border-blue-800 transition"
                  aria-label={`สร้าง QR Code ใหม่สำหรับอุปกรณ์ ${d.id}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.276 11.276A9 9 0 104.582 9H4v5h.582m15.276 11.276L20 20" />
                  </svg>
                  สร้างใหม่
                </button>
                <button
                  onClick={() =>
                    handlePrint(d.qrCode, {
                      id: d.id,
                      brand: d.brand,
                      model: d.model,
                      price: d.price,
                      createdAt: d.createdAt,
                      details: d.details || "-",
                      location: d.location || "-",
                    })
                  }
                  className="flex items-center gap-1 text-green-600 hover:text-green-800 font-semibold text-xs px-2 py-1 rounded-md border border-green-600 hover:border-green-800 transition"
                  title="พิมพ์ข้อมูลอุปกรณ์"
                  aria-label={`พิมพ์ข้อมูลของอุปกรณ์ ${d.brand} รุ่น ${d.model}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9v6m6-6v6m6-6v6M4 7h16M4 7v10a2 2 0 002 2h12a2 2 0 002-2V7" />
                  </svg>
                  ปริ้น
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => regenerateQRCode(d.id)}
              className="text-blue-600 hover:text-blue-800 font-semibold text-sm underline"
            >
              สร้าง QR Code
            </button>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap flex gap-3 justify-center">
          <button
            onClick={() => handleEditClick(d)}
            className="flex items-center gap-1 text-yellow-500 hover:text-yellow-700 font-semibold text-sm px-3 py-1 rounded-md border border-yellow-500 hover:border-yellow-700 transition"
            aria-label={`แก้ไขอุปกรณ์ ${d.brand} รุ่น ${d.model}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5h6m2 2v10a2 2 0 01-2 2H7l-4 4V7a2 2 0 012-2h8z" />
            </svg>
            แก้ไข
          </button>
          <button
            onClick={() => handleDeleteClick(d.id)}
            className="flex items-center gap-1 text-red-600 hover:text-red-800 font-semibold text-sm px-3 py-1 rounded-md border border-red-600 hover:border-red-800 transition"
            aria-label={`ลบอุปกรณ์ ${d.brand} รุ่น ${d.model}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            ลบ
          </button>
        </td>
      </tr>
    ))
  )}
</tbody>
      </table>
    </div>
  </div>
);

}
