import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_change_me_in_prod';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.token;

  if (!token) {
    res.status(401).json({ error: 'No autorizado. Token no proporcionado.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string };
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'No autorizado. Token inválido.' });
    return;
  }
};
