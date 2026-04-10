import express from 'express';
import { supabase } from '../config.js';

const router = express.Router();

// Hent alle elever
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('elev')
    .select('navn, "gode venner", "dårlige venner"')
    .order('navn', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Tilføj elev
router.post('/', async (req, res) => {
  const { navn, godeVenner, dårligeVenner } = req.body;
  const { error } = await supabase.from('elev').insert([{
    navn,
    'gode venner': godeVenner || null,
    'dårlige venner': dårligeVenner || null,
  }]);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// Hent bordvalg
router.get('/bord', async (req, res) => {
  const { data, error } = await supabase
    .from('bord')
    .select('elever, "antal pladser"')
    .order('id', { ascending: false })
    .limit(1);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Gem bordvalg
router.post('/bord', async (req, res) => {
  const { eleverPerBord, antalElever } = req.body;
  const { error } = await supabase.from('bord').upsert([{
    id: 1,
    elever: eleverPerBord,
    'antal pladser': antalElever,
  }]);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

export default router;
