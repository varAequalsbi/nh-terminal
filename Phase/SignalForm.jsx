// src/components/Signals/SignalForm.jsx
import React, { useState } from 'react';
import { Upload } from 'lucide-react';

export default function SignalForm({ onClose, onSubmit }) {
  const [signalType, setSignalType] = useState('BUY');
  const [formData, setFormData] = useState({
    entry: '',
    stopLoss: '',
    tp1: '',
    tp2: '',
    entryConfirm: '',
    notes: '',
    chart: null,
  });
  const [errors, setErrors] = useState({});

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: null }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, chart: file }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.entry) newErrors.entry = 'Entry price is required';
    if (!formData.stopLoss) newErrors.stopLoss = 'Stop loss is required';
    if (!formData.tp1) newErrors.tp1 = 'TP 1 is required';
    
    // Numeric validation
    if (formData.entry && isNaN(parseFloat(formData.entry))) {
      newErrors.entry = 'Must be a valid number';
    }
    if (formData.stopLoss && isNaN(parseFloat(formData.stopLoss))) {
      newErrors.stopLoss = 'Must be a valid number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const newSignal = {
      type: signalType,
      ...formData,
    };

    if (onSubmit) onSubmit(newSignal);
  };

  return (
    <div className="bg-bg-secondary border-2 border-cyan-500 p-6 mb-6">
      <h2 className="text-2xl font-bold text-text-primary italic mb-6">SIGNAL BARU</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1: Signal Type */}
        <div>
          <label className="text-sm text-text-secondary mb-2 block">SIGNAL TYPE</label>
          <div className="space-y-2">
            <button
              onClick={() => setSignalType('BUY')}
              className={`w-full py-3 font-bold text-sm border-2 transition-colors ${
                signalType === 'BUY'
                  ? 'bg-color-success bg-opacity-20 border-color-success text-color-success'
                  : 'bg-bg-tertiary border-border-color text-text-secondary'
              }`}
            >
              BUY
            </button>
            <button
              onClick={() => setSignalType('SELL')}
              className={`w-full py-3 font-bold text-sm border-2 transition-colors ${
                signalType === 'SELL'
                  ? 'bg-color-danger bg-opacity-20 border-color-danger text-color-danger'
                  : 'bg-bg-tertiary border-border-color text-text-secondary'
              }`}
            >
              SELL
            </button>
          </div>
        </div>

        {/* Column 2: Price Fields */}
        <div className="space-y-4">
          <div>
            <label className="text-sm text-text-secondary mb-1 block">Entry</label>
            <input
              type="text"
              value={formData.entry}
              onChange={(e) => handleChange('entry', e.target.value)}
              className={`w-full bg-bg-tertiary border px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-cyan-500 ${
                errors.entry ? 'border-color-danger' : 'border-border-color'
              }`}
              placeholder="0.00"
            />
            {errors.entry && <p className="text-xs text-color-danger mt-1">{errors.entry}</p>}
          </div>

          <div>
            <label className="text-sm text-text-secondary mb-1 block">Stop Loss</label>
            <input
              type="text"
              value={formData.stopLoss}
              onChange={(e) => handleChange('stopLoss', e.target.value)}
              className={`w-full bg-bg-tertiary border px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-cyan-500 ${
                errors.stopLoss ? 'border-color-danger' : 'border-border-color'
              }`}
              placeholder="0.00"
            />
            {errors.stopLoss && <p className="text-xs text-color-danger mt-1">{errors.stopLoss}</p>}
          </div>

          <div>
            <label className="text-sm text-text-secondary mb-1 block">TP 1</label>
            <input
              type="text"
              value={formData.tp1}
              onChange={(e) => handleChange('tp1', e.target.value)}
              className={`w-full bg-bg-tertiary border px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-cyan-500 ${
                errors.tp1 ? 'border-color-danger' : 'border-border-color'
              }`}
              placeholder="0.00"
            />
            {errors.tp1 && <p className="text-xs text-color-danger mt-1">{errors.tp1}</p>}
          </div>

          <div>
            <label className="text-sm text-text-secondary mb-1 block">TP 2 (Opsional)</label>
            <input
              type="text"
              value={formData.tp2}
              onChange={(e) => handleChange('tp2', e.target.value)}
              className="w-full bg-bg-tertiary border border-border-color px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-cyan-500"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Column 3: Notes + Upload */}
        <div className="space-y-4">
          <div>
            <label className="text-sm text-text-secondary mb-1 block">Entry</label>
            <input
              type="text"
              value={formData.entryConfirm}
              onChange={(e) => handleChange('entryConfirm', e.target.value)}
              className="w-full bg-bg-tertiary border border-border-color px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-cyan-500"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="text-sm text-text-secondary mb-1 block">Catatan / Analisa</label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="w-full bg-bg-tertiary border border-border-color px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-cyan-500"
              placeholder="Resistance H4 Kuat..."
            />
          </div>

          <div>
            <label className="text-sm text-text-secondary mb-2 block">Upload Chart</label>
            <label className="flex items-center justify-center w-full h-24 bg-bg-tertiary border-2 border-dashed border-border-color cursor-pointer hover:border-cyan-500 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="text-center">
                <Upload size={24} className="text-color-gold mx-auto mb-1" />
                {formData.chart && (
                  <p className="text-xs text-text-secondary">{formData.chart.name}</p>
                )}
              </div>
            </label>
          </div>

          <button
            onClick={handleSubmit}
            className="w-full py-3 bg-color-gold text-bg-primary font-bold text-sm hover:bg-opacity-90 transition-colors"
          >
            PUBLISH SIGNAL
          </button>
        </div>
      </div>
    </div>
  );
}
