import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

function centerGrid(grid: number[][]): number[][] {
  const height = grid.length;
  if (height === 0) return grid;
  const width = grid[0].length;
  if (width === 0) return grid;

  let minRow = height, maxRow = -1, minCol = width, maxCol = -1, hasNonZero = false;
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (grid[r][c] !== 0) {
        hasNonZero = true;
        if (r < minRow) minRow = r;
        if (r > maxRow) maxRow = r;
        if (c < minCol) minCol = c;
        if (c > maxCol) maxCol = c;
      }
    }
  }
  if (!hasNonZero) return grid;

  const bboxHeight = maxRow - minRow + 1;
  const bboxWidth = maxCol - minCol + 1;
  const targetStartRow = Math.floor((height - bboxHeight) / 2);
  const targetStartCol = Math.floor((width - bboxWidth) / 2);
  const offsetY = targetStartRow - minRow;
  const offsetX = targetStartCol - minCol;

  if (offsetX === 0 && offsetY === 0) return grid;

  const newGrid: number[][] = Array.from({ length: height }, () => Array(width).fill(0));
  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      const val = grid[r][c];
      if (val !== 0) {
        const newR = r + offsetY;
        const newC = c + offsetX;
        if (newR >= 0 && newR < height && newC >= 0 && newC < width) {
          newGrid[newR][newC] = val;
        }
      }
    }
  }
  return newGrid;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Initialize Gemini AI Client
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // AI Pixel Art Generator API
  app.post('/api/generate-pixel-art', async (req, res) => {
    try {
      const { prompt, gridSize = 30, colorCount = 8, category = 'AI Generated' } = req.body;

      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Prompt string is required' });
      }

      const requestedDim = Number(gridSize) || 30;
      const dimension = requestedDim >= 36 ? 40 : requestedDim >= 25 ? 30 : 20;
      const numColors = Math.min(Math.max(Number(colorCount) || 6, 4), 12);

      const systemInstruction = `You are a master 8-bit / 16-bit pixel artist and color-by-number puzzle architect.
Your task is to design a crisp, recognizable, beautifully detailed pixel art sprite on a ${dimension}x${dimension} grid based on the user's prompt.

Guidelines:
1. Palette: Create exactly ${numColors} distinct, visually appealing hex color codes (e.g. "#EF4444", "#3B82F6", "#10B981"). Give each color a descriptive name.
2. Grid: Generate a 2D matrix of dimensions ${dimension} x ${dimension}.
3. Numbers: Each cell in the matrix MUST be an integer between 0 and ${numColors}.
   - 0 represents transparent background or void.
   - 1 to ${numColors} correspond to the 1-indexed ID in your color palette.
4. Ensure the pixel sprite is centered, nicely shaped, and forms a complete, aesthetically pleasing object or scene for a color by number game.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: `Create a pixel art color-by-number artwork for: "${prompt}". Grid size: ${dimension}x${dimension}. Max colors: ${numColors}.`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: 'Short catchy title for the artwork' },
              palette: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.INTEGER, description: '1-based color index integer (1..N)' },
                    hex: { type: Type.STRING, description: 'Hex color code e.g. #FF5500' },
                    name: { type: Type.STRING, description: 'Color name e.g. Ruby Red' },
                  },
                  required: ['id', 'hex', 'name'],
                },
              },
              grid: {
                type: Type.ARRAY,
                description: `${dimension} rows, each containing ${dimension} integers (0 for transparent or 1..N for palette color)`,
                items: {
                  type: Type.ARRAY,
                  items: { type: Type.INTEGER },
                },
              },
            },
            required: ['title', 'palette', 'grid'],
          },
        },
      });

      const jsonText = response.text || '';
      const parsedData = JSON.parse(jsonText);

      // Validate matrix dimensions and clean data
      let grid: number[][] = parsedData.grid || [];
      if (!Array.isArray(grid) || grid.length !== dimension) {
        // Fallback grid repair
        grid = Array.from({ length: dimension }, () => Array(dimension).fill(0));
      }

      const validatedGrid = grid.slice(0, dimension).map(row => {
        if (!Array.isArray(row)) return Array(dimension).fill(0);
        const sliced = row.slice(0, dimension);
        while (sliced.length < dimension) sliced.push(0);
        return sliced.map(val => (typeof val === 'number' && val >= 0 && val <= numColors ? Math.floor(val) : 0));
      });

      const centeredGrid = centerGrid(validatedGrid);

      const artwork = {
        id: `ai_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: parsedData.title || prompt.slice(0, 24),
        category: category || 'AI Generated',
        difficulty: dimension <= 16 ? 'Easy' : dimension <= 24 ? 'Medium' : 'Hard',
        width: dimension,
        height: dimension,
        palette: parsedData.palette || [],
        grid: centeredGrid,
        isUserCreated: true,
        createdAt: Date.now(),
      };

      return res.json({ success: true, artwork });
    } catch (error: unknown) {
      console.error('Error generating pixel art with Gemini:', error);
      const message = error instanceof Error ? error.message : 'Failed to generate pixel artwork';
      return res.status(500).json({ error: message });
    }
  });

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Color by Pixel server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
