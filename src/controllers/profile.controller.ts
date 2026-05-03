import { Request, Response } from 'express';
import { UserModel } from '../models/user.model';
import { deleteImage, uploadImage } from '../services/cloudinary.service';
import { UpdateProfileInput } from '../validators/profile.validator';

// Fields excluded from all profile responses
const EXCLUDED_FIELDS = '-password -otpCode -otpExpiresAt -resetToken -resetTokenExpiresAt';

export const updateProfile = async (req: Request, res: Response) => {
  const userId = (req as any).user?.sub;
  const { displayName, bio, phone } = req.body as UpdateProfileInput;

  const user = await UserModel.findByIdAndUpdate(
    userId,
    { displayName, bio, phone },
    { new: true, runValidators: true }
  ).select(EXCLUDED_FIELDS);

  if (!user) return res.status(404).json({ message: 'User not found' });
  return res.json(user);
};

export const uploadAvatar = async (req: Request, res: Response) => {
  const userId = (req as any).user?.sub;

  if (!req.file) return res.status(400).json({ message: 'No file provided' });

  const user = await UserModel.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  // Delete old avatar from Cloudinary if it exists
  if (user.avatarUrl) {
    // Extract public ID: last two path segments joined by '/' without extension
    const parts = user.avatarUrl.split('/');
    const filename = parts[parts.length - 1].replace(/\.[^/.]+$/, '');
    const folder = parts[parts.length - 2];
    const oldPublicId = `${folder}/${filename}`;
    await deleteImage(oldPublicId).catch(() => {
      // Non-fatal: old image cleanup failure should not block the upload
    });
  }

  const { url, publicId } = await uploadImage(req.file.buffer, 'avatars');
  user.avatarUrl = url;
  await user.save();

  const updated = await UserModel.findById(userId).select(EXCLUDED_FIELDS);
  return res.json({ avatarUrl: url, publicId, user: updated });
};
