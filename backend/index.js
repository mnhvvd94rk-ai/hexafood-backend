const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const SFC_DB = {
  "harina de coco": { total:9, ob:2, me:1, pb:2, li:1, gl:2, sa:1 },
  "coco": { total:9, ob:2, me:1, pb:2, li:1, gl:2, sa:1 },
  "coconut": { total:9, ob:2, me:1, pb:2, li:1, gl:2, sa:1 },
  "fibra de agave": { total:15, ob:3, me:3, pb:3, li:2, gl:2, sa:2 },
  "curcumina": { total:14, ob:3, me:3, pb:2, li:2, gl:3, sa:1 }
};

const productDB = {
  "4151216401": {
    product_name: "Harina de Coco Orgánica",
    ingredients_text: "harina de coco"
  },
  "041512164019": {
    product_name: "Harina de Coco Orgánica (con cero)",
    ingredients_text: "harina de coco"
  },
  "8480000101016": {
    product_name: "Harina de Coco Ecológica",
    ingredients_text: "coconut flour"
  },
  "test001": {
    product_name: "Test Harina de Coco",
    ingredients_text: "harina de coco"
  }
};

app.post('/api/analyze', async (req, res) => {
  const { barcode } = req.body;
  console.log('\n🔍 CÓDIGO RECIBIDO:', barcode);
  
  let product = productDB[barcode];
  console.log('📦 ¿Encontrado en DB local?', product ? 'SÍ' : 'NO');
  
  if (!product) {
    try {
      console.log('🌐 Buscando en Open Food Facts...');
      const off = await axios.get(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      if (off.data.status === 1) {
        product = off.data.product;
        console.log('✅ Producto encontrado en OFF');
      } else {
        console.log('❌ No encontrado en OFF');
      }
    } catch (e) {
      console.log('❌ Error conectando a OFF');
    }
  }
  
  if (!product) {
    console.log('💥 PRODUCTO NO ENCONTRADO');
    return res.status(404).json({ error: 'Producto no encontrado' });
  }
  
  const ingredientsText = (product.ingredients_text || '').toLowerCase();
  console.log('📝 Ingredientes:', ingredientsText);
  
  let detected = [];
  let ob=0, me=0, pb=0, li=0, gl=0, sa=0, totalScore=0;
  
  for (const [name, data] of Object.entries(SFC_DB)) {
    if (ingredientsText.includes(name)) {
      console.log('✅ Detectado:', name);
      detected.push({ name, ...data });
      ob += data.ob; me += data.me; pb += data.pb; li += data.li; gl += data.gl; sa += data.sa;
      totalScore += data.total;
    }
  }
  
  if (detected.length === 0) {
    console.log('⚠️ Sin ingredientes funcionales detectados');
    return res.json({
      productName: product.product_name,
      totalScore: 0,
      interpretation: "Sin ingredientes funcionales detectados",
      nivel: "Evidencia limitada",
      dominios: { ob:0, me:0, pb:0, li:0, gl:0, sa:0 }
    });
  }
  
  const avgScore = Math.round((totalScore / detected.length) * 10) / 10;
  console.log(`📊 Score final: ${avgScore}/18`);
  
  res.json({
    productName: product.product_name,
    totalScore: avgScore,
    interpretation: avgScore >= 12 ? "Excelente perfil funcional" : "Buen perfil funcional",
    nivel: avgScore >= 12 ? "Alta eficacia" : "Eficacia parcial",
    dominios: {
      ob: Math.round(ob/detected.length),
      me: Math.round(me/detected.length),
      pb: Math.round(pb/detected.length),
      li: Math.round(li/detected.length),
      gl: Math.round(gl/detected.length),
      sa: Math.round(sa/detected.length)
    }
  });
});

app.listen(3000, () => {
  console.log('✅ Servidor corriendo en http://localhost:3000');
  console.log('📦 Códigos en DB local:', Object.keys(productDB).join(', '));
});
