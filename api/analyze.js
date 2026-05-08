module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { barcode } = req.body;

  return res.status(200).json({
    success: true,
    barcode,
    message: 'Backend funcionando'
  });
};
