import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';
import '../styles/Profiles.css'; // Reusing standard modal styles

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirmar', cancelText = 'Cancelar' }) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle color="#ef4444" size={24} />
            <h2 className="modal-title">{title}</h2>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          <p style={{ margin: 0, color: '#4b5563', fontSize: '14px', lineHeight: '1.5' }}>
            {message}
          </p>
        </div>
        <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
          <button 
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #d1d5db', background: 'white', color: '#374151', cursor: 'pointer' }}
          >
            {cancelText}
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="btn btn-danger"
            style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer' }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmModal;
