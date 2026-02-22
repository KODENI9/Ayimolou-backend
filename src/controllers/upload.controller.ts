import type { Request, Response } from 'express';
import cloudinary from '../config/cloudinary';

// Helper to use streamifier since cloudinary.uploader.upload_stream works with streams
// I need to install streamifier if I want to use it this way, or just write a small helper.
// A simpler way without streamifier is to use the buffer directly if I want, 
// but streaming is more memory efficient for large files.
// Let's install streamifier to be clean.

export const uploadImage = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    // Stream upload to Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'ayimolou_check',
        resource_type: 'auto',
        transformation: [
          { quality: 'auto', fetch_format: 'auto' }
        ]
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return res.status(500).json({ error: 'Cloudinary upload failed' });
        }
        res.status(200).json({
          url: result?.secure_url,
          public_id: result?.public_id,
        });
      }
    );

    uploadStream.end(req.file.buffer);
  } catch (error) {
    console.error('Upload controller error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
