import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';
import { Car, ShieldCheck, Clock, ShieldAlert, ChevronLeft, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { Asset } from '../../types';
import { getMediaUrl } from '../../utils/media';

export default function VehicleManagePage() {
    const { id } = useParams<{ id: string }>();
    const { user } = useSelector((state: RootState) => state.auth);
    const [vehicle, setVehicle] = useState<Asset | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchVehicle();
    }, [id]);

    const fetchVehicle = async () => {
        try {
            setIsLoading(true);
            const res = await api.get(`/assets/${id}/`);
            setVehicle(res.data);
        } catch (error) {
            toast.error('Failed to fetch vehicle details');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleListing = async (newIsListed: boolean) => {
        if (!vehicle) return;

        // Optimistic update
        const originalValue = vehicle.is_listed;
        setVehicle({ ...vehicle, is_listed: newIsListed });
        setIsSaving(true);

        try {
            await api.patch(`/assets/${id}/`, { is_listed: newIsListed });
            toast.success(newIsListed ? 'Vehicle now available for rent' : 'Vehicle hidden from rentals');
        } catch (error: any) {
            // Revert optimistic update
            setVehicle({ ...vehicle, is_listed: originalValue });
            toast.error(error.response?.data?.detail || 'Failed to update vehicle status');
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleActive = async (newIsActive: boolean) => {
        if (!vehicle) return;

        // Optimistic update
        const originalValue = vehicle.is_active;
        setVehicle({ ...vehicle, is_active: newIsActive });
        setIsSaving(true);

        try {
            await api.patch(`/assets/${id}/`, { is_active: newIsActive });
            toast.success(newIsActive ? 'Vehicle activated for rides' : 'Vehicle deactivated for rides');
        } catch (error: any) {
            // Revert optimistic update
            setVehicle({ ...vehicle, is_active: originalValue });
            toast.error(error.response?.data?.detail || 'Failed to update vehicle status');
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[40vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!vehicle) {
        return (
            <div className="max-w-4xl mx-auto py-10 text-center">
                <h1 className="text-2xl font-bold text-gray-900">Vehicle Not Found</h1>
                <Link to="/vehicles" className="text-primary-600 mt-4 inline-block hover:underline">
                    Return to My Vehicles
                </Link>
            </div>
        );
    }

    const isBusinessTier = user?.account_tier === 'BUSINESS';

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <div className="flex items-center gap-4">
                <Link to="/vehicles/my" className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                    <ChevronLeft className="h-5 w-5 text-gray-500" />
                </Link>
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Manage Vehicle</h1>
                    <p className="text-gray-500 text-sm font-medium mt-1">Configure rental and ride availability</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <div className="card p-4 ring-1 ring-gray-100 shadow-xl overflow-hidden rounded-3xl relative">
                        <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden mb-4 relative">
                            {vehicle.photos?.[0] ? (
                                <img src={getMediaUrl(vehicle.photos[0].url)} alt={vehicle.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                    <Car className="h-10 w-10 mb-2" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">No Photo</span>
                                </div>
                            )}
                        </div>

                        <div className="text-center">
                            <h2 className="text-xl font-black tracking-tight text-gray-900">{vehicle.name}</h2>
                            <p className="text-xs font-bold text-gray-500 tracking-widest uppercase mt-1">
                                {vehicle.properties?.make as string} {vehicle.properties?.model as string}
                            </p>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-50">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500 font-medium">Status</span>
                                <span className="font-bold flex items-center gap-1">
                                    {vehicle.verification_status === 'VERIFIED' && <><ShieldCheck className="h-4 w-4 text-green-500" /> Verified</>}
                                    {vehicle.verification_status === 'PENDING' && <><Clock className="h-4 w-4 text-orange-500" /> Pending</>}
                                    {vehicle.verification_status === 'REJECTED' && <><ShieldAlert className="h-4 w-4 text-red-500" /> Rejected</>}
                                    {vehicle.verification_status === 'UNVERIFIED' && <span className="text-gray-400">Unverified</span>}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <div className="card p-8 border-none ring-1 ring-gray-100 shadow-lg">
                        <h3 className="text-xl font-black tracking-tight mb-6">Availability Settings</h3>

                        <div className="space-y-6">
                            {/* Rides Toggle */}
                            <div className="flex items-start justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <div className="flex gap-4">
                                    <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                                        <Car className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">Available for Rides</h4>
                                        <p className="text-xs text-gray-500 mt-1 max-w-sm">
                                            When active, you can use this vehicle to offer scheduled trips and routes to passengers.
                                        </p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer disabled:opacity-50 mt-1">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={vehicle.is_active}
                                        onChange={(e) => handleToggleActive(e.target.checked)}
                                        disabled={isSaving || vehicle.verification_status !== 'VERIFIED'}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            {/* Rentals Toggle */}
                            <div className={`p-4 rounded-2xl border ${!isBusinessTier ? 'bg-orange-50 border-orange-100' : 'bg-gray-50 border-gray-100'}`}>
                                <div className="flex items-start justify-between">
                                    <div className="flex gap-4">
                                        <div className="h-10 w-10 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center shrink-0">
                                            <CreditCard className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className={`font-bold ${!isBusinessTier ? 'text-orange-900' : 'text-gray-900'}`}>
                                                Available for Rent
                                            </h4>
                                            <p className={`text-xs mt-1 max-w-sm ${!isBusinessTier ? 'text-orange-700' : 'text-gray-500'}`}>
                                                List this vehicle on the public marketplace for users to rent directly without a driver.
                                            </p>

                                            {!isBusinessTier && (
                                                <div className="mt-3 bg-white/60 p-3 rounded-lg border border-orange-200/50">
                                                    <p className="text-xs font-bold text-orange-800 flex items-center gap-1.5">
                                                        <ShieldCheck className="h-4 w-4" />
                                                        Business Plan Exclusive
                                                    </p>
                                                    <p className="text-xs text-orange-700 mt-1">
                                                        Upgrade to the Business Plan to unlock dual-use vehicle listings and fleet management.
                                                    </p>
                                                    <Link to="/upgrade" className="mt-2 inline-block text-[10px] font-black uppercase tracking-widest text-white bg-orange-600 px-3 py-1.5 rounded-lg hover:bg-orange-700 transition">
                                                        Upgrade Now
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <label className={`relative inline-flex items-center ${!isBusinessTier ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} mt-1`}>
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={vehicle.is_listed}
                                            onChange={(e) => handleToggleListing(e.target.checked)}
                                            disabled={isSaving || vehicle.verification_status !== 'VERIFIED' || !isBusinessTier}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {vehicle.verification_status !== 'VERIFIED' && (
                            <div className="mt-6 bg-yellow-50 text-yellow-800 p-4 rounded-xl text-sm font-medium border border-yellow-200">
                                You must verify this vehicle before it can be made available for rides or rentals.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
