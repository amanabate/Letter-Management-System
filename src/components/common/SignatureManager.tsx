import React, { useState, useEffect, useRef } from "react";
import SignaturePad from 'react-signature-canvas';
import axios from "axios";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const getSignatureImageUrl = (img: string | null) => {
  if (!img) return null;
  if (img.startsWith('http')) return img;
  return `http://localhost:5000/${img}`;
};

const SignatureManager: React.FC = () => {
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string }>({ type: '', text: '' });
  const signaturePadRef = useRef<any>(null);
  const [user, setUser] = useState<any>(null);

  // Load user and signature from backend and localStorage on mount and on userDataUpdated
  useEffect(() => {
    const loadUser = async () => {
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      let latestUser = userData;
      if (userData._id) {
        try {
          const response = await axios.get(`http://localhost:5000/api/users/${userData._id}`);
          latestUser = response.data;
          localStorage.setItem("user", JSON.stringify(latestUser));
        } catch (err) {
          // fallback to localStorage
        }
      }
      setUser(latestUser);
      setSignatureImage(latestUser.signatureImage ? getSignatureImageUrl(latestUser.signatureImage) : null);
    };
    loadUser();
    const handler = () => loadUser();
    window.addEventListener('userDataUpdated', handler);
    return () => window.removeEventListener('userDataUpdated', handler);
  }, []);

  const handleSignatureFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Please select a valid image file' });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Signature image size should be less than 5MB' });
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setSignatureImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadSignatureImage = async () => {
    if ((!signatureImage && !showSignaturePad) || !user?._id) return;
    setUploadingSignature(true);
    try {
      let formData;
      let isFile = false;
      let dataUrl = signatureImage;
      if (showSignaturePad && signaturePadRef.current) {
        // Always get the current drawing from the pad
        dataUrl = signaturePadRef.current.getCanvas().toDataURL('image/png');
      }
      if (dataUrl && dataUrl.startsWith('data:')) {
        formData = new FormData();
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        formData.append('signatureImage', blob, 'signature.png');
        isFile = true;
      }
      if (!isFile) return;
      const response = await axios.post(
        `http://localhost:5000/api/users/${user._id}/signature`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      const updatedUser = { ...user, signatureImage: response.data.signatureImage };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setSignatureImage(getSignatureImageUrl(response.data.signatureImage));
      setMessage({ type: 'success', text: 'Signature updated successfully!' });
      toast.success('Signature saved successfully!');
      window.dispatchEvent(new Event('userDataUpdated'));
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to upload signature' });
      toast.error('Failed to save signature!');
    } finally {
      setUploadingSignature(false);
    }
  };

  const removeSignature = async () => {
    if (!user) return;
    setSignatureImage(null);
    // Remove from backend (set signatureImage to null)
    try {
      await axios.put(`http://localhost:5000/api/users/${user._id}`, { signatureImage: null });
      const updatedUser = { ...user, signatureImage: null };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setMessage({ type: 'success', text: 'Signature removed.' });
      toast.success('Signature removed.');
      window.dispatchEvent(new Event('userDataUpdated'));
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to remove signature.' });
      toast.error('Failed to remove signature.');
    }
  };

  return (
    <div className="pt-6">
      <label className="block text-sm font-bold text-[#003F5D] mb-1">
        Signature
      </label>
      <div className="flex gap-4 items-center">
        <button
          type="button"
          className={`px-4 py-2 rounded-lg border ${!showSignaturePad ? 'bg-[#C88B3D] text-white' : 'bg-white text-[#003F5D]'}`}
          onClick={() => setShowSignaturePad(false)}
        >
          Upload Image
        </button>
        <button
          type="button"
          className={`px-4 py-2 rounded-lg border ${showSignaturePad ? 'bg-[#C88B3D] text-white' : 'bg-white text-[#003F5D]'}`}
          onClick={() => setShowSignaturePad(true)}
        >
          Draw Signature
        </button>
      </div>
      {!showSignaturePad ? (
        <div className="mt-2">
          <input
            type="file"
            accept="image/*"
            onChange={handleSignatureFileChange}
          />
          {signatureImage && (
            <div className="mt-2">
              <img src={getSignatureImageUrl(signatureImage) || ''} alt="Signature Preview" style={{ maxWidth: 200, maxHeight: 100, border: '1px solid #ccc' }} />
              <button type="button" className="ml-2 text-red-500" onClick={removeSignature}>Remove</button>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-2">
          <SignaturePad
            ref={signaturePadRef}
            penColor="#003F5D"
            canvasProps={{ width: 300, height: 100, className: 'border rounded' }}
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              className="px-3 py-1 bg-[#BFBFBF] text-[#003F5D] rounded"
              onClick={() => {
                signaturePadRef.current?.clear();
                setSignatureImage(null);
              }}
            >
              Clear
            </button>
          </div>
          {signatureImage && (
            <div className="mt-2">
              <img src={getSignatureImageUrl(signatureImage) || ''} alt="Signature Preview" style={{ maxWidth: 200, maxHeight: 100, border: '1px solid #ccc' }} />
              <button type="button" className="ml-2 text-red-500" onClick={removeSignature}>Remove</button>
            </div>
          )}
        </div>
      )}
      <div className="mt-2">
        <button
          type="button"
          className={`bg-[#003F5D] text-white px-4 py-2 rounded-lg mt-2 flex items-center justify-center ${uploadingSignature ? 'opacity-60 cursor-not-allowed' : ''}`}
          onClick={uploadSignatureImage}
          disabled={uploadingSignature || (!signatureImage && !showSignaturePad)}
        >
          {uploadingSignature && (
            <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
          )}
          {uploadingSignature ? 'Saving...' : 'Save Signature'}
        </button>
        {message.text && (
          <div className={`mt-2 text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{message.text}</div>
        )}
      </div>
    </div>
  );
};

export default SignatureManager; 