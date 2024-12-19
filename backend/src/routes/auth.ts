import { Router } from 'express';
import { UserRepository } from '../repositories/user.repository';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth';
import { config } from '../config';
import { ObjectId } from 'mongodb';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(6),
});

// Register route
router.post('/register', async (req, res) => {
  try {
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const { email, password, fullName, phone } = validation.data;
    const db = req.app.locals.db;

    // Check if user already exists
    const existingUser = await UserRepository.findByEmail(db, email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create new user
    const user = await UserRepository.create(db, {
      email,
      password,
      fullName,
      phone,
      role: 'customer',
      favorites: [],
      isEmailVerified: false,
    });

    console.log('Creating token for new user:', { // Debug log
      userId: user._id,
      email: user.email,
      role: user.role
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    // Update last login
    await UserRepository.updateLastLogin(db, user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const { email, password } = validation.data;
    const db = req.app.locals.db;

    // Find user
    const user = await UserRepository.findByEmail(db, email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await UserRepository.verifyPassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('Creating token for login:', { // Debug log
      userId: user._id,
      email: user.email,
      role: user.role
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    // Update last login
    await UserRepository.updateLastLogin(db, user._id);

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user route
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const db = req.app.locals.db;
    const user = await UserRepository.findById(db, userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        favorites: user.favorites,
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user route
router.put('/update', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const db = req.app.locals.db;

    // Validate update data
    const updateSchema = z.object({
      fullName: z.string().min(2),
      email: z.string().email(),
      phone: z.string().optional(),
    });

    const validation = updateSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const updateData = validation.data;

    try {
      const updatedUser = await UserRepository.update(db, userId, updateData);
      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        user: {
          id: updatedUser._id,
          email: updatedUser.email,
          fullName: updatedUser.fullName,
          role: updatedUser.role,
          phone: updatedUser.phone,
          favorites: updatedUser.favorites,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Email already in use') {
        return res.status(400).json({ error: 'Email already in use' });
      }
      throw error;
    }
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password route
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const validation = changePasswordSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const { currentPassword, newPassword } = validation.data;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const db = req.app.locals.db;
    const user = await UserRepository.findById(db, userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isPasswordValid = await UserRepository.verifyPassword(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Mevcut şifre yanlış' });
    }

    // Update password
    await UserRepository.updatePassword(db, userId, newPassword);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's favorites
router.get('/favorites', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const db = req.app.locals.db;
    const user = await UserRepository.findById(db, userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get the full business details for each favorite
    const favorites = user.favorites || [];
    const businessesCollection = db.collection('businesses');
    const businessIds = favorites.map(id => new ObjectId(id));
    
    const businessDetails = await businessesCollection
      .find({ _id: { $in: businessIds } })
      .toArray();

    res.json({ favorites: businessDetails });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add to favorites
router.post('/favorites/add', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { businessId } = req.body;
    if (!businessId) {
      return res.status(400).json({ error: 'Business ID is required' });
    }

    const db = req.app.locals.db;
    const user = await UserRepository.findById(db, userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if business exists
    const businessObjectId = new ObjectId(businessId);
    const business = await db.collection('businesses').findOne({ _id: businessObjectId });
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    // Add to favorites if not already added
    const favorites = user.favorites || [];
    if (!favorites.includes(businessId)) {
      await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { $addToSet: { favorites: businessId } }
      );
    }

    res.json({ message: 'İşletme favorilere eklendi' });
  } catch (error) {
    console.error('Add to favorites error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove from favorites
router.post('/favorites/remove', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { businessId } = req.body;
    if (!businessId) {
      return res.status(400).json({ error: 'Business ID is required' });
    }

    const db = req.app.locals.db;
    const user = await UserRepository.findById(db, userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove from favorites
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $pull: { favorites: businessId } }
    );

    res.json({ message: 'İşletme favorilerden kaldırıldı' });
  } catch (error) {
    console.error('Remove from favorites error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 