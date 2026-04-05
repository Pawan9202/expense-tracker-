const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

const storageTypes = {
  local: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, '../uploads'));
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${uuidv4()}${ext}`);
    }
  }),
  memory: multer.memoryStorage()
};

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and PDF are allowed.'), false);
  }
};

const upload = multer({
  storage: storageTypes.memory,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter
});

class FileStorageService {
  constructor() {
    this.provider = this.detectProvider();
    this.initializeProvider();
  }

  detectProvider() {
    if (config.cloudinary.cloudName) return 'cloudinary';
    if (config.aws.bucket) return 'aws';
    return 'local';
  }

  async initializeProvider() {
    if (this.provider === 'cloudinary') {
      const { v2: cloudinary } = require('cloudinary');
      cloudinary.config({
        cloud_name: config.cloudinary.cloudName,
        api_key: config.cloudinary.apiKey,
        api_secret: config.cloudinary.apiSecret
      });
    }
  }

  async uploadFile(buffer, options = {}) {
    const { filename, folder = 'finance-app' } = options;

    if (this.provider === 'cloudinary') {
      return this.uploadToCloudinary(buffer, filename, folder);
    } else if (this.provider === 'aws') {
      return this.uploadToAWS(buffer, filename, folder);
    } else {
      return this.uploadToLocal(buffer, filename);
    }
  }

  async uploadToCloudinary(buffer, filename, folder) {
    const { v2: cloudinary } = require('cloudinary');
    const uniqueName = `${uuidv4()}-${filename}`;
    
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder, public_id: uniqueName.replace(/\.[^/.]+$/, '') },
        (error, result) => {
          if (error) reject(error);
          else resolve({
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            size: result.bytes
          });
        }
      ).end(buffer);
    });
  }

  async uploadToAWS(buffer, filename, folder) {
    const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
    
    const s3Client = new S3Client({
      region: config.aws.region,
      credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey
      }
    });

    const key = `${folder}/${uuidv4()}-${filename}`;
    
    const command = new PutObjectCommand({
      Bucket: config.aws.bucket,
      Key: key,
      Body: buffer,
      ContentType: require('mime-types').lookup(filename) || 'application/octet-stream'
    });

    await s3Client.send(command);

    return {
      url: `https://${config.aws.bucket}.s3.${config.aws.region}.amazonaws.com/${key}`,
      key
    };
  }

  async uploadToLocal(buffer, filename) {
    const fs = require('fs');
    const path = require('path');
    
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const ext = path.extname(filename);
    const uniqueFilename = `${uuidv4()}${ext}`;
    const filepath = path.join(uploadsDir, uniqueFilename);

    fs.writeFileSync(filepath, buffer);

    return {
      url: `/uploads/${uniqueFilename}`,
      filename: uniqueFilename
    };
  }

  async deleteFile(fileUrl) {
    if (this.provider === 'cloudinary') {
      const { v2: cloudinary } = require('cloudinary');
      const publicId = fileUrl.split('/').slice(-2).join('/').replace(/\.[^/.]+$/, '');
      return cloudinary.uploader.destroy(publicId);
    } else if (this.provider === 'aws') {
      const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
      const key = fileUrl.split('.amazonaws.com/')[1];
      
      const s3Client = new S3Client({ region: config.aws.region });
      await s3Client.send(new DeleteObjectCommand({
        Bucket: config.aws.bucket,
        Key: key
      }));
      return true;
    } else {
      const fs = require('fs');
      const filepath = path.join(__dirname, '../uploads', fileUrl.split('/').pop());
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
      return true;
    }
  }
}

module.exports = new FileStorageService();
module.exports.upload = upload;