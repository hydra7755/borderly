import express from 'express';
import { handleAIAssistantRequest } from '../../api/ai-assistant';
import { Request, Response } from 'express';

const router = express.Router();

router.post('/ai-assistant', async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    const response = await handleAIAssistantRequest(message);
    res.json(response);
  } catch (error) {
    console.error('AI Assistant API Error:', error);
    res.status(500).json({ error: 'Failed to get AI response' });
  }
});

export default router; 