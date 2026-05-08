import { Request, Response } from 'express';
import { UserModel } from '../models/user.model';
import { deleteImage, uploadImage } from '../services/cloudinary.service';
import { UpdateProfileInput } from '../validators/profile.validator';

// Fields excluded from all profile responses
const EXCLUDED_FIELDS = '-password -otpCode -otpExpiresAt -resetToken -resetTokenExpiresAt';

export const updateProfile = async (req: Request, res: Response) => {
  const userId = (req as any).user?.sub;
  const { displayName, bio, phone, address, city } = req.body as UpdateProfileInput;

  const user = await UserModel.findByIdAndUpdate(
    userId,
    { displayName, bio, phone, address, city },
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

// --- Address Management ---

export const addAddress = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = (req as any).user?.sub;
    const addressData = req.body;

    const user = await UserModel.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // If this is the first address, make it default
    if (user.addresses.length === 0) {
      addressData.isDefault = true;
    } else if (addressData.isDefault) {
      // If setting this as default, unset others
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    user.addresses.push(addressData);
    await user.save();

    return res.json({ success: true, data: user.addresses });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAddress = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = (req as any).user?.sub;
    const { addressId } = req.params;
    const updateData = req.body;

    const user = await UserModel.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === addressId);
    if (addressIndex === -1) return res.status(404).json({ success: false, message: 'Address not found' });

    if (updateData.isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    user.addresses[addressIndex] = { ...user.addresses[addressIndex], ...updateData };
    await user.save();

    return res.json({ success: true, data: user.addresses });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAddress = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = (req as any).user?.sub;
    const { addressId } = req.params;

    const user = await UserModel.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const address = user.addresses.find(addr => addr._id.toString() === addressId);
    if (!address) return res.status(404).json({ success: false, message: 'Address not found' });

    const wasDefault = address.isDefault;
    user.addresses = user.addresses.filter(addr => addr._id.toString() !== addressId);

    // If we deleted the default, set the first remaining as default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    return res.json({ success: true, data: user.addresses });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const setDefaultAddress = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = (req as any).user?.sub;
    const { addressId } = req.params;

    const user = await UserModel.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    let found = false;
    user.addresses.forEach(addr => {
      if (addr._id.toString() === addressId) {
        addr.isDefault = true;
        found = true;
      } else {
        addr.isDefault = false;
      }
    });

    if (!found) return res.status(404).json({ success: false, message: 'Address not found' });

    await user.save();
    return res.json({ success: true, data: user.addresses });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
