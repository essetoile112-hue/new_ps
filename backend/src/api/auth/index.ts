import { Router } from 'express';
import {
  createUserWithEmail,
  verifyIdToken,
  createCustomTokenForGoogle,
  getUserByUid,
} from '../../services/auth.service';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { fullName, country, phoneNumber, email, password } = req.body;
    const user = await createUserWithEmail({ fullName, country, phoneNumber, email, password });
    return res.json({ success: true, user });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// Frontend should send the Firebase ID token in Authorization header
router.post('/login', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = req.body.idToken || (authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);
    if (!token) return res.status(400).json({ success: false, message: 'Missing idToken' });

    const decoded = await verifyIdToken(token);
    const user = await getUserByUid(decoded.uid);
    return res.json({ success: true, user });
  } catch (err: any) {
    return res.status(401).json({ success: false, message: err.message });
  }
});

// Accept Google id_token from the client (Google OAuth sign in flow)
router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ success: false, message: 'Missing idToken' });

    const user = await createCustomTokenForGoogle(idToken);
    return res.json({ success: true, user });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
