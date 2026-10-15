import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('[Error Handler]:', err);

  const isUploadTypeError = typeof err.message === 'string' && err.message.includes('Only image files');
  const statusCode = err.statusCode || (err.name === 'MulterError' || isUploadTypeError ? 400 : 500);
  let message = err.message || 'Internal Server Error';

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'อัปโหลดรูปสินค้าได้สูงสุด 5 รูป';
    } else if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'ไฟล์รูปต้องมีขนาดไม่เกิน 5MB ต่อรูป';
    }
  } else if (isUploadTypeError) {
    message = 'อัปโหลดได้เฉพาะไฟล์รูป JPG, PNG, WEBP หรือ GIF';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
};
