const path = require('path');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const router = express.Router();

// Connect to the SQLite database
const db = new sqlite3.Database('./DB.db', (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database');

        db.serialize(() => {
            db.run("DROP TABLE IF EXISTS shelf");
            db.run(`CREATE TABLE IF NOT EXISTS shelf (
                shelfNo INTEGER PRIMARY KEY,
                status TEXT CHECK(status IN ('empty', 'occupied')),
                fingerprintId INTEGER
            )`, () => {
                const stmt = db.prepare("INSERT INTO shelf (shelfNo, status, fingerprintId) VALUES (?, ?, ?)");
                for (let i = 1; i <= 100; i++) {
                    stmt.run(i, "empty", null);
                }
                stmt.finalize();
            });

            db.run("DROP TABLE IF EXISTS students");
            db.run(`CREATE TABLE IF NOT EXISTS students (
                regNo INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                fingerprintId INTEGER UNIQUE NOT NULL
            )`, () => {
                const stmt = db.prepare("INSERT INTO students (regNo, name, fingerprintId) VALUES (?, ?, ?)");
                for (let i = 1; i <= 50; i++) {
                    stmt.run(220000 + i, `Student ${i}`, i);
                }
                stmt.finalize();
            });
        });
    }
});


// Update Fingerprint for Student
router.put('/update-fingerprint', (req, res) => {
    const { registrationNo, fingerprintID } = req.body;

    if (!registrationNo || !fingerprintID) {
        return res.status(400).json({ error: "Registration number and fingerprint ID are required." });
    }

    db.run(`UPDATE students SET fingerprintId = ? WHERE regNo = ?`, 
        [fingerprintID, registrationNo], function (err) {
            if (err) return res.status(500).json({ error: err.message });

            res.json({ message: `Fingerprint registered for ${registrationNo}` });
        }
    );
});

// Authenticate and Free the Shelf
router.get('/checkout/:fingerprintId', (req, res) => {
    const { fingerprintId } = req.params;

    db.get(`SELECT fingerprintId FROM students WHERE fingerprintId = ?`, 
        [fingerprintId], (err, studentRow) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!studentRow) return res.status(404).json({ message: "Student not found." });

            db.get(`SELECT shelfNo FROM shelf WHERE fingerprintId = ?`, 
                [fingerprintId], (err, shelfRow) => {
                    if (err) return res.status(500).json({ error: err.message });
                    if (!shelfRow) return res.status(404).json({ message: "No assigned shelf found for this fingerprint." });

                    const shelfNumber = shelfRow.shelfNo;

                    db.run(`UPDATE shelf SET fingerprintId = NULL, status = 'empty' WHERE shelfNo = ?`, 
                        [shelfNumber], (err) => {
                            if (err) return res.status(500).json({ error: err.message });

                            res.json({ 
                                message: "Bag retrieved successfully. Shelf is now empty.", 
                                shelfNumber 
                            });
                        }
                    );
                }
            );
        }
    );
});

// Assign a Shelf to a Student
router.get('/checkin/:fingerprintId', (req, res) => {
    const { fingerprintId } = req.params;

    db.get(`SELECT fingerprintId FROM students WHERE fingerprintId = ?`, 
        [fingerprintId], (err, studentRow) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!studentRow) return res.status(404).json({ message: "Student not found." });

            db.get(`SELECT shelfNo FROM shelf WHERE status = 'empty' ORDER BY shelfNo ASC LIMIT 1`, 
                [], (err, shelfRow) => {
                    if (err) return res.status(500).json({ error: err.message });
                    if (!shelfRow) return res.status(404).json({ message: "No empty shelf available." });

                    const shelfNumber = shelfRow.shelfNo;

                    db.run(`UPDATE shelf SET fingerprintId = ?, status = 'occupied' WHERE shelfNo = ?`, 
                        [fingerprintId, shelfNumber], function(err) {
                            if (err) return res.status(500).json({ error: err.message });

                            res.json({ message: `Shelf No: ${shelfNumber} assigned successfully.` }); // ✅ Updated message format
                        }
                    );
                }
            );
        }
    );
});

// Get count of empty shelves
router.get('/empty-shelves', (req, res) => {
    db.get(`SELECT COUNT(*) AS emptyShelves FROM shelf WHERE status = 'empty'`, (err, result) => {
        if (err) {
            console.error("Error fetching empty shelves:", err);
            return res.status(500).json({ error: "Internal Server Error" });
        }

        const emptyShelves = result ? result.emptyShelves : 0;
        res.json({ emptyShelves });
    });
});

// Alert route to trigger beep sound
router.get('/alert/:fingerprintId', (req, res) => {
    res.sendFile(path.join(__dirname, 'Frontend', 'alert.html'));
});

module.exports = router;
