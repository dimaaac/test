const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const https = require('https');  // Import the 'https' module
const app = express();
const port = 443;  // Change the port to 443 for HTTPS

const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/dimaonline.fr/privkey.pem'),  // Load the private key
  cert: fs.readFileSync('/etc/letsencrypt/live/dimaonline.fr/fullchain.pem'),  // Load the certificate
};

const storage = multer.diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
        const randomString = crypto.randomBytes(3).toString('hex');
        const fileExtension = path.extname(file.originalname);
        const randomFilename = `${randomString}${fileExtension}`;
        cb(null, randomFilename);
    },
});

const upload = multer({ storage: storage });

app.use(express.static('uploads'));
app.use(express.json());

const disallowedExtensions = ['.php', '.js', '.sh']; // List of disallowed extensions

app.post('/upload', upload.single('file'), (req, res) => {
    const file = req.file;
    if (!file) {
        return res.status(400).json({ error: 'File upload failed' });
    }

    const fileExtension = path.extname(file.originalname);

    if (disallowedExtensions.includes(fileExtension)) {
        // File has a disallowed extension; reject it
        fs.unlinkSync(file.path); // Delete the file
        return res.status(400).json({ error: 'ERROR::Mailicious file detected' });
    }

    const downloadLink = `https://dimaonline.fr/download/${file.filename}`;  // Replace with your domain
    res.json({ downloadLink });
});

// Serve the index.html file
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve and force the download of the file
app.get('/download/:filename', (req, res) => {
    const filePath = path.join(__dirname, 'uploads', req.params.filename);
    res.download(filePath);
});
app.use(express.json());

const server = https.createServer(options, app);  // Create an HTTPS server
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

