const express = require('express');
const oracledb = require('oracledb');
const cors = require('cors');
const db = require('./dbConfig'); // This loads your database setup
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ==========================================
// 1. GET ALL SMARTPHONES (WITH SUPPLIER INFO)
// ==========================================
app.get('/api/inventory', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection(); 
        const sql = `
            SELECT s.Phone_ID, s.Brand, s.Model, s.Price, s.Stock_Quantity, sup.Name AS Supplier_Name 
            FROM Smartphones s
            LEFT OUTER JOIN Suppliers sup ON s.Supplier_ID = sup.Supplier_ID
            ORDER BY s.Brand
        `;
        const result = await connection.execute(sql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
});

// ==========================================
// 2. POST A NEW SMARTPHONE (INSERT STOCK)
// ==========================================
app.post('/api/inventory', async (req, res) => {
    let connection;
    try {
        const { brand, model, price, stock, supplier_id } = req.body;
        connection = await oracledb.getConnection();
        
        const sql = `
            INSERT INTO Smartphones (Phone_ID, Brand, Model, Price, Stock_Quantity, Supplier_ID) 
            VALUES ((SELECT NVL(MAX(Phone_ID), 0) + 1 FROM Smartphones), :brand, :model, :price, :stock, :supplier_id)
        `;
        
        await connection.execute(sql, [brand, model, price, stock, supplier_id], { autoCommit: true });
        res.status(201).json({ message: "Smartphone added to inventory successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
});

// ==========================================
// 2B. DELETE A SMARTPHONE (DML - DELETE)
// ==========================================
app.delete('/api/inventory/:id', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection();
        await connection.execute(
            `DELETE FROM Smartphones WHERE Phone_ID = :1`,
            [req.params.id], { autoCommit: true }
        );
        res.json({ message: 'Phone deleted successfully.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
});

// ==========================================
// 3. GET ADVANCED ANALYTICS (AGGREGATION)
// ==========================================
app.get('/api/analytics/stock-value', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection();
        const sql = `
            SELECT Brand, SUM(Stock_Quantity) as Total_Phones, SUM(Price * Stock_Quantity) AS Total_Value
            FROM Smartphones
            GROUP BY Brand
            HAVING SUM(Stock_Quantity) > 0
        `;
        const result = await connection.execute(sql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
});

// ==========================================
// 4. GET ALL SALES ENTRIES (TRANSACTION LOGS)
// ==========================================
app.get('/api/sales', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection();
        const sql = `
            SELECT sa.Sale_ID, sa.Quantity, sa.Sale_Date, sm.Brand, sm.Model, sm.Price, (sa.Quantity * sm.Price) AS Total_Revenue
            FROM Sales sa
            JOIN Smartphones sm ON sa.Phone_ID = sm.Phone_ID
            ORDER BY sa.Sale_Date DESC
        `;
        const result = await connection.execute(sql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
});

// ==========================================
// 5. POST A NEW SALE (ACID TRANSACTION)
// ==========================================
app.post('/api/sales', async (req, res) => {
    let connection;
    try {
        const { phone_id, quantity } = req.body;
        connection = await oracledb.getConnection();

        // Step A: Check if the phone exists and has enough stock
        const checkSql = `SELECT Stock_Quantity, Price FROM Smartphones WHERE Phone_ID = :1`;
        const checkResult = await connection.execute(checkSql, [phone_id], { outFormat: oracledb.OUT_FORMAT_OBJECT });

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: "Phone ID not found." });
        }

        const currentStock = checkResult.rows[0].STOCK_QUANTITY;
        const price = checkResult.rows[0].PRICE;

        if (currentStock < quantity) {
            return res.status(400).json({ error: "Insufficient stock to complete this sale!" });
        }

        // Step B: Perform the Transaction (Atomicity)
        const insertSaleSql = `
            INSERT INTO Sales (Sale_ID, Phone_ID, Quantity) 
            VALUES ((SELECT NVL(MAX(Sale_ID), 0) + 1 FROM Sales), :1, :2)
        `;
        await connection.execute(insertSaleSql, [phone_id, quantity], { autoCommit: false });

        const updateStockSql = `UPDATE Smartphones SET Stock_Quantity = Stock_Quantity - :1 WHERE Phone_ID = :2`;
        await connection.execute(updateStockSql, [quantity, phone_id], { autoCommit: false });

        // Step C: Save changes permanently (Durability)
        await connection.commit();

        res.status(201).json({ message: "Sale processed successfully!" });
    } catch (err) {
        // Step D: Cancel changes if anything fails (Consistency)
        if (connection) {
            await connection.rollback();
            console.log("Transaction rolled back due to error.");
        }
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
});

// ==========================================
// 6. GET SUPPLIERS FROM THE SQL VIEW
// ==========================================
app.get('/api/suppliers', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection();
        const sql = `SELECT * FROM Supplier_Stock_Report ORDER BY Supplier_Name`;
        const result = await connection.execute(sql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
});

// ==========================================
// 7. POST A NEW SUPPLIER
// ==========================================
app.post('/api/suppliers', async (req, res) => {
    let connection;
    try {
        const { name, email, phone } = req.body;
        connection = await oracledb.getConnection();
        
        const sql = `
            INSERT INTO Suppliers (Supplier_ID, Name, Contact_Email, Phone_Number) 
            VALUES ((SELECT NVL(MAX(Supplier_ID), 0) + 1 FROM Suppliers), :1, :2, :3)
        `;
        
        await connection.execute(sql, [name, email, phone], { autoCommit: true });
        res.status(201).json({ message: "Supplier added successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
});

// ==========================================
// 8. POST LOGIN AUTHENTICATION
// ==========================================
app.post('/api/login', async (req, res) => {
    let connection;
    try {
        const { username, password } = req.body;
        connection = await oracledb.getConnection();
        
        const sql = `SELECT Username, User_Role FROM App_Users WHERE Username = :1 AND Password = :2`;
        const result = await connection.execute(sql, [username, password], { outFormat: oracledb.OUT_FORMAT_OBJECT });

        if (result.rows.length === 1) {
            const user = result.rows[0];
            res.json({ message: "Login successful", role: user.USER_ROLE, username: user.USERNAME });
        } else {
            res.status(401).json({ error: "Invalid username or password" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
});

// ==========================================
// 9. GET SALES REPORT VIA STORED PROCEDURE
// ==========================================
app.get('/api/report/:brand', async (req, res) => {
    let connection;
    try {
        const brand = req.params.brand;
        connection = await oracledb.getConnection();

        const result = await connection.execute(
            `SELECT sm.Brand, sm.Model, sa.Quantity, sa.Sale_Date,
                    (sa.Quantity * sm.Price) AS Revenue
             FROM Sales sa
             JOIN Smartphones sm ON sa.Phone_ID = sm.Phone_ID
             WHERE UPPER(sm.Brand) = UPPER(:1)
             ORDER BY sa.Sale_Date DESC`,
            [brand],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
});

// ==========================================
// 10. GET ABOVE-AVERAGE PRICED PHONES (SUBQUERY)
// ==========================================
app.get('/api/inventory/premium', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection();

        const sql = `
            SELECT Phone_ID, Brand, Model, Price, Stock_Quantity
            FROM Smartphones
            WHERE Price > (SELECT AVG(Price) FROM Smartphones)
            ORDER BY Price DESC
        `;

        const result = await connection.execute(sql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
});

// ==========================================
// 11. GET STOCK ALERTS (TRIGGER LOG TABLE)
// ==========================================
app.get('/api/alerts', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection();
        const sql = `SELECT * FROM Stock_Alerts ORDER BY Alert_Time DESC`;
        const result = await connection.execute(sql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
});

// ==========================================
// 12. INNER JOIN — matched phones + suppliers
// ==========================================
app.get('/api/joins/inner', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute(
            `SELECT s.Phone_ID, s.Brand, s.Model, s.Price, sup.Name AS Supplier_Name
             FROM Smartphones s
             INNER JOIN Suppliers sup ON s.Supplier_ID = sup.Supplier_ID
             ORDER BY s.Phone_ID`,
            [], { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
});

// ==========================================
// 13. LEFT OUTER JOIN — all phones + suppliers
// ==========================================
app.get('/api/joins/left', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute(
            `SELECT s.Phone_ID, s.Brand, s.Model, s.Price, sup.Name AS Supplier_Name
             FROM Smartphones s
             LEFT OUTER JOIN Suppliers sup ON s.Supplier_ID = sup.Supplier_ID
             ORDER BY s.Phone_ID`,
            [], { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
});

// ==========================================
// 14. RIGHT OUTER JOIN — all suppliers + phones
// ==========================================
app.get('/api/joins/right', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute(
            `SELECT s.Phone_ID, s.Brand, s.Model, sup.Supplier_ID, sup.Name AS Supplier_Name
             FROM Smartphones s
             RIGHT OUTER JOIN Suppliers sup ON s.Supplier_ID = sup.Supplier_ID
             ORDER BY sup.Supplier_ID`,
            [], { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
});

// ==========================================
// 15. FULL OUTER JOIN — all rows both sides
// ==========================================
app.get('/api/joins/full', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute(
            `SELECT s.Phone_ID, s.Brand, s.Model, sup.Supplier_ID, sup.Name AS Supplier_Name
             FROM Smartphones s
             FULL OUTER JOIN Suppliers sup ON s.Supplier_ID = sup.Supplier_ID
             ORDER BY s.Phone_ID NULLS LAST`,
            [], { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
});

// ==========================================
// 16. CROSS JOIN — cartesian product
// ==========================================
app.get('/api/joins/cross', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute(
            `SELECT s.Brand, s.Model, sup.Name AS Supplier_Name
             FROM Smartphones s
             CROSS JOIN Suppliers sup
             ORDER BY s.Phone_ID`,
            [], { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
});

// ==========================================
// 17. SELF JOIN — phones from same brand
// ==========================================
app.get('/api/joins/self', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection();
        const result = await connection.execute(
            `SELECT a.Brand, a.Model AS Phone_A, b.Model AS Phone_B,
                    a.Price AS Price_A, b.Price AS Price_B
             FROM Smartphones a
             INNER JOIN Smartphones b ON a.Brand = b.Brand AND a.Phone_ID < b.Phone_ID
             ORDER BY a.Brand`,
            [], { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
});

// ==========================================
// START SERVER INITIALIZATION
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    await db.initialize();
    console.log(`SmartStock Server running on http://localhost:${PORT}`);
});