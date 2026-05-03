import { Request, Response } from 'express';
import { UserModel } from '../models/user.model';

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await UserModel.find().select('-password -otpCode -resetToken').sort({ createdAt: -1 });
    return res.json({ success: true, data: users });
  } catch (error: any) {
    console.error('getAllUsers error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const user = await UserModel.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true }
    ).select('-password -otpCode -resetToken');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({ success: true, data: user });
  } catch (error: any) {
    console.error('updateUserRole error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
