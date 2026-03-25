import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { adminAPI } from '@/utils/api';
import { toast } from 'react-hot-toast';
import Layout from '@/components/Layout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import SignatureCanvas from 'react-signature-canvas';
import { PenTool, Upload, Image as ImageIcon, Save, Shield, ShieldAlert } from 'lucide-react';

export default function AdminSignature() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [signatureUrl, setSignatureUrl] = useState('');
  const [name, setName] = useState('EduX CEO');
  const [inputType, setInputType] = useState<'draw' | 'upload'>('draw');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const sigCanvasRef = useRef<SignatureCanvas>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) {
      toast.error('Unauthorized access');
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchSignature = async () => {
      try {
        const data: any = await adminAPI.getSignature();
        if (data && data.signatureUrl) {
          setSignatureUrl(data.signatureUrl);
          setName(data.name || 'EduX CEO');
        }
      } catch (err: any) {
        if (err.status !== 404 && err.message !== 'No platform signature found') {
          console.error('Error fetching admin signature', err);
        }
      } finally {
        setIsLoading(false);
      }
    };
    if (user && user.role === 'ADMIN') {
      fetchSignature();
    }
  }, [user]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Some Windows local files might not have a reliable type, so we check extension too just in case
    const isImage = file.type.includes('image') || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(file.name);
    
    if (!isImage) {
      toast.error('Please upload a valid image file');
      return;
    }
    
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      toast.error('Signature size must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const b64 = ev.target?.result as string;
      setSignatureUrl(b64);
      toast.success('Image loaded for signature');
    };
    reader.onerror = () => {
      toast.error('Failed to read file');
    };
    reader.readAsDataURL(file);
    
    // Reset file input to allow re-uploading the same file if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const clearSignature = () => {
    sigCanvasRef.current?.clear();
    setSignatureUrl('');
  };

  const captureSignature = () => {
    if (sigCanvasRef.current?.isEmpty()) {
      toast.error('Please draw a signature first');
      return false;
    }
    // Use getCanvas() as getTrimmedCanvas() can throw internal webpack errors depending on env
    const dataUrl = sigCanvasRef.current?.getCanvas().toDataURL('image/png');
    setSignatureUrl(dataUrl || '');
    return dataUrl || '';
  };

  const handleSave = async () => {
    let finalUrl = signatureUrl;
    
    if (inputType === 'draw') {
      const url = captureSignature();
      if (!url) return;
      finalUrl = url;
    }

    if (!finalUrl) {
      toast.error('Please provide a signature');
      return;
    }

    if (!name.trim()) {
      toast.error('CEO Name is required');
      return;
    }

    setIsSaving(true);
    try {
      await adminAPI.updateSignature({ name, signatureUrl: finalUrl });
      toast.success('Global signature updated successfully. This will appear on all future certificates.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save signature');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || isLoading || !user || user.role !== 'ADMIN') {
    return (
      <Layout>
        <div className="flex justify-center flex-col items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-500">Verifying Admin Credentials...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-red-100 text-red-600 rounded-xl dark:bg-red-900/40 dark:text-red-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Global Certificate Settings</h1>
            <p className="text-gray-500 dark:text-gray-400">Admin Panel • Platform CEO Signature</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Platform Authority Signature</h2>
              <p className="text-sm text-gray-500 mb-6">
                This signature will appear on all automatically generated certificates across the platform, representing the official platform endorsement.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Signatory Name / Title
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Muni Mahesh, CEO"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 outline-none rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Signature Image
                  </label>
                  
                  <div className="flex gap-2 mb-4">
                    <button
                      type="button"
                      onClick={() => setInputType('draw')}
                      className={`flex-1 flex justify-center items-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                        inputType === 'draw'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <PenTool className="w-4 h-4" />
                      Draw Signature
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputType('upload')}
                      className={`flex-1 flex justify-center items-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                        inputType === 'upload'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <Upload className="w-4 h-4" />
                      Upload Image
                    </button>
                  </div>

                  {inputType === 'draw' ? (
                    <div className="space-y-4">
                      <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg flex items-center gap-2 mb-2 border border-blue-100 dark:border-blue-800">
                        <PenTool className="w-5 h-5 text-blue-500" />
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          Please draw your official signature clearly in the center of the canvas below.
                        </p>
                      </div>
                      <div className="border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-2xl bg-white dark:bg-gray-800 overflow-hidden shadow-sm relative group transition-all hover:border-blue-500">
                        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                        <SignatureCanvas 
                          ref={sigCanvasRef}
                          penColor="black"
                          backgroundColor="rgba(255,255,255,0.02)"
                          canvasProps={{ 
                            className: 'w-full min-h-[350px] cursor-crosshair z-10 relative',
                            style: { width: '100%', height: '350px' }
                          }} 
                        />
                        <div className="absolute bottom-4 right-4 pointer-events-none opacity-30 text-xs font-medium uppercase tracking-widest text-gray-500">Sign Here</div>
                      </div>
                      <div className="flex gap-3 justify-end items-center mt-2">
                        <span className="text-xs text-gray-400 mr-auto">Use your mouse, stylus, or finger to draw.</span>
                        <Button variant="outline" size="sm" onClick={clearSignature}>
                          Clear Canvas
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex flex-col items-center justify-center gap-3 text-gray-500 dark:text-gray-400"
                      >
                        <ImageIcon className="w-8 h-8" />
                        <span className="font-medium">
                          {signatureUrl && inputType === 'upload' ? 'Change Image' : 'Select PNG/JPG file'}
                        </span>
                        <span className="text-xs">Transparent PNG recommended</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                <Button 
                  variant="primary" 
                  onClick={handleSave} 
                  loading={isSaving}
                  icon={<Save className="w-4 h-4" />}
                >
                  Save Global Signature
                </Button>
              </div>
            </Card>
          </div>

          <div className="md:col-span-1">
            <Card className="p-6 sticky top-24">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-blue-500" />
                Live Preview
              </h3>
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 min-h-[160px] flex flex-col justify-end items-center text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-5 dark:opacity-[0.02] flex items-center justify-center pointer-events-none">
                  {/* Subtle watermark */}
                  <div className="transform -rotate-12 text-2xl font-black">EduX</div>
                </div>
                
                {signatureUrl ? (
                  <img 
                    src={signatureUrl} 
                    alt="Signature" 
                    className="h-16 object-contain mb-2 z-10"
                    style={{ filter: 'brightness(0) opacity(0.8)' }} // making it look a bit like ink
                  />
                ) : (
                  <div className="h-16 flex items-center justify-center italic text-gray-400 mb-2 z-10">
                    No signature
                  </div>
                )}
                <div className="w-3/4 border-t border-gray-400 dark:border-gray-600 my-2 z-10"></div>
                <p className="font-medium text-gray-900 dark:text-gray-100 text-sm z-10">{name || 'CEO Name'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 z-10">Platform Authority</p>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-800 dark:text-blue-300">
                <p><strong>Note:</strong> Saving will immediately affect all newly generated and verified certificates across the platform.</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
