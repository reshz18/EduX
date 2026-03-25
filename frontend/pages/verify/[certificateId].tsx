import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { CheckCircle, XCircle, Award, Calendar, BookOpen, User as UserIcon, ShieldCheck } from 'lucide-react';
import { apiCall } from '@/utils/api';

interface CertificateData {
  id: string;
  studentName: string;
  courseName: string;
  instructor: string;
  completionDate: string;
  issuedDate: string;
}

export default function VerifyCertificate() {
  const router = useRouter();
  const { certificateId } = router.query;
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CertificateData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!certificateId) return;
    
    const verify = async () => {
      try {
        const response: any = await apiCall('GET', `/certificates/verify/${certificateId}`);
        if (response.isValid) {
          setData(response.certificate);
        } else {
          setError(true);
        }
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    
    verify();
  }, [certificateId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-500 font-medium animate-pulse">Verifying Certificate...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <Head>
        <title>Verify Certificate | EduX</title>
      </Head>

      <div className="w-full max-w-2xl text-center mb-8">
        <div className="flex justify-center items-center gap-2 mb-4">
          <Award className="w-10 h-10 text-blue-600" />
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">EduX</h1>
        </div>
        <h2 className="text-xl font-medium text-gray-600">Credential Verification Portal</h2>
      </div>

      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        {!error && data ? (
          <div>
            <div className="bg-green-50 px-8 py-6 border-b border-green-100 flex items-center gap-4">
              <div className="bg-green-500 rounded-full p-2 text-white">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-green-800">Valid Certificate</h3>
                <p className="text-green-600">This certificate is authentic and verifiable.</p>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div className="text-center pb-6 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Presented to</p>
                <p className="text-3xl font-bold text-gray-900">{data.studentName}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="flex gap-3">
                  <BookOpen className="w-5 h-5 text-blue-500 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Course</p>
                    <p className="font-semibold text-gray-900 leading-tight">{data.courseName}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <UserIcon className="w-5 h-5 text-blue-500 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Instructor</p>
                    <p className="font-semibold text-gray-900">{data.instructor}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Calendar className="w-5 h-5 text-blue-500 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Completed On</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(data.completionDate).toLocaleDateString(undefined, {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <ShieldCheck className="w-5 h-5 text-blue-500 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Certificate ID</p>
                    <p className="font-mono font-medium text-gray-900 break-all">{data.id}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-8 py-4 text-center border-t border-gray-100 text-sm text-gray-500">
              Verified on {new Date().toLocaleString()} by EduX Security
            </div>
          </div>
        ) : (
          <div className="px-8 py-12 text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Certificate Not Found</h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              We couldn't verify this certificate. It may be invalid, expired, or the ID is incorrect.
            </p>
            <div className="mt-8 p-4 bg-gray-50 rounded-lg inline-block border border-gray-200">
              <p className="text-xs text-gray-500 font-mono">Attempted ID: {certificateId}</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 text-center text-sm text-gray-400">
        <p>&copy; {new Date().getFullYear()} EduX E-Learning Platform. All rights reserved.</p>
      </div>
    </div>
  );
}
