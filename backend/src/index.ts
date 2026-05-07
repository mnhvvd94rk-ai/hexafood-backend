import express from 'express';
import cors from 'cors';
import analyzeRoutes from './routes/analyze';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use('/api', analyzeRoutes);

app.listen(PORT, () => {
  console.log(`✅ Servidor IFC corriendo en http://localhost:${PORT}`);
});