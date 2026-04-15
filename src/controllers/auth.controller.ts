import { Request, Response } from 'express';
import { UserModel } from '../models/user.model';
import { comparePassword, hashPassword } from '../utils/hash';
import { signToken } from '../utils/jwt';
import { createUserWithOtp, issueOtpForUser, issueResetToken } from '../services/user.service';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await createUserWithOtp(email, password);

    if (!user) return res.status(409).json({ message: 'Email already exists' });

    return res.status(201).json({ message: 'OTP has been sent to your email' });
  } catch (error: any) {
    console.error("Register Error:", error);
    return res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email });

    // 1. Kiểm tra user tồn tại và mật khẩu
    if (!user || !(await comparePassword(password, user.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 2. Kiểm tra xác thực email
    if (!user.isEmailVerified) {
      return res.status(403).json({ message: 'Please verify your email first using register OTP' });
    }

    // 3. Gửi OTP login (Lỗi 500 thường xuất hiện ở đây nếu lỗi Mail Service)
    await issueOtpForUser(String(user._id));

    return res.status(202).json({
      message: 'OTP has been sent to your email',
      requiresOtp: true,
      email: user.email
    });
  } catch (error: any) {
    console.error("Login Error:", error);
    return res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

export const verifyLoginOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    const user = await UserModel.findOne({ email });

    if (!user || user.otpCode !== otp || !user.otpExpiresAt || user.otpExpiresAt.getTime() < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.otpCode = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    const token = signToken({ sub: String(user._id), email: user.email, role: user.role });
    return res.json({ token });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub; // Đảm bảo authGuard đã set req.user
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const user = await UserModel.findById(userId).select('-password -otpCode -resetToken');
    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.json(user);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const verifyRegisterOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    const user = await UserModel.findOne({ email });

    if (!user || user.otpCode !== otp || !user.otpExpiresAt || user.otpExpiresAt.getTime() < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.isEmailVerified = true;
    user.otpCode = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    return res.json({ message: 'Email verified successfully' });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    await issueResetToken(email);
    return res.json({ message: 'Reset password token sent to your email' });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, token, newPassword } = req.body;
    const user = await UserModel.findOne({ email });

    if (!user || user.resetToken !== token || !user.resetTokenExpiresAt || user.resetTokenExpiresAt.getTime() < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    user.password = await hashPassword(newPassword);
    user.resetToken = undefined;
    user.resetTokenExpiresAt = undefined;
    await user.save();

    return res.json({ message: 'Password reset successful' });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};