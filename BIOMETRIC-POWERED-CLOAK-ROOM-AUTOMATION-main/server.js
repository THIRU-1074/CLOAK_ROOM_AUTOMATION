const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const session = require('express-session');
const cors = require('cors');
const path = require('path');


const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'frontend')));

app.use(session({
    secret: 'yourSecretKey',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 600000 }
}));

const authRoutes = require('./operations');
app.use('/', authRoutes);


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'welcome.html'));
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
