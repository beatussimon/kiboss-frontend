import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Car, Activity, Users, TrendingUp, MapPin,
    Plus, ChevronRight, Loader2, BarChart3
} from 'lucide-react';
import api from '../../services/api';

interface FleetStats {
    vehicle_count: number;
    active_trips: number;
    completed_trips: number;
    total_passengers: number;
    driver_count: number;
}

interface Vehicle {
    id: string;
    name: string;
    properties: Record<string, any>;
    verification_status: string;
    average_rating: string;
    total_reviews: number;
}

interface Trip {
    id: string;
    route_name: string;
    origin: string;
    destination: string;
    departure_time: string;
    status: string;
    total_seats: number;
    seat_price: string;
}

export default function FleetCommand() {
    const [stats, setStats] = useState<FleetStats | null>(null);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [trips, setTrips] = useState<Trip[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [statsRes, vehiclesRes, tripsRes] = await Promise.all([
                api.get('/rides/fleet_stats/'),
                api.get('/assets/', { params: { owner: 'me', asset_type: 'VEHICLE' } }),
                api.get('/rides/', { params: { driver: 'me', ride_type: 'BUSINESS' } }),
            ]);
            setStats(statsRes.data);
            setVehicles(vehiclesRes.data.results || vehiclesRes.data);
            setTrips(tripsRes.data.results || tripsRes.data);
        } catch (error) {
            console.error('Failed to fetch fleet data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    const STATUS_COLORS: Record<string, string> = {
        SCHEDULED: 'bg-blue-100 text-blue-700',
        OPEN: 'bg-emerald-100 text-emerald-700',
        DEPARTED: 'bg-orange-100 text-orange-700',
        IN_TRANSIT: 'bg-purple-100 text-purple-700',
        COMPLETED: 'bg-gray-100 text-gray-600',
        CANCELLED: 'bg-red-100 text-red-700',
    };

    return (
        <div className="space-y-8">
            {/* Stats Grid */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                        { label: 'Fleet Size', value: stats.vehicle_count, icon: Car, color: 'from-blue-50 to-blue-100/50 text-blue-600 ring-blue-100/50' },
                        { label: 'Active Trips', value: stats.active_trips, icon: Activity, color: 'from-emerald-50 to-emerald-100/50 text-emerald-600 ring-emerald-100/50' },
                        { label: 'Completed', value: stats.completed_trips, icon: TrendingUp, color: 'from-purple-50 to-purple-100/50 text-purple-600 ring-purple-100/50' },
                        { label: 'Passengers', value: stats.total_passengers, icon: Users, color: 'from-orange-50 to-orange-100/50 text-orange-600 ring-orange-100/50' },
                        { label: 'Drivers', value: stats.driver_count, icon: Users, color: 'from-indigo-50 to-indigo-100/50 text-indigo-600 ring-indigo-100/50' },
                    ].map((stat, i) => (
                        <div key={i} className="card p-4 flex items-center gap-3 border-none shadow-md ring-1 ring-gray-200/50">
                            <div className={`h-10 w-10 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center ring-1`}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
                                <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Vehicle Registry */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                        <Car className="h-5 w-5 text-gray-400" /> Vehicle Registry
                    </h3>
                    <Link
                        to="/assets/create?type=VEHICLE&mode=business"
                        className="btn-primary px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-1.5"
                    >
                        <Plus className="h-4 w-4" /> Register Vehicle
                    </Link>
                </div>

                {vehicles.length === 0 ? (
                    <div className="card p-10 text-center border-dashed border-2 border-gray-200">
                        <Car className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">No vehicles registered yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {vehicles.map(vehicle => (
                            <Link
                                key={vehicle.id}
                                to={`/assets/${vehicle.id}`}
                                className="card p-4 hover:shadow-lg transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                        <Car className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-gray-900 truncate text-sm">{vehicle.name}</h4>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <span>{(vehicle.properties?.make as string) || 'N/A'} {(vehicle.properties?.model as string) || ''}</span>
                                            <span>•</span>
                                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${vehicle.verification_status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {vehicle.verification_status}
                                            </span>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Trip Dispatch */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-gray-400" /> Trip History
                    </h3>
                    <Link
                        to="/rides/create?mode=business"
                        className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20 flex items-center gap-1.5"
                    >
                        <Plus className="h-4 w-4" /> Create Trip
                    </Link>
                </div>

                {trips.length === 0 ? (
                    <div className="card p-10 text-center border-dashed border-2 border-gray-200">
                        <Activity className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">No trips created yet. Dispatch your first trip.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {trips.map(trip => (
                            <Link
                                key={trip.id}
                                to={`/rides/${trip.id}`}
                                className="card p-4 flex items-center gap-4 hover:shadow-lg transition-all group"
                            >
                                <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <MapPin className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-gray-900 text-sm truncate">{trip.route_name}</h4>
                                    <p className="text-xs text-gray-500 truncate">{trip.origin} → {trip.destination}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${STATUS_COLORS[trip.status] || 'bg-gray-100 text-gray-600'}`}>
                                        {trip.status}
                                    </span>
                                    <p className="text-[10px] text-gray-400 mt-1">
                                        {new Date(trip.departure_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
