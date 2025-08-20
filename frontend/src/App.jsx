import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function DeviceManager() {
  const [devices, setDevices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formVisible, setFormVisible] = useState(false);
  const [formError, setFormError] = useState("");
  const [editingDeviceId, setEditingDeviceId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [formData, setFormData] = useState({
    customCode: "",
    brand: "",
    model: "",
    price: "",
    createdAt: "",
    details: "",
    location: "",
    type: "",
    ipAddress: "",
  });

  const typeOptions = [
    "คอมพิวเตอร์",
    "All in One",
    "เครื่องปริ้น",
    "UPS",
    "WIFI",
    "SW",
    "โทรศัพท์",
  ];

  const locationOptions = [
    "ศูนย์คอมพิวเตอร์",
    "พัสดุ",
    "ห้องบัตร",
  ];

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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, filterLocation]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditClick = (device) => {
    setFormData({
      customCode: device.customCode || "",
      brand: device.brand || "",
      model: device.model || "",
      price: device.price != null ? device.price : "",
      createdAt: device.createdAt ? device.createdAt.split("T")[0] : "",
      details: device.details || "",
      location: device.location || "",
      type: device.type || "",
      ipAddress: device.ipAddress || "",
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

    if (!formData.customCode || !formData.brand || !formData.model || !formData.location || !formData.type) {
      setFormError("กรุณากรอกข้อมูลให้ครบทุกช่องที่จำเป็น");
      return;
    }

    const payload = {
      customCode: formData.customCode,
      brand: formData.brand,
      model: formData.model,
      price: formData.price ? Number(formData.price) : null,
      createdAt: formData.createdAt || undefined,
      details: formData.details || "",
      location: formData.location,
      type: formData.type,
      ipAddress: formData.ipAddress || null,
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
        setDevices((prev) => prev.map((d) => (d.id === editingDeviceId ? data : d)));
      } else {
        setDevices((prev) => [data, ...prev]);
      }

      setFormVisible(false);
      setFormData({
        customCode: "",
        brand: "",
        model: "",
        price: "",
        createdAt: "",
        details: "",
        location: "",
        type: "",
        ipAddress: "",
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
      setDevices((prev) => prev.map((d) => (d.id === id ? updated.device : d)));
    } catch (err) {
      alert(err.message || "เกิดข้อผิดพลาด");
    }
  };


 const handlePrint = (qrSrc, deviceInfo = {}) => {
  // แปลงค่าให้เป็น string และ fallback เป็น "-"
  const id = deviceInfo.id ?? "-";
  const customCode = deviceInfo.customCode ? String(deviceInfo.customCode).trim() || "-" : "-";
  const brand = deviceInfo.brand ? String(deviceInfo.brand).trim() || "-" : "-";
  const model = deviceInfo.model ? String(deviceInfo.model).trim() || "-" : "-";
  const type = deviceInfo.type ? String(deviceInfo.type).trim() || "-" : "-";
  const locationText = deviceInfo.location ? String(deviceInfo.location).trim() || "-" : "-";
  
  const createdAtText = deviceInfo.createdAt
    ? new Date(deviceInfo.createdAt).toLocaleDateString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "-";

  console.log("Device Info for Print:", {
    id, customCode, brand, model, type, locationText, createdAtText
  });

  const printWindow = window.open("", "_blank");
printWindow.document.write(`
  <html>
    <head>
      <style>
        @page { size: 50mm 30mm; margin: 0; }
        html, body { margin:0; padding:0; width:50mm; height:30mm; font-family:sans-serif; }
        .container {
          display:flex;
          align-items:center;
          padding:1mm;           /* ลด padding */
          width:50mm;
          height:30mm;
          box-sizing:border-box;
        }
        .qr {
          width:16mm;
          height:16mm;
          object-fit:contain;
          margin-right:0.5mm;    /* ลดระยะห่างกับรายละเอียด */
        }
        .info {
          font-size:2.3mm;
          line-height:1.2;
          max-width:33mm;        /* เพิ่มพื้นที่ให้รายละเอียด */
          white-space:nowrap;
          overflow:hidden;
          text-overflow:ellipsis;
        }
        .label { font-weight:bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <img src="${qrSrc}" class="qr" alt="QR Code" />
        <div class="info">
          <div>${id}</div>
          <div><span class="label">เลขครุภัณฑ์:</span> ${customCode}</div>
          <div><span class="label">ยี่ห้อ:</span> ${brand}</div>
          <div><span class="label">รุ่น:</span> ${model}</div>
          <div><span class="label">ประเภท:</span> ${type}</div>
          <div><span class="label">หน่วยงาน:</span> ${locationText}</div>
        </div>
      </div>
      <script>
        window.onload = () => {
          window.print();
          window.onafterprint = () => window.close();
        };
      </script>
    </body>
  </html>
`);

  printWindow.document.close();
};


  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "asc" });
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // กรองและค้นหา พร้อมเรียงลำดับ
  const filteredDevices = useMemo(() => {
    let filtered = [...devices];
    if (filterType) {
      filtered = filtered.filter((d) => d.type === filterType);
    }
    if (filterLocation) {
      filtered = filtered.filter((d) => d.location === filterLocation);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          (d.customCode && d.customCode.toLowerCase().includes(term)) ||
          (d.brand && d.brand.toLowerCase().includes(term)) ||
          (d.model && d.model.toLowerCase().includes(term)) ||
          (d.details && d.details.toLowerCase().includes(term)) ||
          (d.location && d.location.toLowerCase().includes(term)) ||
          (d.type && d.type.toLowerCase().includes(term)) ||
          (d.ipAddress && d.ipAddress.toLowerCase().includes(term))
      );
    }

    filtered.sort((a, b) => {
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

    return filtered;
  }, [devices, searchTerm, filterType, filterLocation, sortConfig]);

  const paginatedDevices = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredDevices.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredDevices, currentPage]);

  const totalPages = Math.ceil(filteredDevices.length / itemsPerPage);

  return (
    <div className="px-4 py-6 font-sans">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-10 text-3xl font-extrabold tracking-tight text-white bg-blue-600 rounded-lg py-2 px-4 inline-block shadow-md"
      >
        <motion.span
          animate={{ rotate: [0, 15, -15, 15, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="inline-block mr-2"
        >
          📦
        </motion.span>
        ระบบจัดการอุปกรณ์
      </motion.h1>




      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        {/* กลุ่มฟิลเตอร์ประเภท และหน่วยงาน */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full md:w-auto">
          <select
            aria-label="กรองตามประเภทอุปกรณ์"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="cursor-pointer w-full sm:w-64 border border-gray-300 rounded-lg px-4 py-2 text-base focus:ring-4 focus:ring-blue-400 focus:outline-none transition"
          >
            <option value="">เลือกประเภทอุปกรณ์ทั้งหมด</option>
            {typeOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            aria-label="กรองตามหน่วยงาน"
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="cursor-pointer w-full sm:w-64 border border-gray-300 rounded-lg px-4 py-2 text-base focus:ring-4 focus:ring-blue-400 focus:outline-none transition"
          >
            <option value="">เลือกหน่วยงานทั้งหมด</option>
            {locationOptions.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        {/* กลุ่มค้นหา และปุ่มเพิ่มอุปกรณ์ */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          <input
            type="text"
            placeholder="🔍 ค้นหารหัสอุปกรณ์, ยี่ห้อ, รุ่น, ประเภท, IP, หรือรายละเอียด..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow md:flex-grow-0 w-full md:w-96 border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-4 focus:ring-blue-400 focus:outline-none transition"
            aria-label="ค้นหาอุปกรณ์"
          />
          <button
            onClick={() => {
              setFormVisible(!formVisible);
              setFormError("");
              setEditingDeviceId(null);
              setFormData({
                customCode: "",
                brand: "",
                model: "",
                price: "",
                createdAt: "",
                details: "",
                location: "",
                type: "",
                ipAddress: "",
              });
            }}
            className={`cursor-pointer flex items-center gap-2 px-5 py-3 rounded-lg text-white text-base font-semibold shadow-md transition
    ${formVisible ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}
  `}
            aria-label={formVisible ? "ยกเลิกการเพิ่มอุปกรณ์" : "เพิ่มอุปกรณ์ใหม่"}
          >
            {formVisible ? (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                ยกเลิก
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                เพิ่มอุปกรณ์
              </>
            )}
          </button>

        </div>
      </div>


      {formVisible && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-30 backdrop-blur-sm"
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
            className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-3xl mx-4 animate-fade-in-up relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setFormVisible(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition duration-200"
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

            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
              {editingDeviceId ? "แก้ไขอุปกรณ์" : "เพิ่มอุปกรณ์ใหม่"}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {editingDeviceId && (
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">รหัสอุปกรณ์:</label>
                  <input
                    type="text"
                    value={editingDeviceId}
                    disabled
                    className="mt-1 w-full border border-gray-300 px-4 py-2 rounded-lg bg-gray-100 cursor-not-allowed text-gray-600"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">เลขคุมครุภัณฑ์*:</label>
                <input
                  type="text"
                  name="customCode"
                  value={formData.customCode}
                  onChange={handleInputChange}
                  required
                  className="mt-1 w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">ยี่ห้อ*:</label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  required
                  className="mt-1 w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">รุ่น*:</label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  required
                  className="mt-1 w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">ประเภท*:</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  required
                  className="cursor-pointer mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
                >
                  <option value="">-- เลือกประเภท --</option>
                  {typeOptions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">สถานีที่เก็บ*:</label>
                <select
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                  className=" cursor-pointer mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
                >
                  <option value="">-- เลือกสถานีที่เก็บ --</option>
                  {locationOptions.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">IP Address:</label>
                <input
                  type="text"
                  name="ipAddress"
                  value={formData.ipAddress}
                  onChange={handleInputChange}
                  placeholder="ใส่หรือไม่ใส่ก็ได้"
                  className="mt-1 w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">ราคา (บาท):</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  min={0}
                  className="mt-1 w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="cursor-pointerblock text-sm font-medium text-gray-700">วันที่บันทึก:</label>
                <input
                  type="date"
                  name="createdAt"
                  value={formData.createdAt}
                  onChange={handleInputChange}
                  className="cursor-pointer mt-1 w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">รายละเอียด:</label>
                <textarea
                  name="details"
                  value={formData.details}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-1 w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
                />
              </div>
            </div>

            {formError && (
              <p className="text-red-600 font-semibold mt-4 text-center">{formError}</p>
            )}

            <div className="flex justify-center mt-6 gap-4">
              <button
                type="submit"
                className="cursor-pointer bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                บันทึก
              </button>
              <button
                type="button"
                onClick={() => setFormVisible(false)}
                className="cursor-pointer bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-400 transition"
              >
                ยกเลิก
              </button>
            </div>
          </form>
        </div>
      )}

      {error && (
        <p className="text-red-600 mb-4 text-center font-semibold" role="alert">
          {error}
        </p>
      )}
      {loading && (
        <p className="text-center text-gray-600 italic" aria-live="polite">
          กำลังโหลดข้อมูล...
        </p>
      )}

      <div className="">
        <table
          className="min-w-full table-auto border-collapse rounded-lg overflow-hidden shadow-lg"
          role="table"
          aria-label="ตารางข้อมูลอุปกรณ์"
        >
          {/* หัวตาราง */}
          <thead className="bg-gradient-to-r from-blue-400 via-blue-600 to-indigo-700 text-white select-none">
            <tr>
              {[
                { key: "id", label: "ID" },
                { key: "customCode", label: "รหัสครุภัณฑ์" },
                { key: "location", label: "หน่วยงาน" },
                { key: "type", label: "ประเภท" },
                { key: "brand", label: "ยี่ห้อ" },
                { key: "model", label: "รุ่น" },
                { key: "ipAddress", label: "IP Address" },
                { key: "price", label: "ราคา (บาท)" },
                { key: "createdAt", label: "วันที่บันทึก" },
              ].map(({ key, label }) => (
                <th
                  key={key}
                  scope="col"
                  className="px-4 py-3 font-semibold text-center cursor-pointer relative"
                  onClick={() => handleSort(key)}
                  aria-sort={sortConfig.key === key ? sortConfig.direction : "none"}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleSort(key);
                    }
                  }}
                >
                  <div className="flex items-center justify-center gap-1 select-none">
                    <span>{label}</span>
                    {/* ลูกศรบอกสถานะการเรียง */}
                    {sortConfig.key === key && (
                      <svg
                        className={`w-4 h-4 transition-transform ${sortConfig.direction === "asc" ? "rotate-180" : ""
                          }`}
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    )}
                  </div>
                </th>
              ))}
              <th className="px-4 py-3 font-semibold text-center">QR Code</th>
              <th className="px-4 py-3 font-semibold text-center">จัดการ</th>
            </tr>
          </thead>
          {/* เนื้อหา */}
          <tbody>
            {filteredDevices.length === 0 ? (
              <tr>
                <td colSpan={12} className="text-center py-8 text-gray-400 italic">
                  ไม่พบข้อมูลอุปกรณ์
                </td>
              </tr>
            ) : (
              paginatedDevices.map((device, idx) => (
                <tr
                  key={device.id}
                  className={` transition-colors duration-200 ${idx % 2 === 0 ? "bg-white" : "bg-blue-50"
                    } hover:bg-blue-100`}
                >
                  <td className="px-3 py-2 text-center font-semibold text-sm text-gray-800">{device.id}</td>
                  <td className="px-3 py-2 text-center font-semibold text-sm text-gray-800">{device.customCode}</td>
                  <td className="px-3 py-2 text-center font-semibold text-sm text-gray-800">{device.location}</td>
                  <td className="px-3 py-2 text-center font-semibold text-sm text-gray-800">{device.type}</td>
                  <td className="px-3 py-2 text-center font-semibold text-sm text-gray-800">{device.brand}</td>
                  <td className="px-3 py-2 text-center font-semibold text-sm text-gray-800">{device.model}</td>
                  <td className="px-3 py-2 text-center font-semibold text-sm text-gray-800">{device.ipAddress || "-"}</td>
                  <td className="px-3 py-2 text-center font-semibold text-sm text-gray-800">
                    {device.price != null ? device.price.toLocaleString() : "-"}
                  </td>

                  <td className="px-3 py-2 text-center font-semibold text-sm text-gray-800">
                    {device.createdAt
                      ? new Date(device.createdAt).toLocaleDateString("th-TH", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                      : "-"}
                  </td>


                  {/* QR Code */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {device.qrCode ? (
                      <div className="flex flex-col items-center gap-2">
                        <a
                          href={`${API_BASE_URL.replace("/api", "")}/device/${device.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block hover:scale-110 transform transition-transform duration-200 rounded-lg shadow-lg"
                          title={`ดู QR Code อุปกรณ์ ${device.id}`}
                        >
                          <img
                            src={device.qrCode}
                            alt={`QR Code for device ${device.id}`}
                            className="w-20 h-20 object-contain rounded-md border border-blue-300"
                          />
                        </a>
                        <div className="flex gap-2 mt-1 justify-center">

                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => regenerateQRCode(device.id)}
                        className="text-blue-600 hover:text-blue-800 font-semibold text-sm underline transition"
                      >
                        สร้าง QR Code
                      </button>
                    )}
                  </td>

                  {/* จัดการ */}
                  <td className="px-3 py-2 text-center whitespace-nowrap flex justify-center gap-3">
                    {/* Edit */}
                    <button
                      onClick={() => handleEditClick(device)}
                      className="cursor-pointer bg-yellow-400 hover:bg-yellow-500 text-white p-2 rounded-md shadow-md hover:shadow-lg transform hover:scale-110 transition duration-200 flex items-center justify-center"
                      aria-label={`แก้ไขอุปกรณ์ ${device.customCode}`}
                      title="แก้ไข"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 11l6-6 3 3-6 6H9v-3z" />
                      </svg>
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDeleteClick(device.id)}
                      className="cursor-pointer bg-red-600 hover:bg-red-700 text-white p-2 rounded-md shadow-md hover:shadow-lg transform hover:scale-110 transition duration-200 flex items-center justify-center"
                      aria-label={`ลบอุปกรณ์ ${device.customCode}`}
                      title="ลบ"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4m-4 0a1 1 0 011-1h2a1 1 0 011 1m-4 0h4" />
                      </svg>
                    </button>

                    {/* Regenerate QR */}
                    <button
                      onClick={() => regenerateQRCode(device.id)}
                      className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md shadow-md hover:shadow-lg transform hover:scale-110 transition duration-200 flex items-center justify-center"
                      aria-label={`สร้าง QR Code ใหม่สำหรับอุปกรณ์ ${device.id}`}
                      title="สร้าง QR Code ใหม่"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4 4v5h.582m15.276 11.276A9 9 0 104.582 9H4v5h.582m15.276 11.276L20 20"
                        />
                      </svg>
                    </button>

                    {/* Print */}
<button
  onClick={() =>
    handlePrint(device.qrCode, {
      id: device.id,
      customCode: device.customCode || "-", // ✅ เพิ่มตรงนี้
      type: device.type || "-",            // ✅ เพิ่มตรงนี้
      brand: device.brand,
      model: device.model,
      price: device.price,
      createdAt: device.createdAt,
      details: device.details || "-",
      location: device.location || "-",
    })
  }
  className="cursor-pointer bg-green-600 hover:bg-green-700 text-white p-2 rounded-md shadow-md hover:shadow-lg transform hover:scale-110 transition duration-200 flex items-center justify-center"
  title="พิมพ์ข้อมูลอุปกรณ์"
  aria-label={`พิมพ์ข้อมูลของอุปกรณ์ ${device.brand} รุ่น ${device.model}`}
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 9v6m6-6v6m6-6v6M4 7h16M4 7v10a2 2 0 002 2h12a2 2 0 002-2V7"
    />
  </svg>
</button>

                  </td>




                </tr>
              ))
            )}
          </tbody>


        </table>

      </div>
      {/* Pagination */}
      <div className="flex justify-center mt-6 gap-2 select-none flex-wrap">
        <button
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
          className="cursor-pointer px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
        >
          ก่อนหน้า
        </button>

        {/* แสดงเลขหน้าแบบจำกัด 5 หน้า */}
        {(() => {
          const pageNumbers = [];
          const maxVisiblePages = 5;
          let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
          let endPage = startPage + maxVisiblePages - 1;

          if (endPage > totalPages) {
            endPage = totalPages;
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
          }

          if (startPage > 1) {
            pageNumbers.push(
              <button
                key={1}
                onClick={() => setCurrentPage(1)}
                className={`cursor-pointer px-3 py-1 rounded border border-gray-300 ${currentPage === 1 ? "bg-blue-600 text-white" : "hover:bg-blue-100"}`}
              >
                1
              </button>
            );
            if (startPage > 2) {
              pageNumbers.push(
                <span key="dots-start" className="px-2 py-1 text-gray-500">...</span>
              );
            }
          }

          for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={`cursor-pointer px-3 py-1 rounded border border-gray-300 ${currentPage === i ? "bg-blue-600 text-white" : "hover:bg-blue-100"}`}
              >
                {i}
              </button>
            );
          }

          if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
              pageNumbers.push(
                <span key="dots-end" className="px-2 py-1 text-gray-500">...</span>
              );
            }
            pageNumbers.push(
              <button
                key={totalPages}
                onClick={() => setCurrentPage(totalPages)}
                className={`px-3 py-1 rounded border border-gray-300 ${currentPage === totalPages ? "bg-blue-600 text-white" : "hover:bg-blue-100"}`}
              >
                {totalPages}
              </button>
            );
          }

          return pageNumbers;
        })()}

        <button
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="cursor-pointer px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
        >
          ถัดไป
        </button>
      </div>

    </div>
  );
}
