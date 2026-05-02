import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Car, FileText, CheckCircle, AlertCircle, Save, X, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function RegisterVehiclePage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    make: '',
    model: '',
    year: '',
    color: '',
    license_plate: '',
    seating_capacity: '4',
    country: 'Tanzania',
  });

  const [documents, setDocuments] = useState<Array<{ file: File; type: string }>>([]);
  const [photos, setPhotos] = useState<File[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'doc' | 'photo') => {
    const files = e.target.files;
    if (!files) return;

    if (type === 'doc') {
      const docType = e.target.getAttribute('data-type') || 'OTHER';
      setDocuments(prev => [...prev, { file: files[0], type: docType }]);
    } else {
      setPhotos(prev => [...prev, ...Array.from(files)]);
    }
  };

  const removeDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const requiredDocTypes = ['REGISTRATION', 'INSURANCE', 'OWNERSHIP'];
    const uploadedTypes = documents.map(d => d.type);
    const missingDocs = requiredDocTypes.filter(t => !uploadedTypes.includes(t));
    if (missingDocs.length > 0) {
      toast.error(`Missing required documents: ${missingDocs.join(', ')}. All three are mandatory for vehicle approval.`);
      return;
    }

    setIsLoading(true);
    const data = new FormData();
    
    // Asset basic data
    data.append('name', formData.name || `${formData.year} ${formData.make} ${formData.model}`);
    data.append('description', formData.description);
    data.append('country', formData.country);
    
    // Properties as JSON string for vehicle details
    data.append('properties', JSON.stringify({
      make: formData.make,
      model: formData.model,
      year: formData.year,
      color: formData.color,
      license_plate: formData.license_plate,
      seating_capacity: formData.seating_capacity
    }));

    // Documents
    documents.forEach((doc, index) => {
      data.append('documents', doc.file);
      data.append('document_types', doc.type);
    });

    // Photos
    photos.forEach(photo => {
      data.append('photos', photo);
    });

    try {
      await api.post('/rides/vehicles/', data);
      toast.success('Vehicle registered and submitted for verification!');
      navigate('/rides');
    } catch (error: any) {
      console.error('Registration failed:', error);
      
      let message = 'Failed to register vehicle';
      const responseData = error.response?.data;
      
      if (responseData) {
        if (typeof responseData.error === 'string') {
          message = responseData.error;
        } else if (responseData.error && typeof responseData.error === 'object') {
          const errObj = responseData.error as any;
          message = errObj.message || errObj.code || JSON.stringify(errObj);
        } else if (responseData.detail && typeof responseData.detail === 'string') {
          message = responseData.detail;
        } else if (responseData.message && typeof responseData.message === 'string') {
          message = responseData.message;
        } else if (typeof responseData === 'object') {
          // Handle field-level errors or nested objects
          const firstKey = Object.keys(responseData)[0];
          const firstVal = responseData[firstKey];
          if (Array.isArray(firstVal)) {
            message = `${firstKey}: ${firstVal[0]}`;
          } else if (typeof firstVal === 'string') {
            message = firstVal;
          } else {
            message = JSON.stringify(responseData);
          }
        }
      }
      
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Register Your Vehicle</h1>
        <p className="text-gray-500 font-medium">Register your vehicle to start offering rides and earning.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Vehicle Information */}
        <div className="card p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Car className="h-6 w-6 text-primary-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Vehicle Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="label">Vehicle Display Name</label>
              <input 
                type="text" 
                name="name"
                placeholder="e.g. My Blue Sedan" 
                className="input" 
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <label className="label">Make</label>
              <input 
                type="text" 
                name="make"
                placeholder="e.g. Toyota" 
                className="input" 
                value={formData.make}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <label className="label">Model</label>
              <input 
                type="text" 
                name="model"
                placeholder="e.g. Camry" 
                className="input" 
                value={formData.model}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <label className="label">Year</label>
              <input 
                type="number" 
                name="year"
                placeholder="2022" 
                className="input" 
                value={formData.year}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <label className="label">Color</label>
              <input 
                type="text" 
                name="color"
                placeholder="e.g. Metallic Blue" 
                className="input" 
                value={formData.color}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <label className="label">License Plate</label>
              <input 
                type="text" 
                name="license_plate"
                placeholder="KCA 123X" 
                className="input" 
                value={formData.license_plate}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <label className="label">Country</label>
              <input 
                type="text" 
                name="country"
                className="input" 
                value={formData.country}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <label className="label">Seating Capacity</label>
              <select 
                name="seating_capacity"
                className="input"
                value={formData.seating_capacity}
                onChange={handleInputChange}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                  <option key={n} value={n}>{n} Seats</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Verification Documents */}
        <div className="card p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-100 rounded-lg">
              <FileText className="h-6 w-6 text-orange-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Verification Documents</h2>
          </div>
          
          <div className="bg-red-50 p-4 rounded-xl border border-red-200 mb-6 flex gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800">
              <strong>All 3 documents are mandatory</strong> for vehicle approval: <strong>Registration</strong>, <strong>Insurance</strong>, and <strong>Ownership Proof</strong>. 
              Your vehicle will NOT be verified without all three.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[
              { id: 'REGISTRATION', label: 'Registration' },
              { id: 'INSURANCE', label: 'Insurance' },
              { id: 'OWNERSHIP', label: 'Ownership Proof' }
            ].map(docType => (
              <div key={docType.id} className="relative">
                <input 
                  type="file" 
                  id={docType.id}
                  className="hidden"
                  data-type={docType.id}
                  onChange={(e) => handleFileChange(e, 'doc')}
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                <label 
                  htmlFor={docType.id}
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-2xl hover:border-primary-500 hover:bg-primary-50 transition-all cursor-pointer group"
                >
                  <Plus className="h-6 w-6 text-gray-400 group-hover:text-primary-500 mb-2" />
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{docType.label}</span>
                </label>
              </div>
            ))}
          </div>

          {documents.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Uploaded Documents</p>
              {documents.map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{doc.file.name}</p>
                      <p className="text-[10px] font-bold text-primary-600 uppercase">{doc.type}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => removeDocument(idx)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Photos */}
        <div className="card p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <Upload className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Vehicle Photos</h2>
          </div>

          <div className="flex flex-wrap gap-4 mb-6">
            {photos.map((photo, idx) => (
              <div key={idx} className="relative w-32 h-32 rounded-xl overflow-hidden group">
                <img src={URL.createObjectURL(photo)} alt="" className="w-full h-full object-cover" />
                <button 
                  type="button" 
                  onClick={() => removePhoto(idx)}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <label className="w-32 h-32 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl hover:border-primary-500 hover:bg-primary-50 transition-all cursor-pointer">
              <Plus className="h-6 w-6 text-gray-400" />
              <input type="file" multiple className="hidden" onChange={(e) => handleFileChange(e, 'photo')} accept="image/*" />
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button 
            type="submit" 
            className="btn-primary flex-1 py-4 text-lg font-black uppercase tracking-widest flex items-center justify-center gap-3"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <CheckCircle className="h-6 w-6" />
            )}
            Submit Registration
          </button>
          <button 
            type="button" 
            onClick={() => navigate(-1)} 
            className="btn-secondary px-8"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function Loader2({ className }: { className?: string }) {
  return <div className={`animate-spin rounded-full border-2 border-current border-t-transparent ${className}`} />;
}
