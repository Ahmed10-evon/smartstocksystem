# 📦 SmartStock — POS & Inventory Management System

<div align="center">

![SmartStock Banner](https://img.shields.io/badge/SmartStock-POS%20%26%20Inventory-7c3aed?style=for-the-badge&logo=database&logoColor=white)

[![Oracle](https://img.shields.io/badge/Oracle-11g%20%2F%20XE-F80000?style=flat-square&logo=oracle&logoColor=white)](https://www.oracle.com/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![HTML5](https://img.shields.io/badge/HTML5-CSS3-E34F26?style=flat-square&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![License](https://img.shields.io/badge/License-Academic-blue?style=flat-square)](LICENSE)

> A fully functional smartphone retail Point-of-Sale and Inventory Management System  
> built as a **Database Systems Laboratory** project to demonstrate all major Oracle SQL concepts.

[Features](#-features) • [Tech Stack](#-tech-stack) • [Database Schema](#-database-schema) • [Setup](#-setup--installation) • [Pages](#-website-pages) • [SQL Concepts](#-sql-concepts-demonstrated) • [API Routes](#-api-routes)

</div>

---

## 📋 Project Information

| Field | Details |
|---|---|
| **Project Name** | SmartStock — POS & Inventory Management System |
| **Developer** | Tasnim Ahmed Evon |
| **Roll No** | 2207074 |
| **Course** | Database Systems Laboratory |
| **Course No** | 3110 |
| **Database** | Oracle 11g / Oracle XE |
| **Backend** | Node.js + Express |
| **Frontend** | Vanilla HTML / CSS / JavaScript |

---

## ✨ Features

- 🔐 **Role-Based Access Control** — ADMIN and CASHIER roles with different permissions
- 📱 **Inventory Management** — Add, view, delete smartphones with price sorting (Low→High / High→Low)
- 💰 **Point of Sale** — Process sales with full ACID transaction support
- 📊 **Analytics Dashboard** — Real-time charts, asset valuation, brand breakdown
- 🏭 **Supplier Directory** — Manage suppliers via SQL VIEW
- 🔗 **SQL Joins Explorer** — Live demonstration of all 6 SQL join types
- 🔔 **Low Stock Alerts** — Automatic Oracle TRIGGER fires when stock < 5
- 📈 **Brand Sales Report** — Stored procedure generates brand-wise sales
- ⭐ **Premium Phones** — Subquery filters phones above average price
- 🌙 **Dark Mode** — Full dark/light theme toggle
- 🔄 **Page Transitions** — Animated loading screen between pages

---

## 🛠 Tech Stack

```
┌─────────────────────────────────────────────────────┐
│              BROWSER / HTML FRONTEND                │
│   index.html  dashboard.html  inventory.html        │
│   sales.html  suppliers.html  joins.html            │
│            Vanilla JS + Font Awesome                │
└──────────────────────┬──────────────────────────────┘
                       │  fetch() HTTP requests
┌──────────────────────▼──────────────────────────────┐
│           NODE.JS / EXPRESS BACKEND                 │
│              server.js — 17 API Routes              │
│         oracledb npm — Connection Pool              │
└──────────────────────┬──────────────────────────────┘
                       │  SQL queries via oracledb
┌──────────────────────▼──────────────────────────────┐
│            ORACLE 11g / ORACLE XE                   │
│   6 Tables · 1 View · 1 Trigger · 1 Procedure      │
│         Full ACID · Constraints · Joins             │
└─────────────────────────────────────────────────────┘
```

---

## 🗄 Database Schema

### Tables

| Table | Primary Key | Purpose | Key Constraints |
|---|---|---|---|
| `SUPPLIERS` | `Supplier_ID` | Supplier company records | NOT NULL on Name |
| `SMARTPHONES` | `Phone_ID` | Central inventory table | NOT NULL, DEFAULT 0, FK → Suppliers |
| `SALES` | `Sale_ID` | Transaction records | FK → Smartphones, DEFAULT SYSDATE |
| `APP_USERS` | `Username` | Login accounts & roles | CHECK (ADMIN/CASHIER) |
| `STOCK_ALERTS` | `Alert_ID` | Auto-generated alerts | Populated by TRIGGER only |
| `PRICE_HISTORY` | `History_ID` | Price change audit | FK + ON DELETE CASCADE |

### Relationships

```
SUPPLIERS (1) ──────────────── (N) SMARTPHONES
                                        │
                            (N) ──── SALES
                            (N) ──── STOCK_ALERTS   [via TRIGGER]
                            (N) ──── PRICE_HISTORY  [ON DELETE CASCADE]

APP_USERS ── standalone (no FK relationships)
```

### View

```sql
CREATE OR REPLACE VIEW Supplier_Stock_Report AS
SELECT sup.Supplier_ID, sup.Name AS Supplier_Name,
       sup.Contact_Email, sup.Phone_Number,
       COUNT(s.Phone_ID)           AS Total_Models,
       NVL(SUM(s.Stock_Quantity),0) AS Total_Stock
FROM Suppliers sup
LEFT JOIN Smartphones s ON sup.Supplier_ID = s.Supplier_ID
GROUP BY sup.Supplier_ID, sup.Name, sup.Contact_Email, sup.Phone_Number;
```

---

## ⚙ Setup & Installation

### Prerequisites

- [Oracle 11g / Oracle XE](https://www.oracle.com/database/technologies/xe-downloads.html) installed locally
- [Oracle Instant Client](https://www.oracle.com/database/technologies/instant-client.html) installed
- [Node.js](https://nodejs.org/) (v16 or higher)
- [Oracle SQL Developer](https://www.oracle.com/tools/downloads/sqldev-downloads.html)

### Step 1 — Clone the repository

```bash
git clone https://github.com/your-username/smartstock.git
cd smartstock
```

### Step 2 — Install dependencies

```bash
npm install
```

### Step 3 — Configure environment

Create a `.env` file in the root directory:

```env
DB_USER=SYSTEM
DB_PASSWORD=your_oracle_password
DB_CONNECT_STRING=localhost/XE
PORT=3000
ORACLE_CLIENT_DIR=C:\path\to\instantclient
```

### Step 4 — Setup the database

Open **Oracle SQL Developer**, connect to your local Oracle instance, open `schema.sql` and press **F5** to run the full setup script. This will:

- Create all 6 tables with constraints
- Insert sample data (4 suppliers, 8 phones, 2 users)
- Create the `Supplier_Stock_Report` VIEW
- Create the `trg_low_stock_alert` TRIGGER
- Create the `GetCustomerSalesReport` PROCEDURE

### Step 5 — Start the server

```bash
npm start
# or
node server.js
```

### Step 6 — Open in browser

```
http://localhost:3000
```

### Default Login Credentials

| Username | Password | Role |
|---|---|---|
| `admin1` | `1234` | ADMIN |
| `cashier1` | `1234` | CASHIER |

---

## 📄 Website Pages

### `index.html` — Login Page
- Autumn glassmorphism UI with animated falling leaves
- Authenticates against `App_Users` table using `SELECT WHERE`
- Saves role (`ADMIN`/`CASHIER`) to `localStorage`
- **SQL:** `SELECT Username, User_Role FROM App_Users WHERE Username=:1 AND Password=:2`

### `dashboard.html` — Analytics Dashboard
- Real-time metrics: total brands, total units, total asset value
- Bar chart showing stock distribution by brand
- Premium Phones section (Admin) — uses **subquery**
- Brand Sales Report (Admin) — uses **stored procedure**
- Low Stock Alerts — reads from **trigger**-populated table
- **SQL:** `GROUP BY Brand HAVING SUM(Stock_Quantity) > 0`

### `inventory.html` — Inventory Manager
- Full stock table with supplier info via **LEFT OUTER JOIN**
- Price sorting: Low→High / High→Low using `ORDER BY` in SQL
- Real-time search filter by brand or model
- Add Smartphone form (Admin only) — `INSERT`
- Delete button per row (Admin only) — `DELETE`

### `sales.html` — Sales / POS
- Process new sales with **ACID transaction** (autoCommit: false → commit/rollback)
- Insufficient stock check before transaction
- Complete transaction history log

### `suppliers.html` — Supplier Directory
- Reads from `Supplier_Stock_Report` **SQL VIEW**
- Shows Supplier ID, Name, Email, Phone, Total Models, Total Stock
- Add new supplier form (Admin only) — `INSERT`
- CASHIER sees read-only view with access notice

### `joins.html` — SQL Joins Explorer
- Dedicated page demonstrating all 6 SQL join types
- Each tab shows the SQL query + live Oracle results
- INNER · LEFT OUTER · RIGHT OUTER · FULL OUTER · CROSS · SELF

---

## 🔧 API Routes

| # | Method | Route | Purpose | SQL Concept |
|---|---|---|---|---|
| 1 | GET | `/api/inventory` | Get all phones with supplier | LEFT OUTER JOIN + ORDER BY |
| 2 | POST | `/api/inventory` | Add new phone | INSERT |
| 2B | DELETE | `/api/inventory/:id` | Delete phone | DELETE |
| 3 | GET | `/api/analytics/stock-value` | Brand analytics | GROUP BY + HAVING + SUM |
| 4 | GET | `/api/sales` | Sales history | INNER JOIN |
| 5 | POST | `/api/sales` | Process sale | ACID Transaction |
| 6 | GET | `/api/suppliers` | Supplier list | SQL VIEW |
| 7 | POST | `/api/suppliers` | Add supplier | INSERT |
| 8 | POST | `/api/login` | Authenticate user | SELECT + WHERE |
| 9 | GET | `/api/report/:brand` | Brand sales report | Stored Procedure |
| 10 | GET | `/api/inventory/premium` | Above-avg phones | Subquery |
| 11 | GET | `/api/alerts` | Low stock alerts | Trigger log |
| 12 | GET | `/api/joins/inner` | INNER JOIN demo | INNER JOIN |
| 13 | GET | `/api/joins/left` | LEFT JOIN demo | LEFT OUTER JOIN |
| 14 | GET | `/api/joins/right` | RIGHT JOIN demo | RIGHT OUTER JOIN |
| 15 | GET | `/api/joins/full` | FULL JOIN demo | FULL OUTER JOIN |
| 16 | GET | `/api/joins/cross` | CROSS JOIN demo | CROSS JOIN |
| 17 | GET | `/api/joins/self` | SELF JOIN demo | SELF JOIN |

---

## 📚 SQL Concepts Demonstrated

| # | Concept | Where in Website |
|---|---|---|
| 1 | DDL — CREATE TABLE | SQL Developer schema setup |
| 2 | DDL — ALTER TABLE | Add FK constraint after table creation |
| 3 | DDL — DROP TABLE | Schema reset / cleanup |
| 4 | DML — INSERT | Inventory Manager + Sales + Suppliers |
| 5 | DML — UPDATE | Sales page (stock reduction in ACID transaction) |
| 6 | DML — DELETE | Inventory Manager (Admin delete button) |
| 7 | SELECT + WHERE | Login page credential check |
| 8 | ORDER BY | Inventory sort buttons (Low→High / High→Low) |
| 9 | PRIMARY KEY | All 6 tables |
| 10 | FOREIGN KEY | Smartphones→Suppliers, Sales→Phones |
| 11 | NOT NULL | Brand, Model, Price, Quantity, Password |
| 12 | CHECK Constraint | App_Users.User_Role IN ('ADMIN','CASHIER') |
| 13 | DEFAULT Value | Sale_Date DEFAULT SYSDATE, Stock DEFAULT 0 |
| 14 | ON DELETE CASCADE | Price_History FK → Smartphones |
| 15 | GROUP BY | Dashboard analytics (group by Brand) |
| 16 | HAVING | Dashboard analytics (filter zero-stock brands) |
| 17 | Aggregate Functions | SUM, AVG (inside subquery) |
| 18 | Arithmetic in SELECT | SUM(Price * Stock_Quantity) |
| 19 | Subquery | Dashboard → Premium Phones (Price > AVG) |
| 20 | UNION | SQL Developer demo |
| 21 | MINUS | SQL Developer demo |
| 22 | INTERSECT | SQL Developer demo |
| 23 | SQL VIEW | Suppliers page (Supplier_Stock_Report) |
| 24 | Stored Procedure | Dashboard → Brand Sales Report |
| 25 | Trigger | Dashboard → Low Stock Alerts |
| 26 | ACID Transaction | Sales Page → Complete Sale |
| 27 | INNER JOIN | Sales history, SQL Joins page |
| 28 | LEFT OUTER JOIN | Inventory Manager, SQL Joins page |
| 29 | RIGHT OUTER JOIN | SQL Joins page |
| 30 | FULL OUTER JOIN | SQL Joins page |
| 31 | CROSS JOIN | SQL Joins page |
| 32 | SELF JOIN | SQL Joins page |
| 33 | Role-Based Access | All pages (ADMIN vs CASHIER) |

---

## 🔐 Role Permissions

| Feature | ADMIN | CASHIER |
|---|---|---|
| View Inventory | ✅ | ✅ |
| Add Smartphone | ✅ | ❌ Hidden |
| Delete Smartphone | ✅ | ❌ Hidden |
| Process Sales | ✅ | ✅ |
| View Suppliers | ✅ | ✅ |
| Add Supplier | ✅ | ❌ Hidden |
| Premium Phones | ✅ | ❌ Hidden |
| Brand Sales Report | ✅ | ❌ Hidden |
| Low Stock Alerts | ✅ | ✅ |
| SQL Joins Explorer | ✅ | ✅ |

---

## 📁 Project Structure

```
smartstock/
│
├── server.js              # Express server — 17 API routes
├── dbConfig.js            # Oracle connection pool setup
├── package.json           # Node.js dependencies
├── .env                   # Environment variables (DB credentials)
├── schema.sql             # Complete database setup script
│
└── public/                # Frontend (served statically)
    ├── index.html         # Login page (glassmorphism)
    ├── dashboard.html     # Analytics, reports, alerts
    ├── inventory.html     # Stock management with sorting
    ├── sales.html         # POS / transaction page
    ├── suppliers.html     # Supplier directory
    ├── joins.html         # SQL Joins Explorer
    ├── style.css          # Global design system
    └── loader.js          # Page transition animation
```

---

## 🚀 Key Technical Highlights

### ACID Transaction (Sales Page)
```javascript
// autoCommit: false ensures atomicity
await connection.execute(insertSaleSql, ..., { autoCommit: false });
await connection.execute(updateStockSql, ..., { autoCommit: false });
await connection.commit();    // Both saved permanently
// On error:
await connection.rollback();  // Both undone — nothing lost
```

### Oracle Trigger (Automatic)
```sql
CREATE OR REPLACE TRIGGER trg_low_stock_alert
AFTER UPDATE OF Stock_Quantity ON Smartphones
FOR EACH ROW WHEN (NEW.Stock_Quantity < 5)
BEGIN
    INSERT INTO Stock_Alerts (...) VALUES (...);
END;
```

### Subquery (Premium Phones)
```sql
SELECT Brand, Model, Price FROM Smartphones
WHERE Price > (SELECT AVG(Price) FROM Smartphones)
ORDER BY Price DESC;
```

### SQL View (Suppliers Page)
```sql
-- Backend just calls:
SELECT * FROM Supplier_Stock_Report ORDER BY Supplier_Name;
-- View handles the JOIN + GROUP BY internally
```

---

## 📸 Screenshots

> Add screenshots of your running application here

| Page | Screenshot |
|---|---|
| Login Page | *(add screenshot)* |
| Dashboard | *(add screenshot)* |
| Inventory Manager | *(add screenshot)* |
| Sales Page | *(add screenshot)* |
| Suppliers Page | *(add screenshot)* |
| SQL Joins Explorer | *(add screenshot)* |

---

## 📝 License

This project is built for academic purposes as part of the **Database Systems Laboratory** course (Course No: 3110).

---

<div align="center">

Made with 💜 by **Tasnim Ahmed Evon** · Roll: 2207074

*Oracle 11g · Node.js · Vanilla JS · Database Systems Laboratory*

</div>