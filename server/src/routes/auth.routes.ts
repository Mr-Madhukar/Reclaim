import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validateBody } from '../middleware/validation.middleware';
import { loginSchema, demoLoginSchema } from '../schemas';
import { authenticateToken } from '../middleware/auth.middleware';
import { authRateLimiter } from '../middleware/rate-limit.middleware';

export const authRouter = Router();

authRouter.post('/login', authRateLimiter, validateBody(loginSchema), (req, res) => {
  authController.login(req, res);
});

authRouter.post('/demo', validateBody(demoLoginSchema), (req, res) => {
  authController.demoLogin(req, res);
});

authRouter.get('/me', authenticateToken, (req, res) => {
  authController.me(req, res);
});

authRouter.post('/refresh', (req, res) => {
  authController.refreshToken(req, res);
});

authRouter.post('/logout', authenticateToken, (req, res) => {
  authController.logout(req, res);
});
