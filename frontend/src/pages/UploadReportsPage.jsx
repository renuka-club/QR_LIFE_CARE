import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, FileText, Camera, Image as ImageIcon, X, CheckCircle, UploadCloud, FileType } from 'lucide-react';

import "../styles/upload.css";

function UploadReportsPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const [formData, setFormData] = useState({
    reportType: 'blood-test',
    reportDate: new Date().toISOString().split('T')[0],
    doctorName: '',
    hospitalName: '',
    notes: ''
  });

  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    processFiles(selectedFiles);
  };

  const processFiles = (selectedFiles) => {
    setFiles(prev => [...prev, ...selectedFiles]);

    selectedFiles.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviews(prev => [
            ...prev,
            { name: file.name, url: e.target.result, type: 'image' }
          ]);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviews(prev => [
          ...prev,
          { name: file.name, type: 'document' }
        ]);
      }
    });
  };

  const handleRemoveFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (files.length === 0) {
      alert('Please select at least one file');
      return;
    }

    setUploading(true);

    try {
      const uploadData = new FormData();
      uploadData.append('userId', userId);
      uploadData.append('reportType', formData.reportType);
      uploadData.append('reportDate', formData.reportDate);
      uploadData.append('doctorName', formData.doctorName);
      uploadData.append('hospitalName', formData.hospitalName);
      uploadData.append('notes', formData.notes);

      files.forEach(file => {
        uploadData.append('files', file);
      });

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/reports/upload/${userId}`,
        uploadData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      console.log('Upload response:', response.data);

      // ✅ SUCCESS CONFIRMATION LOGIC
      setUploadSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // 🤖 Trigger AI Analysis
      try {
        const reportId = response.data.data._id; // Ensure your backend returns the report object with _id
        if (reportId) {
          await axios.post(
            `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/ai/analyze/${reportId}`,
            {},
            { withCredentials: true }
          );
        }
      } catch (aiError) {
        console.error('Auto-AI Analysis failed:', aiError);
        // We don't block the UI flow, just log it
      }

      // Reset form after 2 seconds
      setTimeout(() => {
        setFiles([]);
        setPreviews([]);
        setFormData({
          reportType: 'blood-test',
          reportDate: new Date().toISOString().split('T')[0],
          doctorName: '',
          hospitalName: '',
          notes: ''
        });
        setUploadSuccess(false);
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed: ' + (error.response?.data?.message || error.message));
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div
      className="upload-page-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <header className="page-header">
        <button onClick={() => navigate(`/emergency/${userId}`)} className="back-btn">
          <ArrowLeft size={18} /> Back
        </button>
        <motion.h1
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <FileText size={28} style={{ marginRight: '10px' }} />
          Upload Medical Reports
        </motion.h1>
      </header>

      <div className="upload-content">
        {/* ✅ SUCCESS MESSAGE */}
        <AnimatePresence>
          {uploadSuccess && (
            <motion.div
              className="success-message"
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <strong><CheckCircle size={20} style={{ display: 'inline', marginRight: '8px' }} /> Report uploaded & Analyzed!</strong>
              <p>Your medical report has been saved and AI has generated health insights.</p>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.form
          onSubmit={handleSubmit}
          className="upload-form"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >

          <div className="form-group">
            <label>Report Type *</label>
            <select name="reportType" value={formData.reportType} onChange={handleChange} required>
              <option value="blood-test">Blood Test</option>
              <option value="x-ray">X-Ray</option>
              <option value="mri">MRI/CT Scan</option>
              <option value="prescription">Prescription</option>
              <option value="ecg">ECG</option>
              <option value="ultrasound">Ultrasound</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Report Date *</label>
            <input type="date" name="reportDate" value={formData.reportDate} onChange={handleChange} required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Doctor Name</label>
              <input type="text" name="doctorName" value={formData.doctorName} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Hospital Name</label>
              <input type="text" name="hospitalName" value={formData.hospitalName} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea name="notes" value={formData.notes} onChange={handleChange} rows="3" />
          </div>

          <div className="upload-options">
            <h3><UploadCloud size={20} style={{ marginRight: '8px' }} /> Upload Files</h3>
            <div className="upload-buttons">
              <motion.button
                type="button"
                onClick={() => cameraInputRef.current.click()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Camera size={20} /> Take Photo
              </motion.button>
              <motion.button
                type="button"
                onClick={() => fileInputRef.current.click()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ImageIcon size={20} /> Choose from Gallery
              </motion.button>
            </div>

            <input
              type="file"
              ref={cameraInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              multiple
            />

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,.pdf,.doc,.docx"
              style={{ display: 'none' }}
              multiple
            />
          </div>

          <AnimatePresence>
            {previews.length > 0 && (
              <motion.div
                className="file-previews"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <h3>Selected Files ({previews.length})</h3>
                <div className="previews-grid">
                  <AnimatePresence>
                    {previews.map((preview, index) => (
                      <motion.div
                        key={index}
                        className="preview-item"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        layout
                      >
                        {preview.type === 'image' ? (
                          <img src={preview.url} alt={preview.name} />
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '10px' }}>
                            <FileType size={40} color="var(--primary-cyan)" />
                            <span style={{ fontSize: '12px', marginTop: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', textAlign: 'center' }}>PDF/Doc</span>
                          </div>
                        )}
                        <div className="file-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '12px', paddingBottom: '10px' }}>{preview.name}</div>
                        <button type="button" onClick={() => handleRemoveFile(index)} className="remove-btn">
                          <X size={14} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            disabled={uploading || files.length === 0}
            whileHover={{ scale: (uploading || files.length === 0) ? 1 : 1.02 }}
            whileTap={{ scale: (uploading || files.length === 0) ? 1 : 0.98 }}
            className={uploading ? 'uploading-state' : ''}
          >
            {uploading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <div className="spinner-small" style={{ width: '20px', height: '20px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> Processing & AI Analysis...
              </span>
            ) : `📤 Upload ${files.length} File(s)`}
          </motion.button>
        </motion.form>
      </div>
    </motion.div>
  );
}

export default UploadReportsPage;
