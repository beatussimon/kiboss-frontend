import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../app/store';
import { fetchMyDrives } from '../../features/rides/ridesSlice';
import {
  Car, Shield, ShieldAlert, ShieldCheck, Clock,
  Plus, AlertCircle, ChevronRight, FileText, Trash2,
  Calendar, Users, MapPin, Star, Edit, List, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { Asset } from '../../types';
import { getMediaUrl } from '../../utils/media';
import { Price } from '../../context/CurrencyContext';

export default function MyVehiclesPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { myDrives: rides } = useSelector((state: RootState) => state.rides);
  const [vehicles, setVehicles] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchVehicles();
    dispatch(fetchMyDrives({}));
  }, [dispatch]);

  const fetchVehicles = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/assets/', { params: { asset_type: 'VEHICLE', owner: 'me', is_active: 'any', context: 'personal' } });
      const allAssets = res.data.results || res.data;
      setVehicles(allAssets);
    } catch (error) {
      console.error('Failed to fetch vehicles:', error);
      toast.error('Unable to load your vehicles');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitVerification = async (vehicleId: string) => {
    try {
      await api.post(`/rides/vehicles/${vehicleId}/submit_verification/`);
      toast.success('Verification request submitted!');
      fetchVehicles();
    } catch (error: any) {
      console.error('Failed to submit verification:', error);

      let message = 'Failed to submit verification request';
      if (error.response?.data) {
        const data = error.response.data;
        if (typeof data.error === 'string') {
          message = data.error;
        } else if (typeof data.detail === 'string') {
          message = data.detail;
        } else if (typeof data === 'object') {
          const firstKey = Object.keys(data)[0];
          const firstVal = data[firstKey];
          message = Array.isArray(firstVal) ? `${firstKey}: ${firstVal[0]}` : `${firstKey}: ${firstVal}`;
        }
      }

      toast.error(message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-full text-[10px] font-black  tracking-widest border border-green-100">
            <ShieldCheck className="h-3 w-3" /> Verified
          </span>
        );
      case 'PENDING':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-700 rounded-full text-[10px] font-black  tracking-widest border border-orange-100">
            <Clock className="h-3 w-3" /> Pending
          </span>
        );
      case 'REJECTED':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded-full text-[10px] font-black  tracking-widest border border-red-100">
            <ShieldAlert className="h-3 w-3" /> Rejected
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-gray-50 text-gray-700 rounded-full text-[10px] font-black  tracking-widest border border-gray-100 dark:border-gray-800">
            <Shield className="h-3 w-3" /> Unverified
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link to="/profile" className="text-primary-600 hover:text-primary-700 mb-6 inline-flex items-center gap-2 font-bold transition-colors">
        ← Back to Profile
      </Link>
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter ">My Vehicles</h1>
          <p className="text-gray-500 font-medium">Manage your registered vehicles and their verification status.</p>
        </div>
        <Link to="/vehicles/register" className="btn-primary flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Register New Vehicle
        </Link>
      </div>

      {!vehicles || vehicles.length === 0 ? (
        <div className="card p-16 text-center bg-gray-50 dark:bg-gray-900 border-dashed">
          {/* ... existing empty state ... */}
          <div className="h-24 w-24 bg-white dark:bg-gray-800 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <Car className="h-12 w-12 text-gray-300" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight ">No vehicles registered</h2>
          <p className="text-gray-500 max-w-sm mx-auto font-medium mb-8">
            You haven't registered any vehicles yet. Register a vehicle to start offering rides on KIBOSS.
          </p>
          <Link to="/vehicles/register" className="btn-primary px-8">
            Register your first vehicle
          </Link>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Active Trip Management Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-600 rounded-xl shadow-lg shadow-primary-200">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight ">Active Trip Management</h2>
              </div>
              <Link to="/rides/create" className="text-xs font-black text-primary-600 hover:text-primary-700 flex items-center gap-1  tracking-widest bg-primary-50 px-4 py-2 rounded-xl border border-primary-100 transition-all">
                <Plus className="h-4 w-4" /> Create New Trip
              </Link>
            </div>

            {rides.length === 0 ? (
              <div className="card p-10 text-center bg-white dark:bg-gray-800 border-2 border-dashed border-gray-100 rounded-[2.5rem]">
                <p className="text-sm font-bold text-gray-400  tracking-widest">No trips scheduled</p>
                <p className="text-xs text-gray-400 mt-1">Start by offering a ride with one of your verified vehicles.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {rides.map((ride) => (
                  <div key={ride.id} className="card p-6 bg-white hover:shadow-2xl transition-all group border-none ring-1 ring-gray-100">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-gray-900 text-white rounded-xl flex items-center justify-center">
                          <Car className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-gray-900 dark:text-white leading-tight">{ride.route_name}</h3>
                          <p className="text-[10px] font-black text-primary-600  tracking-widest">{new Date(ride.departure_time).toLocaleDateString()} · {new Date(ride.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                      <span className={`text-[8px] font-black  tracking-[0.2em] px-2 py-1 rounded-md ${ride.status === 'OPEN' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-600'
                        }`}>
                        {ride.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mb-6 p-3 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                      <div className="flex-1">
                        <p className="text-[8px] font-black text-gray-400  tracking-widest mb-1">Origin</p>
                        <p className="text-xs font-bold text-gray-700 truncate">{ride.origin}</p>
                      </div>
                      <ArrowRight className="h-3 w-3 text-gray-300" />
                      <div className="flex-1 text-right">
                        <p className="text-[8px] font-black text-gray-400  tracking-widest mb-1">Destination</p>
                        <p className="text-xs font-bold text-gray-700 truncate">{ride.destination}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-[8px] font-black text-gray-400  tracking-widest">Booked</p>
                          <p className="text-sm font-black text-gray-900 dark:text-white">{ride.total_seats - ride.available_seats} / {ride.total_seats}</p>
                        </div>
                        <div className="h-8 w-px bg-gray-100 dark:bg-gray-800" />
                        <div>
                          <p className="text-[8px] font-black text-gray-400  tracking-widest">Revenue</p>
                          <p className="text-sm font-black text-emerald-600"><Price amount={ride.seat_price * (ride.total_seats - ride.available_seats)} /></p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link to={`/rides/${ride.id}/manifest`} className="p-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-900 hover:text-white transition-all shadow-sm" title="Passenger Manifest">
                          <Users className="h-4 w-4" />
                        </Link>
                        <Link to={`/rides/${ride.id}/edit`} className="p-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-900 hover:text-white transition-all shadow-sm" title="Edit Trip">
                          <Edit className="h-4 w-4" />
                        </Link>
                        <Link to={`/rides/${ride.id}`} className="p-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-200" title="View Details">
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="h-px bg-gray-100 dark:bg-gray-800" />

          {/* Vehicles Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight  flex items-center gap-3">
              <div className="p-2 bg-gray-900 rounded-xl">
                <Car className="h-5 w-5 text-white" />
              </div>
              Registered Fleet
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {vehicles.map((vehicle) => (
                <div key={vehicle.id} className="card p-0 overflow-hidden group hover:shadow-2xl transition-all border-none ring-1 ring-gray-100 relative">
                  <div className={`flex h-full ${vehicle.verification_status === 'PENDING' ? 'opacity-40 blur-[2px] grayscale-[50%]' : ''}`}>
                    <div className="w-32 h-auto bg-gray-100 relative overflow-hidden shrink-0">
                      {vehicle.photos?.[0] ? (
                        <img src={getMediaUrl(vehicle.photos[0].url)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Car className="h-8 w-8 text-gray-300" />
                        </div>
                      )}
                      <div className="absolute top-2 left-2">
                        {getStatusBadge(vehicle.verification_status)}
                      </div>
                    </div>
                    <div className="flex-1 p-6">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-xl font-black text-gray-900 group-hover:text-primary-600 transition-colors  tracking-tight">
                            {vehicle.name}
                          </h3>
                          <p className="text-xs font-bold text-gray-400  tracking-widest">
                            {vehicle.properties?.make as string} {vehicle.properties?.model as string} • {vehicle.properties?.year as string}
                          </p>
                        </div>
                        <Link to={`/vehicles/${vehicle.id}/manage`} className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-primary-600 hover:text-white transition-colors" title="Manage Vehicle">
                          <Edit className="h-4 w-4" />
                        </Link>
                      </div>

                      <div className="mt-4 flex items-center gap-4">
                        <div className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-[10px] font-black text-gray-600 ">
                          {vehicle.properties?.license_plate as string}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 ">
                          <FileText className="h-3 w-3" /> {vehicle.total_bookings} Rides
                        </div>
                      </div>

                      {vehicle.verification_status !== 'VERIFIED' && (
                        <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
                          <div>
                            <p className="text-[10px] font-bold text-orange-600  flex items-center gap-1 mb-1">
                              <AlertCircle className="h-3 w-3" /> Verification required
                            </p>
                            {vehicle.verification_notes && (
                              <p className="text-[8px] text-gray-500 italic truncate max-w-[150px]">
                                "{vehicle.verification_notes}"
                              </p>
                            )}
                          </div>

                          {(vehicle.verification_status === 'UNVERIFIED' || vehicle.verification_status === 'REJECTED') && (
                            <button
                              onClick={() => handleSubmitVerification(vehicle.id)}
                              className="px-3 py-1.5 bg-primary-600 text-white text-[10px] font-black  tracking-widest rounded-lg hover:bg-primary-700 transition-colors shadow-lg shadow-primary-200 cursor-pointer"
                            >
                              Verify Now
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {vehicle.verification_status === 'PENDING' && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none bg-white/10">
                      <div className="bg-orange-600 text-white px-6 py-2 rounded-2xl font-black tracking-widest text-lg shadow-2xl uppercase transform -rotate-6 border border-orange-500">
                        Pending Review
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Safety Notice */}
      <div className="mt-12 p-8 bg-primary-900 rounded-[2rem] text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl -mr-48 -mt-48" />
        <div className="relative flex flex-col md:flex-row items-center gap-8">
          <div className="h-20 w-20 bg-primary-800 rounded-3xl flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="h-10 w-10 text-primary-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight  mb-2">Safe & Trusted Rides</h2>
            <p className="text-primary-200 font-medium max-w-2xl">
              Every vehicle on KIBOSS must undergo a manual verification process. This includes checking registration documents,
              insurance validity, and safety inspections to ensure the best experience for our community.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
