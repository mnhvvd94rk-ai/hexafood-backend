const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const SFC_DB = {
  "jengibre": { total:11, ob:2, me:2, pb:2, li:1, gl:2, sa:2 },
  "cacao": { total:10, ob:2, me:2, pb:2, li:2, gl:1, sa:1 },
  "maca": { total:7, ob:1, me:2, pb:1, li:1, gl:1, sa:1 },
  "espirulina": { total:13, ob:2, me:3, pb:2, li:3, gl:2, sa:1 },
  "amaranto": { total:12, ob:2, me:2, pb:3, li:2, gl:1, sa:2 },  "harina de coco": { total:9, ob:2, me:1, pb:2, li:1, gl:2, sa:1 },
  "coco": { total:9, ob:2, me:1, pb:2, li:1, gl:2, sa:1 },
  "coconut": { total:9, ob:2, me:1, pb:2, li:1, gl:2, sa:1 },
  "fibra de agave": { total:15, ob:3, me:3, pb:3, li:2, gl:2, sa:2 },
  "curcumina": { total:14, ob:3, me:3, pb:2, li:2, gl:3, sa:1 }
};

const productDB = {
  "7501055301106": { product_name: "Coca-Cola 600ml", ingredients_text: "agua carbonatada, azúcar, cafeína" },
  "7622300443120": { product_name: "Galletas María", ingredients_text: "harina de trigo, azúcar, fibra de agave" },
  "8410033013519": { product_name: "Leche Entera", ingredients_text: "leche, vitamina d" },
  "5000112529634": { product_name: "Chocolate Oscuro 70%", ingredients_text: "cacao, azúcar, manteca de cacao" },
  "test002": { product_name: "Test Fibra de Agave", ingredients_text: "fibra de agave" },
  "test003": { product_name: "Test Curcumina", ingredients_text: "curcumina" },
  "test004": { product_name: "Test Espirulina", ingredients_text: "espirulina" },
  "test005": { product_name: "Test Jengibre", ingredients_text: "jengibre" },  "test001": { product_name: "Test Harina de Coco", ingredients_text: "harina de coco" },
  "041512164019": { product_name: "Harina de Coco Orgánica", ingredients_text: "harina de coco" },
  "8480000101016": { product_name: "Harina de Coco Ecológica", ingredients_text: "coconut flour" }
};

app.post('/api/analyze', async (req, res) => {
  const { barcode } = req.body;

  let product = productDB[barcode];

  if (!product) {
    try {
      const off = await axios.get(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      if (off.data.status === 1) product = off.data.product;
    } catch (e) {}
  }

  if (!product) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  const ingredientsText = (product.ingredients_text || '').toLowerCase();

  let detected = [];
  let ob = 0, me = 0, pb = 0, li = 0, gl = 0, sa = 0, totalScore = 0;

  for (const [name, data] of Object.entries(SFC_DB)) {
    if (ingredientsText.includes(name)) {
      detected.push(name);
      ob += data.ob;
      me += data.me;
      pb += data.pb;
      li += data.li;
      gl += data.gl;
      sa += data.sa;
      totalScore += data.total;
    }
  }

  if (detected.length === 0) {
    return res.json({
      productName: product.product_name,
      totalScore: 0,
      interpretation: "Sin ingredientes funcionales detectados",
      nivel: "Evidencia limitada",
      dominios: { ob:0, me:0, pb:0, li:0, gl:0, sa:0 }
    });
  }

  const avgScore = Math.round((totalScore / detected.length) * 10) / 10;

  res.json({
    productName: product.product_name,
    totalScore: avgScore,
    interpretation: avgScore >= 12 ? "Excelente perfil funcional" : "Buen perfil funcional",
    nivel: avgScore >= 12 ? "Alta eficacia" : "Eficacia parcial",
    dominios: {
      ob: Math.round(ob / detected.length),
      me: Math.round(me / detected.length),
      pb: Math.round(pb / detected.length),
      li: Math.round(li / detected.length),
      gl: Math.round(gl / detected.length),
      sa: Math.round(sa / detected.length)
    }
  });
});

module.exports = app;
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY); // Reemplaza con tu secret key

app.post('/api/create-checkout', async (req, res) => {
  const { userId, plan } = req.body;
  
  const priceId = plan === 'monthly' ? 'price_1TUgrd739irbxgcRTwc75MCP' : 'price_1TUh01739irbxgcRcuXcBzGX';
  
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: 'https://hexafood-app.web.app/success',
    cancel_url: 'https://hexafood-app.web.app/cancel',
    metadata: { userId }
  });
  
  res.json({ url: session.url });
});

// Stripe
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.post('/api/create-checkout', async (req, res) => {
  const { userId, plan } = req.body;
  
  const priceId = plan === 'monthly' 
    ? 'price_1TUgrd739irbxgcRTwc75MCP'   // mensual $2.99
    : 'price_1TUh01739irbxgcRcuXcBzGX';  // anual $19.99
  
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: 'https://hexafood-app.web.app/success',
      cancel_url: 'https://hexafood-app.web.app/cancel',
      metadata: { userId }
    });
    
    res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: error.message });
  }
});
