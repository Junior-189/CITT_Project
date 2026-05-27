const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const ALLOWED_MIMES = {
  images: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
  ],
};

const MAX_SIZES = {
  profile: 5 * 1024 * 1024,
  gallery: 10 * 1024 * 1024,
  director: 5 * 1024 * 1024,
  milestone: 15 * 1024 * 1024,
  submission: 15 * 1024 * 1024,
};

const FILE_SIGNATURES = {
  jpeg: Buffer.from([0xFF, 0xD8, 0xFF]),
  png: Buffer.from([0x89, 0x50, 0x4E, 0x47]),
  gif: Buffer.from([0x47, 0x49, 0x46, 0x38]),
  webp: Buffer.from([0x52, 0x49, 0x46, 0x46]),
  pdf: Buffer.from([0x25, 0x50, 0x44, 0x46]),
  docx: Buffer.from([0x50, 0x4B, 0x03, 0x04]),
};

const checkFileSignature = (buffer, expectedType) => {
  if (expectedType === 'image/jpeg' || expectedType === 'image/jpg') {
    return buffer.slice(0, 3).equals(FILE_SIGNATURES.jpeg);
  }
  if (expectedType === 'image/png') {
    return buffer.slice(0, 4).equals(FILE_SIGNATURES.png);
  }
  if (expectedType === 'image/webp') {
    return buffer.slice(0, 4).equals(FILE_SIGNATURES.webp) &&
           buffer.slice(8, 15).toString() === 'WEBPVP8';
  }
  if (expectedType === 'application/pdf') {
    return buffer.slice(0, 4).equals(FILE_SIGNATURES.pdf);
  }
  return true;
};

class VirusScanStub {
  static async scan(filePath) {
    const isEnabled = process.env.CLAMAV_ENABLED === 'true';
    if (!isEnabled) return { safe: true, message: 'Virus scan disabled (set CLAMAV_ENABLED=true to enable)' };

    const clamavHost = process.env.CLAMAV_HOST || 'localhost';
    const clamavPort = parseInt(process.env.CLAMAV_PORT || '3310');

    try {
      const net = require('net');
      return await new Promise((resolve) => {
        const socket = new net.Socket();
        const timeout = setTimeout(() => {
          socket.destroy();
          resolve({ safe: false, message: 'ClamAV scan timed out' });
        }, 30000);

        socket.connect(clamavPort, clamavHost, () => {
          socket.write(`SCAN ${filePath}\r\n`);
        });

        let response = '';
        socket.on('data', (data) => {
          response += data.toString();
          if (response.includes('\n')) {
            clearTimeout(timeout);
            const clean = response.includes('OK') && !response.includes('FOUND');
            socket.destroy();
            resolve({ safe: clean, message: response.trim() });
          }
        });

        socket.on('error', () => {
          clearTimeout(timeout);
          resolve({ safe: false, message: 'ClamAV connection failed' });
        });
      });
    } catch {
      return { safe: false, message: 'Virus scan error' };
    }
  }
}

const createUploader = (options = {}) => {
  const {
    uploadDir,
    allowedMimes = ALLOWED_MIMES.images,
    maxSize = MAX_SIZES.gallery,
    fieldName = 'image',
    maxFiles = 1,
  } = options;

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage = multer.memoryStorage();

  const upload = multer({
    storage,
    limits: { fileSize: maxSize, files: maxFiles },
    fileFilter: (req, file, cb) => {
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        const allowed = allowedMimes.map(m => m.split('/')[1]).join(', ');
        cb(new Error(`File type not allowed. Accepted: ${allowed}`), false);
      }
    },
  });

  return upload;
};

const processImage = async (buffer, options = {}) => {
  try {
    const sharp = require('sharp');
    const { maxWidth = 1920, maxHeight = 1080, quality = 85, format = 'jpeg' } = options;

    let sharpInstance = sharp(buffer);

    const metadata = await sharpInstance.metadata();
    if (metadata.width > maxWidth || metadata.height > maxHeight) {
      sharpInstance = sharpInstance.resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    if (format === 'jpeg' || format === 'jpg') {
      return await sharpInstance.jpeg({ quality }).toBuffer();
    } else if (format === 'webp') {
      return await sharpInstance.webp({ quality }).toBuffer();
    } else if (format === 'png') {
      return await sharpInstance.png({ quality: Math.min(quality / 100, 1) }).toBuffer();
    }

    return buffer;
  } catch {
    return buffer;
  }
};

const createSecureUploader = (options = {}) => {
  const uploadDir = options.uploadDir;
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage = multer.memoryStorage();

  const upload = multer({
    storage,
    limits: {
      fileSize: options.maxSize || MAX_SIZES.gallery,
      files: options.maxFiles || 1,
    },
    fileFilter: (req, file, cb) => {
      const allowed = options.allowedMimes || ALLOWED_MIMES.images;
      if (allowed.includes(file.mimetype)) {
        cb(null, true);
      } else {
        const types = allowed.map(m => m.split('/')[1]).join(', ');
        cb(new Error(`File type not allowed. Accepted: ${types}`), false);
      }
    },
  });

  const handleUpload = async (req, res, next) => {
    try {
      if (!req.file && options.fieldName && req.files?.[options.fieldName]) {
        req.file = req.files[options.fieldName][0];
      }

      if (!req.file) {
        if (options.required === false) return next();
        return res.status(400).json({ error: 'File is required' });
      }

      const sigValid = checkFileSignature(req.file.buffer, req.file.mimetype);
      if (!sigValid) {
        return res.status(400).json({ error: 'File appears to be corrupted or has an invalid signature' });
      }

      let processedBuffer = req.file.buffer;
      let finalExt = path.extname(req.file.originalname).toLowerCase() || '.jpg';

      if (options.processImage !== false && ALLOWED_MIMES.images.includes(req.file.mimetype)) {
        processedBuffer = await processImage(req.file.buffer, {
          maxWidth: options.maxWidth || 1920,
          maxHeight: options.maxHeight || 1080,
          quality: options.quality || 85,
          format: options.outputFormat || 'jpeg',
        });
        if (options.outputFormat) {
          finalExt = `.${options.outputFormat}`;
        }
      }

      const uniqueName = `${options.prefix || 'file'}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${finalExt}`;
      const filePath = path.join(uploadDir, uniqueName);

      const relativeUrl = filePath.replace(path.join(__dirname, '..'), '').replace(/\\/g, '/');

      const virusResult = await VirusScanStub.scan(filePath);
      if (options.scanVirus !== false && !virusResult.safe) {
        return res.status(400).json({
          error: 'File failed security scan',
          details: process.env.NODE_ENV === 'development' ? virusResult.message : undefined,
        });
      }

      fs.writeFileSync(filePath, processedBuffer);

      req.uploadedFile = {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        filename: uniqueName,
        path: filePath,
        url: relativeUrl,
        size: processedBuffer.length,
        mimetype: req.file.mimetype,
      };

      next();
    } catch (error) {
      if (error.message.includes('File type not allowed') || error.message.includes('large')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  };

  return { upload, handleUpload };
};

module.exports = {
  createUploader,
  createSecureUploader,
  processImage,
  VirusScanStub,
  ALLOWED_MIMES,
  MAX_SIZES,
  checkFileSignature,
};
