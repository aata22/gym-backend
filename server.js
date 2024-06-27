const express = require('express');
const app = express();
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require("path");
require("dotenv").config();

app.use(cors());
app.use(bodyParser.json()); // Middleware to parse JSON body

app.use(express.static(path.join(__dirname, 'public')))

const con = mysql.createConnection({
  host: process.env.MYSQL_HOST || '127.0.0.1',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'Shaynema12*',
  database: process.env.MYSQL_DATABASE || 'mydb',
});

con.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err.stack);
    return;
  }
  console.log('Connected to database as id', con.threadId);
});

// Add error event handler
con.on('error', (err) => {
  console.error('Database error:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Handle or gracefully exit as needed
  process.exit(1); // Exit with failure
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Handle or gracefully exit as needed
});


app.post('/submit', (req, res) => {
  const {name, day, taimi} = req.body;
  console.log(`Received data: ${name}, ${day}, ${taimi}`); // Add this line

  const query = 'UPDATE schedule SET name = ? WHERE day = ? AND taimi = ?';

  con.query(query, [name, day, taimi], (err, result) => {
    if (err) {
        console.error('Error inserting data:', err.stack);
        res.status(500).json({ message: 'Error inserting data' });
        return;
    }
    res.json({ message: 'Name submitted successfully!' });
});
})

app.get('/get', (req, res) => {
  const query = 'SELECT * FROM schedule ORDER BY day, taimi';

  con.query(query, (err, result) => {
    if (err) {
        console.error('Error inserting data:', err.stack);
        res.status(500).json({ message: 'Error inserting data' });
        return;
    }
    const days = [...new Set(result.map(item => item.day))];
    const taimi = [...new Set(result.map(item =>item.taimi))];

    const scheduleObj = days.reduce((acc, day) => {
      acc[day] = {};
      taimi.forEach(time => {
        acc[day][time] = result.find(item => item.day === day && item.taimi === time) || null;
      });
      return acc;
    }, {});

    res.json({days, taimi, scheduleObj});
})

})

app.get('/get-form-info', (req, res) => {
  const query = `
  SELECT day, 
         JSON_ARRAYAGG(JSON_OBJECT('name', s.name, 'taimi', s.taimi, 'time', s.time)) AS entries
  FROM schedule s
  GROUP BY day;
`;

  con.query(query, (err, result) => {
    if(err) {
      console.error('Error inserting data:', err.stack);
      res.status(500).json({ message: 'Error inserting data' });
      return;
    }
    return res.json(result)
  })
})

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}/`);
});
