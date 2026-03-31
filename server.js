import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const port = process.env.PORT || 3003;

app.use(express.static('Public'));

app.get('/', (req, res) => {
  res.sendFile('samling.html', { root: 'Public' });
});

app.listen(port, () => {
  console.log(`App kører på http://localhost:${port}`);
});