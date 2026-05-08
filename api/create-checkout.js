const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { plan } = req.body;
  let priceId;

  if (plan === 'monthly') {
    priceId = 'price_1TUgrd739irbxgcRTwc75MCP';
  } else if (plan === 'yearly') {
    priceId = 'NUEVO_PRICE_ID_AQUI'; // Reemplaza con el nuevo priceId
  } else {
    return res.status(400).json({ error: 'Plan no válido' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: 'https://hexafood.app/success',
      cancel_url: 'https://hexafood.app/cancel',
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
