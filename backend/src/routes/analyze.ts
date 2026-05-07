import { Router, Request, Response } from 'express';
import axios from 'axios';
import { IFCEngine } from '../services/ifcEngine';

const router = Router();
const ifcEngine = new IFCEngine();

router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { barcode, healthGoal = 'weight_loss' } = req.body;
    
    if (!barcode) {
      return res.status(400).json({ error: 'Código de barras requerido' });
    }

    const offResponse = await axios.get(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
    );
    
    if (offResponse.data.status !== 1) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const product = offResponse.data.product;
    const productName = product.product_name || 'Producto desconocido';
    const productImage = product.image_url;
    
    let ingredientsText = product.ingredients_text || '';
    if (!ingredientsText && product.ingredients) {
      ingredientsText = product.ingredients.map((i: any) => i.text).join(', ');
    }
    
    if (!ingredientsText) {
      return res.status(422).json({ error: 'Producto sin lista de ingredientes' });
    }

    const rawIngredients = ingredientsText
      .split(/[,;]/)
      .map((i: string) => i.trim().toLowerCase())
      .filter((i: string) => i.length > 0);
    
    const analysis = ifcEngine.analyzeIngredients(rawIngredients);
    const recommendation = ifcEngine.generateRecommendation(analysis, healthGoal);
    const mainIngredient = analysis.detectedIngredients[0];
    const references = mainIngredient
      ? ifcEngine.getScientificReferences(mainIngredient.name)
      : [];

    const result = {
      productName,
      productImage,
      totalScore: analysis.totalScore,
      color: analysis.color,
      interpretation: analysis.interpretation,
      domains: {
        obesity: analysis.domainAverages.ob,
        metabolic: analysis.domainAverages.me,
        prebiotic: analysis.domainAverages.pb,
        lipids: analysis.domainAverages.li,
        glycemic: analysis.domainAverages.gl,
        satiety: analysis.domainAverages.sa,
      },
      detectedIngredients: analysis.detectedIngredients.map((ing: any) => ({
        name: ing.name,
        score: ing.totalScore,
        contribution: `${ing.totalScore}/18 puntos`,
      })),
      recommendation,
      references,
      ingredientsList: rawIngredients.slice(0, 20),
    };
    
    res.json(result);
    
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;