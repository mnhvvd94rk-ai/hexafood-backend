"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const axios_1 = __importDefault(require("axios"));
const ifcEngine_1 = require("../services/ifcEngine");
const router = (0, express_1.Router)();
const ifcEngine = new ifcEngine_1.IFCEngine();
router.post('/analyze', async (req, res) => {
    try {
        const { barcode, healthGoal = 'weight_loss' } = req.body;
        if (!barcode) {
            return res.status(400).json({ error: 'Código de barras requerido' });
        }
        const offResponse = await axios_1.default.get(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
        if (offResponse.data.status !== 1) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        const product = offResponse.data.product;
        const productName = product.product_name || 'Producto desconocido';
        const productImage = product.image_url;
        let ingredientsText = product.ingredients_text || '';
        if (!ingredientsText && product.ingredients) {
            ingredientsText = product.ingredients.map((i) => i.text).join(', ');
        }
        if (!ingredientsText) {
            return res.status(422).json({ error: 'Producto sin lista de ingredientes' });
        }
        const rawIngredients = ingredientsText
            .split(/[,;]/)
            .map((i) => i.trim().toLowerCase())
            .filter((i) => i.length > 0);
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
            detectedIngredients: analysis.detectedIngredients.map((ing) => ({
                name: ing.name,
                score: ing.totalScore,
                contribution: `${ing.totalScore}/18 puntos`,
            })),
            recommendation,
            references,
            ingredientsList: rawIngredients.slice(0, 20),
        };
        res.json(result);
    }
    catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});
exports.default = router;
