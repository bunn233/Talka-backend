# 📊 Report Section — Full Analysis & Restructuring Plan

## สถานะปัจจุบัน

ระบบ Report มีทั้งหมด **6 หน้า** ภายใต้เมนู Reports:

| # | หน้า | ไฟล์ | ขนาด | สถานะข้อมูล |
|---|------|------|------|-------------|
| 1 | Contacts | `/Report/contacts/page.jsx` | 361 บรรทัด | ❌ Mock Data (calenderData) |
| 2 | Conversations | `/Report/conversation/page.jsx` | 342 บรรทัด | ❌ Mock Data (calenderData) |
| 3 | Messages | `/Report/message/page.jsx` | 433 บรรทัด | ❌ Mock Data (hardcoded) |
| 4 | Responses | `/Report/responses/page.jsx` | 352 บรรทัด | ❌ Mock Data (calenderData) |
| 5 | Team Performance | `/Report/users/page.jsx` | 217 บรรทัด | ❌ Mock Data (เปล่า) |
| 6 | AI Token | `/Report/aitoken/page.jsx` | 238 บรรทัด | ❌ Mock Data (hardcoded) |

---

## 🔴 ปัญหาเชิงสถาปัตยกรรม (Architecture Issues)

### 1. Code ซ้ำซ้อนมหาศาล (DRY Violation)
ทุกหน้ามีการ **Copy-Paste** คอมโพเนนต์เหล่านี้ซ้ำกันทั้ง 6 ไฟล์:
- `Button` component — ซ้ำ 6 ครั้ง
- `Card` component — ซ้ำ 4 ครั้ง
- `Table` component — ซ้ำ 4 ครั้ง (และ API ไม่เหมือนกัน: บางตัวรับ `children`, บางตัวรับ `data`)
- `InfoTooltip` component — ซ้ำ 4 ครั้ง
- `PaginationControls` component — ซ้ำ 4 ครั้ง (ชื่อต่างกัน: `PaginationControls` vs `SimplePagination`)
- `DateRange` calendar logic — ซ้ำ 6 ครั้ง

> [!WARNING]
> **ควรสร้างโฟลเดอร์ `/components/Report/` แยก** เก็บ Shared Components เป็นสัดส่วน ลดโค้ดลงได้ ~40% ต่อไฟล์

### 2. ข้อมูลทั้งหมดเป็น Mock 100%
ไม่มีหน้าใดเลยที่ต่อ API จริง ทุกหน้ามี Comment `🟢 [BACKEND NOTE]` ที่บอกว่ายังรอ Backend

### 3. สไตล์ไม่สอดคล้องกัน
- หน้า 1-5 ใช้สไตล์ `border border-[rgba(254,253,253,0.5)] backdrop-blur-xl` (โทนเทา-ใส)
- หน้า AI Token ใช้สไตล์ `bg-white/10 rounded-2xl border border-white/20` (โทนแก้วขุ่น)
- Calendar ของ AI Token ใช้ `date-fns` format, ส่วนหน้าอื่นใช้ `toLocaleDateString`

---

## 🔍 วิเคราะห์ทีละหน้า (เทียบกับ Database จริง)

### 📌 1. Contacts Report — ⚠️ ปรับปรุงเยอะ

**สิ่งที่มี:**
- กราฟ Overview (Total / Added / Deleted)
- กราฟ Contacts Added (แยก)
- กราฟ Contacts Deleted (แยก)
- ตาราง Contact Added Log
- ตาราง Contact Deleted Log

**ปัญหา:**
1. **"Contacts Deleted" ไม่สามารถวัดได้จริง** — ตาราง `Customer` ใน Schema ไม่มีคอลัมน์ `deleted_at` แปลว่าถ้าลบลูกค้าแล้ว Record หายไป ไม่มีข้อมูลย้อนหลังให้วัด
2. **กราฟซ้ำ 3 อัน** — Overview แสดง 3 เส้น (Total, Added, Deleted) อยู่แล้ว ไม่ต้องแยกเป็นอีก 2 กราฟ
3. ข้อมูลใช้คำว่า "opened/closed" แต่ความหมายกลายเป็น "Added/Deleted" ทำให้สับสน

**คำแนะนำ:**
- ✅ เก็บกราฟ Overview ไว้ 1 กราฟ (ลบกราฟย่อย 2 อันออก)
- ✅ เปลี่ยนจาก "Added/Deleted" เป็น **"New Contacts"** อย่างเดียว (มาจาก `Customer.created_at`)
- ✅ เพิ่ม breakdown ตาม **Channel** (LINE, Facebook, Telegram) — ดึงได้จาก `CustomerSocialAccount → Channel`
- ❌ ลบ "Contacts Deleted" ออก (ไม่มีข้อมูลรองรับ) หรือต้องเพิ่ม `deleted_at` ใน Schema ก่อน

---

### 📌 2. Conversations Report — ✅ ดีที่สุด แต่ขาดไป

**สิ่งที่มี:**
- กราฟ Overview (Opened / Closed / Total)
- กราฟ Opened (แยก)
- กราฟ Closed (แยก)
- ตาราง Conversations List

**ปัญหา:**
1. **กราฟซ้ำ 3 อัน** อีกแล้ว — เหมือนหน้า Contacts
2. **ขาด Status อื่นๆ ที่มีใน Schema** — `ChatSession.status` มี `OPEN`, `PENDING`, `CLOSED`, `RESOLVED` แต่ Report แสดงแค่ Opened/Closed
3. **ไม่มีข้อมูล Channel แยก** — ไม่รู้ว่าแชทมาจาก LINE หรือ Facebook

**คำแนะนำ:**
- ✅ รวมกราฟเป็น 1 กราฟ + Legend ที่มีสีแยกตาม Status ทั้ง 4 สถานะ
- ✅ เพิ่ม **Pie Chart / Donut Chart** แสดงสัดส่วน Status (OPEN vs PENDING vs CLOSED vs RESOLVED)
- ✅ เพิ่ม **ระยะเวลาเฉลี่ย** (Average Duration) จาก `created_at` ถึง `updated_at` ของแต่ละ ChatSession
- ✅ เพิ่มคอลัมน์ **Channel / Platform** ในตาราง

---

### 📌 3. Messages Report — ⚠️ ปรับปรุงปานกลาง

**สิ่งที่มี:**
- กราฟ Outgoing Delivery (Sent/Delivered/Read/Failed)
- กราฟ Incoming / Outgoing (แยก)
- ตาราง 3 อัน (Incoming/Outgoing/Failed)

**ปัญหา:**
1. **"Delivered" และ "Read"** ขึ้นอยู่กับว่า Messaging Platform ส่ง Read Receipt กลับมาหรือไม่ — LINE รองรับ, Facebook รองรับบางส่วน, Telegram ไม่รองรับ → ค่านี้อาจไม่ถูกต้อง 100% ต้องมีหมายเหตุ
2. **ตาราง 3 อันซ้ำซ้อน** — ควรรวมเป็นตารางเดียวที่มี Filter Dropdown เลือก Incoming/Outgoing/Failed
3. Mock Data ของหน้านี้ไม่ตรงกับ `Message` Model จริง (ไม่มี field `sent`, `delivered`, `read`, `failed`)

**คำแนะนำ:**
- ✅ เก็บกราฟ Delivery Status ไว้ (มีประโยชน์)
- ✅ รวม 3 ตารางเป็น 1 ตาราง + Dropdown Filter
- ✅ เพิ่มคอลัมน์ `sender_type` (CUSTOMER / AGENT / BOT) — มีอยู่ใน Schema จริง
- ⚠️ เพิ่มหมายเหตุเกี่ยวกับ Read Receipt ที่ขึ้นกับ Platform

---

### 📌 4. Responses Report — ✅ มีค่ามากที่สุด

**สิ่งที่มี:**
- กราฟ Average Response Time + ตาราง Breakdown
- กราฟ Average Response Count + ตาราง Breakdown
- Layout Grid 2:1 (กราฟ + ตาราง)

**ปัญหา:**
1. **Mock data ใช้ `Math.random()`** จริงๆ! — ตัวเลขในตาราง Breakdown สุ่มทุกครั้งที่โหลด เป็นพฤติกรรมที่อันตรายถ้าหลุดขึ้น Production
2. **ขาด SLA Target Line** — ควรมีเส้นเป้าหมาย (Goal Line) เช่น "ตอบภายใน 5 นาที" เพื่อให้ User ดูว่าทีมผ่านหรือไม่ผ่าน SLA

**คำแนะนำ:**
- ✅ หน้านี้ดีที่สุดในเชิง Layout (Grid 2:1) — ใช้เป็นต้นแบบให้หน้าอื่น
- ✅ เพิ่ม **SLA Goal Line** บนกราฟ (เส้นประสีแดง)
- ✅ เพิ่ม **First Response Time (FRT)** — วัดจาก Message แรกของลูกค้า ถึง Message แรกของ Agent
- ❌ ลบ `Math.random()` ออก แล้วใช้ค่าว่างแทน

---

### 📌 5. Team Performance ("Users") — ⚠️ แทบยังไม่มีอะไร

**สิ่งที่มี:**
- ตาราง User Performance (Assigned/Closed/Messages/Comments)
- ตาราง Comment Log

**ปัญหา:**
1. **ชื่อไม่สอดคล้อง** — Sidebar เขียนว่า "Team Performance" แต่ Component ชื่อ "UsersPage" และ Route คือ `/Report/users`
2. **ไม่มีกราฟเลย** — เป็นหน้าเดียวที่ไม่มี Visualization ใดๆ
3. **ข้อมูล Mock เป็น Array ว่าง** — User จะเห็นแค่ "No Available Data"

**คำแนะนำ:**
- ✅ เปลี่ยนชื่อ Route เป็น `/Report/team-performance` ให้ตรงกับ Sidebar
- ✅ เพิ่ม **Bar Chart** แสดง Conversations Closed รายบุคคล (ดึงจาก `ChatSession.assigned_agent_id`)
- ✅ เพิ่ม **Response Time รายบุคคล** — Agent ไหนตอบไวที่สุด/ช้าที่สุด
- ✅ เพิ่ม **Online Time** ถ้ามีข้อมูล (ตอนนี้มี `User.online_status` แต่ไม่มี Log ว่าออนไลน์กี่ชม.)
- ✅ เปลี่ยน "Comment Log" → **"Activity Log"** — ดึงจากตาราง `ActivityLog` ที่มีอยู่แล้วใน Schema จะได้เห็นว่าใครทำอะไรบ้าง

---

### 📌 6. AI Token Report — ⚠️ ขาด Infrastructure

**สิ่งที่มี:**
- Stats Cards 3 อัน (Total Tokens, Today, Cost)
- กราฟ Token Usage
- ตาราง Usage Breakdown (by Feature)

**ปัญหา:**
1. **ไม่มีตารางเก็บ Token ใน Database** — Schema ไม่มี Model สำหรับ Token Logging เลย → ไม่สามารถดึงข้อมูลจริงได้ ต้องสร้าง Model ใหม่
2. **สไตล์ต่างจากหน้าอื่น** — ใช้ `bg-white/10` แทน `border border-[rgba(254,253,253,0.5)]`

**คำแนะนำ:**
- ✅ เก็บหน้านี้ไว้ แต่ต้องสร้าง Prisma Model `AiTokenLog` ก่อน
- ✅ ปรับสไตล์ให้เข้ากับหน้าอื่น
- ✅ เพิ่ม **Alert / Warning** เมื่อ Token ใกล้ถึงขีดจำกัดรายวัน/รายเดือน

---

## 🟢 สิ่งที่ **ขาดหายไป** (ควรเพิ่มใหม่)

### 1. 📊 Report Overview / Summary Page
> ปัจจุบันไม่มี `page.jsx` ที่ `/Report` (Root) → พอกดเมนู "Reports" จะไม่มีหน้าแรก

ควรสร้างเป็นหน้า **Dashboard สรุป KPI** ที่แสดง:
- 4 Cards: ลูกค้าใหม่, แชททั้งหมด, เวลาตอบเฉลี่ย, Resolution Rate
- กราฟรวมแบบ 7 วันล่าสุด
- ลิงก์ไปหน้ารายงานเจาะลึกแต่ละประเภท

### 2. 📡 Channel Report (ตาม Platform)
ข้อมูลนี้มีอยู่ใน Schema แล้ว (`Channel.platform`) แต่ไม่มีหน้า Report:
- สัดส่วนแชทแยกตาม LINE / Facebook / Telegram
- Trend ของแต่ละ Channel
- Channel ไหนมี Response Time ดีที่สุด

### 3. 🏷️ Tag/Category Report
มี `Tag`, `CustomerTag`, `ChatSessionTag` ใน Schema:
- Tag ไหนถูกใช้บ่อยที่สุด
- Trend การใช้ Tag ตามช่วงเวลา
- ช่วยเข้าใจว่าลูกค้าติดต่อเรื่องอะไรมากที่สุด

### 4. 📥 Export / Download
> ไม่มีปุ่ม Export ในหน้า Report ใดเลย

ควรเพิ่มปุ่ม "Download CSV" หรือ "Export PDF" สำหรับทุกตาราง — นี่คือ Feature มาตรฐานของระบบ Report

---

## ❌ สิ่งที่ **ควรลบ/รวม**

| สิ่งที่ควรลบ/รวม | เหตุผล |
|---|---|
| กราฟย่อย 2 อัน (Added/Deleted, Opened/Closed) ในหน้า Contacts และ Conversations | ซ้ำกับกราฟ Overview — เปลืองพื้นที่โดยไม่เพิ่ม Insight |
| "Contacts Deleted" ทั้ง Section | ไม่มี `deleted_at` ใน Schema ดึงข้อมูลจริงไม่ได้ |
| ตาราง 3 อันแยก (Incoming/Outgoing/Failed) ในหน้า Messages | รวมเป็น 1 ตาราง + Filter Dropdown |
| `Math.random()` ในหน้า Responses | อันตราย — ข้อมูลสุ่มเปลี่ยนทุกครั้งที่โหลด |
| Component ซ้ำ (Button, Card, Table, Tooltip, Pagination, Calendar) ใน 6 ไฟล์ | ย้ายไป Shared Components |

---

## 🏗️ โครงสร้างเมนูที่แนะนำ (ใหม่)

```
Reports
├── Overview          [ใหม่] — หน้าสรุป KPI แบบ Dashboard
├── Contacts          [ปรับ] — ลด Section, เพิ่ม Channel breakdown
├── Conversations     [ปรับ] — เพิ่ม 4 Status, Duration, Pie Chart
├── Messages          [ปรับ] — รวมตาราง, จับคู่กับ Schema จริง
├── Responses & SLA   [ปรับ] — เพิ่ม FRT, SLA Goal Line
├── Team Performance  [ปรับ] — เปลี่ยน Route, เพิ่มกราฟ Bar Chart
├── Channels          [ใหม่] — สถิติแยกตาม Platform
└── AI Usage          [ปรับ] — ปรับสไตล์, ต้องสร้าง DB Model
```

---

## 🔧 Verification Plan

### Automated
- ตรวจสอบว่า Shared Components ถูก Import ถูกต้องในทุกหน้า
- หน้าที่ต่อ API จริงแล้วต้อง `npm run build` ผ่านไม่มี Error

### Manual
- เช็คว่าทุกหน้ามีสไตล์สอดคล้องกัน (ไม่มีหน้าที่ดูเป็น "คนละเว็บ")
- เช็คว่า Calendar Date Range ทำงานถูกต้อง
- เช็คว่า Pagination ทำงานเมื่อมีข้อมูลจริง

---

## Open Questions

> [!IMPORTANT]
> 1. **ต้องการให้ลงมือปรับหน้า Report ทั้งหมดตามแผนนี้เลยหรือไม่?** หรืออยากเลือกปรับทีละหน้า?
> 2. **หน้า Channels Report (ใหม่) อยากให้สร้างเลยหรือไม่?**
> 3. **ปุ่ม Export CSV/PDF — อยากให้ทำตอนนี้เลยหรือเอาไว้ทีหลัง?**
> 4. **สำหรับการต่อ API จริง** — อยากให้ทำทีเดียวทั้งหมด หรือ ทำเฉพาะหน้าที่มี Database พร้อมแล้วก่อน (Contacts, Conversations, Messages)?
