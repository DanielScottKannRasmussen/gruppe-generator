import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const port = process.env.PORT || 3003;

app.use(express.json());
app.use(express.static('Public'));

import elevController from './controller/elevController.js';
app.use('/elever', elevController);

app.get('/', (req, res) => {
  res.sendFile('samling.html', { root: 'Public' });
});

app.listen(port, () => {
  console.log(`App kører på http://localhost:${port}`);
});
