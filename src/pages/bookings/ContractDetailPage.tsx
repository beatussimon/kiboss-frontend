import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../app/store';
import { fetchContract, acceptContract, clearCurrentContract } from '../../features/contracts/contractsSlice';
import { FileText, ArrowLeft, Shield, CheckCircle, Clock, Info, User, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { currentContract: contract, isLoading, error } = useSelector((state: RootState) => state.contracts);
  const { user } = useSelector((state: RootState) => state.auth);
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchContract(id));
    }
    return () => {
      dispatch(clearCurrentContract());
    };
  }, [dispatch, id]);

  const handleAccept = async () => {
    if (!id) return;
    
    if (!window.confirm('By accepting, you agree to the terms and conditions of this contract.')) {
      return;
    }

    setIsAccepting(true);
    try {
      // Simple mock signature info
      const signature = {
        signed_at: new Date().toISOString(),
        ip_address: '127.0.0.1',
        user_agent: navigator.userAgent
      };
      
      await dispatch(acceptContract({ id, signature })).unwrap();
      toast.success('Contract accepted successfully');
    } catch (err: any) {
      toast.error(err || 'Failed to accept contract');
    } finally {
      setIsAccepting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p className="mt-4 text-gray-500">Loading legal document...</p>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="card p-8 text-center max-w-2xl mx-auto mt-8">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Contract Not Found</h2>
        <p className="text-gray-500 mb-6">{error || 'This contract does not exist or you do not have permission to view it.'}</p>
        <Link to="/bookings" className="btn-primary inline-flex items-center">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Bookings
        </Link>
      </div>
    );
  }

  const isRenter = true; // Placeholder: In a real app we'd check if user is the renter in the booking
  // Since participants info might be nested, let's assume we can check via user.id
  
  const canAccept = contract.status !== 'EXECUTED';
  const alreadySignedByMe = false; // Simplified for now as we don't have user_id in SignatureInfo

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-6 flex items-center justify-between">
        <Link to={`/bookings/${contract.booking}`} className="text-primary-600 hover:text-primary-700 flex items-center font-medium">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Booking
        </Link>
        <div className="flex gap-2">
          <span className={`badge ${contract.status === 'EXECUTED' ? 'badge-success' : 'badge-info'}`}>
            {contract.status}
          </span>
          <span className="badge-secondary">v{contract.version}</span>
        </div>
      </div>

      <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
        {/* Header Section */}
        <div className="bg-gray-900 text-white p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-primary-600 p-2 rounded-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Rental & Sharing Agreement</h1>
          </div>
          <div className="grid grid-cols-2 gap-8 mt-8 opacity-80 text-sm">
            <div>
              <p className="text-gray-400 uppercase text-xs font-bold tracking-widest mb-1">Contract ID</p>
              <p className="font-mono">{contract.id}</p>
            </div>
            <div>
              <p className="text-gray-400 uppercase text-xs font-bold tracking-widest mb-1">Generated On</p>
              <p>{new Date(contract.generated_at).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-8 md:p-12 space-y-10">
          {/* Parties */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 uppercase tracking-wide">1. The Parties</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Owner / Provider</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-gray-200">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Resource Owner</p>
                    <p className="text-xs text-gray-500">Verified Platform User</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Renter / User</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-gray-200">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Platform Renter</p>
                    <p className="text-xs text-gray-500">Verified Identity</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Core Terms */}
          <section className="prose prose-sm max-w-none text-gray-600">
            <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 uppercase tracking-wide">2. Standard Terms</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <Shield className="h-5 w-5 text-primary-600 flex-shrink-0" />
                <div>
                  <p className="font-bold text-gray-900">Liability & Insurance</p>
                  <p>The Renter agrees to assume all responsibility for the item/service during the rental period. KIBOSS provides an escrow-based protection but does not replace professional insurance.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <Info className="h-5 w-5 text-primary-600 flex-shrink-0" />
                <div>
                  <p className="font-bold text-gray-900">Usage Policies</p>
                  <p>The Renter must adhere to the specific usage rules defined by the Owner. This includes cancellation policies ({contract.cancellation_policy}), damage policies ({contract.damage_policy}), and late return penalties ({contract.late_return_policy}).</p>
                </div>
              </div>
            </div>
          </section>

          {/* Snapshot Data (Simulated for Now) */}
          <section className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
            <h2 className="text-sm font-bold text-blue-900 mb-4 uppercase tracking-wider flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Contract Snapshot
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-3 rounded-lg shadow-sm border border-blue-100">
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Jurisdiction</p>
                <p className="text-xs font-bold text-blue-900">{contract.jurisdiction}</p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm border border-blue-100">
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Agreement Type</p>
                <p className="text-xs font-bold text-blue-900">Peer-to-Peer Rental</p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm border border-blue-100">
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Status</p>
                <p className="text-xs font-bold text-blue-900">{contract.status}</p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm border border-blue-100">
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Digital Trace</p>
                <p className="text-[10px] font-mono font-bold text-blue-900">HASH_{contract.id.substring(0, 8)}</p>
              </div>
            </div>
          </section>

          {/* Signatures */}
          <section className="pt-8 mt-8 border-t border-gray-100">
            <div className="grid md:grid-cols-2 gap-12">
              <div className="space-y-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  Owner Signature
                  {contract.owner_signature && <CheckCircle className="h-4 w-4 text-green-500" />}
                </h3>
                <div className="h-24 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center italic text-gray-400">
                  {contract.owner_signature ? (
                    <div className="text-center">
                      <p className="text-gray-900 font-signature text-xl">Electronically Signed</p>
                      <p className="text-[10px] font-mono mt-1">{new Date(contract.owner_signature.signed_at).toLocaleString()}</p>
                    </div>
                  ) : (
                    "Awaiting Owner Signature"
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  Renter Signature
                  {contract.renter_signature && <CheckCircle className="h-4 w-4 text-green-500" />}
                </h3>
                <div className="h-24 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center italic text-gray-400">
                  {contract.renter_signature ? (
                    <div className="text-center">
                      <p className="text-gray-900 font-signature text-xl">Electronically Signed</p>
                      <p className="text-[10px] font-mono mt-1">{new Date(contract.renter_signature.signed_at).toLocaleString()}</p>
                    </div>
                  ) : (
                    "Awaiting Your Signature"
                  )}
                </div>
              </div>
            </div>

            {/* Accept Button */}
            {contract.status !== 'EXECUTED' && (
              <div className="mt-12 text-center">
                <button
                  onClick={handleAccept}
                  disabled={isAccepting}
                  className="btn-primary px-12 py-3 rounded-full text-lg font-bold shadow-lg hover:shadow-xl transition-all"
                >
                  {isAccepting ? (
                    <span className="flex items-center">
                      <Clock className="animate-spin h-5 w-5 mr-2" />
                      Processing Acceptance...
                    </span>
                  ) : (
                    "Accept Agreement & Execute Contract"
                  )}
                </button>
                <p className="text-xs text-gray-400 mt-4">
                  By clicking accept, you provide your digital signature and agree to be legally bound by this agreement.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
