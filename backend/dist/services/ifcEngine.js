"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IFCEngine = void 0;
const ingredientsDB = {
    ingredients: [
        {
            name: "fibra de agave",
            keywords: ["agave", "fibra de agave", "inulina de agave"],
            scores: { ob: 3, me: 3, pb: 3, li: 2, gl: 2, sa: 2 }
        },
        {
            name: "curcumina",
            keywords: ["curcumina", "cúrcuma", "turmeric"],
            scores: { ob: 3, me: 3, pb: 2, li: 2, gl: 3, sa: 1 }
        },
        {
            name: "espirulina",
            keywords: ["espirulina", "spirulina", "arthrospira"],
            scores: { ob: 2, me: 3, pb: 2, li: 3, gl: 2, sa: 1 }
        },
        {
            name: "amaranto",
            keywords: ["amaranto", "amaranth", "kiwicha"],
            scores: { ob: 2, me: 2, pb: 3, li: 2, gl: 1, sa: 2 }
        },
        {
            name: "caseinato de calcio",
            keywords: ["caseinato", "caseinato de calcio", "calcium caseinate"],
            scores: { ob: 2, me: 2, pb: 1, li: 2, gl: 1, sa: 3 }
        },
        {
            name: "jengibre",
            keywords: ["jengibre", "ginger", "zingiber"],
            scores: { ob: 2, me: 2, pb: 2, li: 1, gl: 2, sa: 2 }
        },
        {
            name: "cacao",
            keywords: ["cacao", "cocoa", "theobroma", "flavanol"],
            scores: { ob: 2, me: 2, pb: 2, li: 2, gl: 1, sa: 1 }
        },
        {
            name: "harina de coco",
            keywords: ["coco", "coconut flour", "harina de coco"],
            scores: { ob: 1, me: 1, pb: 2, li: 1, gl: 2, sa: 2 }
        },
        {
            name: "maca",
            keywords: ["maca", "lepidium meyenii"],
            scores: { ob: 1, me: 2, pb: 1, li: 1, gl: 1, sa: 1 }
        }
    ]
};
class IFCEngine {
    constructor() {
        this.ingredients = ingredientsDB.ingredients;
    }
    analyzeIngredients(ingredientsList) {
        const normalizedIngredients = ingredientsList.map(i => i.toLowerCase().trim().replace(/[^a-záéíóúñü\s]/g, ''));
        const detected = [];
        for (const ingredient of this.ingredients) {
            const found = normalizedIngredients.some((ni) => ingredient.keywords.some((kw) => ni.includes(kw)));
            if (found) {
                const scores = ingredient.scores;
                // Calcular total correctamente
                const total = scores.ob + scores.me + scores.pb + scores.li + scores.gl + scores.sa;
                detected.push({
                    name: ingredient.name,
                    scores: scores,
                    totalScore: total,
                });
            }
        }
        if (detected.length === 0) {
            return {
                totalScore: 0,
                domainAverages: { ob: 0, me: 0, pb: 0, li: 0, gl: 0, sa: 0 },
                detectedIngredients: [],
                color: 'red',
                interpretation: 'Evidencia limitada - No se detectaron ingredientes funcionales',
            };
        }
        // Sumar todos los scores por dominio
        let obSum = 0, meSum = 0, pbSum = 0, liSum = 0, glSum = 0, saSum = 0;
        for (const ing of detected) {
            obSum += ing.scores.ob;
            meSum += ing.scores.me;
            pbSum += ing.scores.pb;
            liSum += ing.scores.li;
            glSum += ing.scores.gl;
            saSum += ing.scores.sa;
        }
        const domainAverages = {
            ob: obSum / detected.length,
            me: meSum / detected.length,
            pb: pbSum / detected.length,
            li: liSum / detected.length,
            gl: glSum / detected.length,
            sa: saSum / detected.length,
        };
        const totalScore = domainAverages.ob + domainAverages.me + domainAverages.pb +
            domainAverages.li + domainAverages.gl + domainAverages.sa;
        let color;
        let interpretation;
        if (totalScore >= 12) {
            color = 'green';
            interpretation = 'Alta eficacia funcional - Excelente perfil de ingredientes';
        }
        else if (totalScore >= 7) {
            color = 'yellow';
            interpretation = 'Eficacia parcial o especializada - Bueno, pero puede mejorar';
        }
        else {
            color = 'red';
            interpretation = 'Evidencia limitada - Bajo contenido de ingredientes funcionales';
        }
        return {
            totalScore: Math.round(totalScore * 10) / 10,
            domainAverages,
            detectedIngredients: detected.sort((a, b) => b.totalScore - a.totalScore),
            color,
            interpretation,
        };
    }
    generateRecommendation(analysis, healthGoal) {
        const { domainAverages } = analysis;
        const recommendations = [];
        switch (healthGoal) {
            case 'weight_loss':
                if (domainAverages.ob < 2) {
                    recommendations.push('Para potenciar la pérdida de peso, busca productos con fibra de agave o espirulina.');
                }
                if (domainAverages.sa < 2) {
                    recommendations.push('El caseinato de calcio o amaranto pueden ayudar a controlar el apetito.');
                }
                break;
            case 'glycemic_control':
                if (domainAverages.gl < 2) {
                    recommendations.push('Para mejor control glucémico, prioriza alimentos con curcumina o fibra de agave.');
                }
                break;
            case 'gut_health':
                if (domainAverages.pb < 2) {
                    recommendations.push('La fibra de agave y el amaranto son excelentes prebióticos.');
                }
                break;
            case 'body_composition':
                if (domainAverages.ob < 2 || domainAverages.sa < 2) {
                    recommendations.push('Combina caseinato de calcio con espirulina para optimizar composición corporal.');
                }
                break;
            default:
                if (domainAverages.ob < 2) {
                    recommendations.push('Este producto podría mejorar su perfil funcional con ingredientes como fibra de agave.');
                }
        }
        if (recommendations.length === 0) {
            return '¡Excelente elección! Este producto ya tiene un buen perfil funcional para tu objetivo.';
        }
        return recommendations.join(' ');
    }
    getScientificReferences(ingredientName) {
        const references = {
            'fibra de agave': [
                'PubMed: Efecto de la inulina de agave en microbiota intestinal',
                'PubMed: Agave fructans and metabolic syndrome'
            ],
            'curcumina': [
                'PubMed: Curcumin and glycemic control - meta-analysis',
                'PubMed: Curcumin for obesity and inflammation'
            ],
            'espirulina': [
                'PubMed: Spirulina and lipid profile: systematic review'
            ],
            'amaranto': [
                'PubMed: Amaranth as prebiotic and functional food'
            ]
        };
        if (references[ingredientName]) {
            return references[ingredientName];
        }
        return [
            'https://pubmed.ncbi.nlm.nih.gov/?term=functional+foods'
        ];
    }
}
exports.IFCEngine = IFCEngine;
