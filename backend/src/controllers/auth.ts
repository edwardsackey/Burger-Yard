import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';
import crypto from 'crypto';
import { sendOtpSms } from '../services/sms';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, address, role } = req.body;

    if (!email || !password || !phone) {
      res.status(400).json({ message: 'Email, password, and phone are required for registration.' });
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { phone }
        ]
      }
    });
    
    if (existingUser) {
      res.status(400).json({ message: 'User already exists with this email or phone number' });
      return;
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Generate a 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create the user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password_hash,
        phone,
        address,
        role: role || 'CUSTOMER',
        otp,
        otpExpiry
      }
    });

    console.log(`\n\n💬 SMS SIMULATION: Welcome to Burger Yard! Your verification code is ${otp}. It expires in 10 minutes.\n\n`);

    res.status(201).json({ message: 'User registered successfully', userId: user.id });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find the user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    // Reset OTP attempts on successful email login
    if (user.otpAttempts > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: { otpAttempts: 0 }
      });
    }

    // Generate JWT token
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    const secret = process.env.JWT_SECRET || 'fallback_secret';
    const token = jwt.sign(payload, secret, { expiresIn: '1d' });

    res.json({ token, role: user.role, userId: user.id });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/** Phone-first signup for the customer app: name + phone only, no password. */
export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, phone } = req.body;

    if (!name || !phone) {
      res.status(400).json({ message: 'Name and phone are required.' });
      return;
    }

    let user = await prisma.user.findUnique({ where: { phone } });

    if (!user) {
      user = await prisma.user.create({
        data: { name, phone, role: 'CUSTOMER' },
      });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { otp, otpExpiry },
    });

    await sendOtpSms(phone, otp);

    res.status(200).json({ message: 'OTP sent successfully', userId: user.id });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const requestOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone } = req.body;
    
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      res.status(404).json({ message: 'User not found. Please register first.' });
      return;
    }

    // Generate a 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: { otp, otpExpiry }
    });

    await sendOtpSms(phone, otp);

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('OTP request error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, otp } = req.body;

    const user = await prisma.user.findUnique({ where: { phone } });
    
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    if (user.otp !== otp || !user.otpExpiry || user.otpExpiry < new Date()) {
      res.status(400).json({ message: 'Invalid or expired OTP.' });
      return;
    }

    // Clear the OTP on success
    await prisma.user.update({
      where: { id: user.id },
      data: { otp: null, otpExpiry: null }
    });

    // Generate JWT token
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    const secret = process.env.JWT_SECRET || 'fallback_secret';
    const token = jwt.sign(payload, secret, { expiresIn: '1d' });

    res.json({ token, role: user.role, userId: user.id, name: user.name, phone: user.phone });
  } catch (error) {
    console.error('OTP verify error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return 200 to prevent email enumeration attacks
      res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
      return;
    }

    // Generate a secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry }
    });

    console.log(`\n\n📧 EMAIL SIMULATION for ${email}:\nClick here to reset your password: http://localhost:3000/reset-password?token=${resetToken}\n\n`);

    res.json({ message: 'If an account with that email exists, a password reset link has been sent.', token: resetToken });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({ message: 'Token and new password are required' });
      return;
    }

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date() // Must not be expired
        }
      }
    });

    if (!user) {
      res.status(400).json({ message: 'Invalid or expired password reset token' });
      return;
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    // Update the password and clear the reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash,
        resetToken: null,
        resetTokenExpiry: null,
        otpAttempts: 0 // Also unlock the account just in case they were locked out
      }
    });

    res.json({ message: 'Password has been successfully reset. You can now login.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getProfile = async (req: any, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, phone: true, email: true, role: true, address: true }
    });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateProfile = async (req: any, res: Response): Promise<void> => {
  try {
    const { name, phone, address } = req.body;

    // Check if phone is being updated to one that already exists
    if (phone) {
      const existingUser = await prisma.user.findFirst({
        where: { phone, id: { not: req.user.id } }
      });
      if (existingUser) {
        res.status(400).json({ message: 'Phone number is already in use by another account' });
        return;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { name, phone, address },
      select: { id: true, name: true, phone: true, email: true, role: true, address: true }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
