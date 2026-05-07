const cloudinary = require('cloudinary').v2;

// Cloudinary service — upload and delete fee proof files.
// Falls back to storing the raw base64 string when Cloudinary is not configured (dev mode).

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Uploads a data URI to Cloudinary; returns { url, publicId }.
const uploadProof = async (dataUri, folder = 'fee-proofs') => {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    console.warn('[Cloudinary] Not configured — storing proof as base64 (dev mode)');
    return { url: dataUri, publicId: null };
  }
  const result = await cloudinary.uploader.upload(dataUri, {
    folder,
    resource_type: 'auto',
    allowed_formats: ['pdf', 'jpg', 'jpeg', 'png'],
  });
  return { url: result.secure_url, publicId: result.public_id };
};

// Deletes a previously uploaded proof by its Cloudinary public ID.
const deleteProof = async (publicId) => {
  if (!publicId || !process.env.CLOUDINARY_CLOUD_NAME) return;
  await cloudinary.uploader.destroy(publicId, { resource_type: 'auto' });
};

module.exports = { uploadProof, deleteProof };
