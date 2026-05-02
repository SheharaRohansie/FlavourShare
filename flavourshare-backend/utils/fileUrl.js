const buildFileUrl = (req, filePath) => {
  if (!filePath) return '';
  const normalized = filePath.replace(/\\/g, '/');
  return `${req.protocol}://${req.get('host')}/${normalized}`;
};

const getUploadedFileUrl = (req, file) => {
  if (!file) return '';
  if (file.secure_url) return file.secure_url;
  if (file.url) return file.url;
  if (file.path) {
    if (file.path.startsWith('http')) return file.path;
    return buildFileUrl(req, file.path);
  }
  return '';
};

const getUploadedFilePublicId = (file) => {
  if (!file) return '';
  return file.public_id || file.filename || '';
};

module.exports = { buildFileUrl, getUploadedFileUrl, getUploadedFilePublicId };
