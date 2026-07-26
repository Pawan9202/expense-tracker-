import api from './api';

const handleUpload = async (endpoint, file, type) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);

  try {
    const response = await api.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000,
    });
    return { ...response.data, success: true };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.response?.data?.error || 'An unknown upload error occurred.'
    };
  }
};

export const uploadService = {
  async uploadReceipt(file) {
    return handleUpload('/upload/receipt', file, 'receipt');
  },

  async uploadStatement(file) {
    return handleUpload('/upload/statement', file, 'statement');
  },

  async getSupportedFormats() {
    try {
      const response = await api.get('/upload/supported-formats');
      return response.data;
    } catch (error) {
      return {
        receipt: { formats: ['JPG', 'PNG', 'TIFF'] },
        statement: { formats: ['PDF'] }
      };
    }
  }
};
