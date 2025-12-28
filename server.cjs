const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;
const DB_FILE = path.join(__dirname, 'db.json');

// Middleware
app.use(cors()); // อนุญาตให้ Frontend เรียกใช้ API ได้
app.use(express.json()); // ช่วยให้ Server อ่านข้อมูล JSON ที่ส่งมาได้

// ฟังก์ชันสำหรับอ่านข้อมูลจากไฟล์
const readDB = () => {
    if (!fs.existsSync(DB_FILE)) {
        // ถ้ายังไม่มีไฟล์ ให้สร้างข้อมูลเริ่มต้น
        const initialData = { users: [], payments: [], settings: {} };
        fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
        return initialData;
    }
    const data = fs.readFileSync(DB_FILE);
    return JSON.parse(data);
};

// ฟังก์ชันสำหรับเขียนข้อมูลลงไฟล์
const writeDB = (data) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

// --- API Endpoints ---

// 1. ดึงข้อมูลทั้งหมด
app.get('/api/data', (req, res) => {
    try {
        const data = readDB();
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: "Error reading database" });
    }
});

// 2. บันทึกหรืออัปเดตข้อมูล
app.post('/api/save', (req, res) => {
    try {
        const newData = req.body; // รับข้อมูลทั้งหมดจาก Frontend
        writeDB(newData);
        res.json({ message: "Data saved successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error saving database" });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});