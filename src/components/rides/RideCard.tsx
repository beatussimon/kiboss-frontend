import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Navigation, Clock, Eye } from 'lucide-react';
import { Price } from '../../context/CurrencyContext';
import { getMediaUrl } from '../../utils/media';

interface RideCardProps {
    ride: any;
    distance?: number | null;
    lastRideElementRef?: (node: HTMLAnchorElement | null) => void;
}

export default function RideCard({ ride, distance = null, lastRideElementRef }: RideCardProps) {
    return (
        <Link ref={lastRideElementRef} to={`/rides/${ride.id}`} className="group cursor-pointer">
            <div className="flex flex-col md:flex-row overflow-hidden h-full rounded-[2rem] border border-gray-100/80 shadow-sm hover:shadow-2xl transition-all duration-500 hover:border-primary-100 bg-white min-h-[300px]">
                {/* Image Half */}
                <div className="md:w-[45%] h-56 md:h-auto relative bg-gray-900 overflow-hidden shrink-0">
                    {/* Background Image Logic */}
                    {((ride as any).photos && (ride as any).photos.length > 0) ? (
                        <img
                            src={getMediaUrl((ride as any).photos[0].url)}
                            alt="Ride Cover"
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                    ) : ((ride as any).vehicle_asset?.photos && (ride as any).vehicle_asset.photos.length > 0) ? (
                        <img
                            src={getMediaUrl((ride as any).vehicle_asset.photos[0].url)}
                            alt="Vehicle Cover"
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                    ) : (
                        <img
                            src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=1000"
                            alt="Default Route Cover"
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/95 via-gray-900/40 to-black/20" />

                    {/* Time floating badge */}
                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl text-right border border-white/20 shadow-xl">
                        <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest leading-tight mb-0.5">Departure</p>
                        <p className="text-sm font-black text-white leading-none">{new Date(ride.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>

                    {/* Route overlay badge */}
                    <div className="absolute bottom-5 left-5 right-5 z-10">
                        <div className="flex flex-col gap-3 relative before:absolute before:left-3 before:top-3 before:bottom-3 before:w-px before:bg-gradient-to-b before:from-primary-500 before:to-gray-400">
                            <div className="flex items-center gap-4 relative">
                                <div className="w-6 h-6 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 shadow-lg">
                                    <div className="w-2 h-2 rounded-full bg-primary-500 shadow-[0_0_8px_rgba(37,99,235,0.8)]" />
                                </div>
                                <span className="text-sm font-bold truncate text-white drop-shadow-md">{ride.origin.split(',')[0]}</span>
                            </div>
                            <div className="flex items-center gap-4 relative">
                                <div className="w-6 h-6 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 shadow-lg">
                                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                                </div>
                                <span className="text-sm font-bold truncate text-gray-200 drop-shadow-md">{ride.destination.split(',')[0]}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Half */}
                <div className="md:w-[55%] p-6 flex flex-col justify-between bg-white relative">

                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2 pr-4 leading-tight tracking-tight">
                            {ride.route_name}
                        </h3>
                        <div className="text-right shrink-0 bg-primary-50/50 px-4 py-2 rounded-2xl border border-primary-100/50">
                            <p className="text-xl font-black text-primary-600 leading-none tracking-tight"><Price amount={ride.seat_price} /></p>
                            <p className="text-[9px] font-extrabold text-primary-900/40 tracking-[0.2em] uppercase mt-1">Per Seat</p>
                        </div>
                    </div>

                    {/* Driver profile */}
                    <div className="flex items-center gap-3 mt-2 mb-6 group/driver cursor-pointer" onClick={(e) => {
                        // Stop propagation if we want the link on the parent to not trigger, 
                        // but here the parent is a Link to the ride, so if they click driver, we might want to navigate to user profile.
                        // For now we just stop propagation and programmatically navigate or let outer link handle it.
                        // Actually, letting it go to the Ride Detail page is fine, which then has the real driver link.
                    }}>
                        <div className="relative">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center text-xs font-black text-primary-700 shrink-0 border-2 border-white shadow-sm ring-1 ring-gray-100 overflow-hidden">
                                {(ride as any).driver?.profile?.avatar ? (
                                    <img
                                        src={getMediaUrl((ride as any).driver.profile.avatar)}
                                        alt="Avatar"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (ride as any).driver?.corporate_profile?.verification_status === 'VERIFIED' ? (
                                    (ride as any).driver?.corporate_profile?.company_name?.[0]
                                ) : (
                                    `${(ride as any).driver?.first_name?.[0] || ''}${(ride as any).driver?.last_name?.[0] || ''}`
                                )}
                            </div>
                            {/* little verified badge could go here */}
                        </div>
                        <div className="flex flex-col">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">
                                {(ride as any).driver?.corporate_profile?.verification_status === 'VERIFIED' ? 'Transport Provider' : 'Driver'}
                            </p>
                            <span className="text-sm font-bold text-gray-900 group-hover/driver:text-primary-600 transition-colors leading-none truncate max-w-[150px]">
                                {(ride as any).driver?.corporate_profile?.verification_status === 'VERIFIED'
                                    ? (ride as any).driver?.corporate_profile?.company_name
                                    : `${(ride as any).driver?.first_name} ${(ride as any).driver?.last_name}`}
                            </span>
                        </div>
                    </div>

                    <div className="mt-auto space-y-4">
                        <div className="flex flex-wrap gap-2">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-100/50 text-xs font-bold text-gray-700">
                                <Users className="h-3.5 w-3.5 text-primary-500" />
                                {ride.available_seats} {ride.available_seats === 1 ? 'Seat' : 'Seats'}
                            </div>

                            {distance !== null ? (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-100/50 text-xs font-bold text-gray-700">
                                    <Navigation className="h-3.5 w-3.5 text-green-500" />
                                    {distance.toFixed(1)} km away
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-100/50 text-xs font-bold text-gray-700">
                                    <Clock className="h-3.5 w-3.5 text-blue-500" />
                                    {new Date(ride.departure_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-100/60">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary-600/60">
                                <Eye className="h-3 w-3" /> Trending Route
                            </div>
                            {/* Fake button for visual affordance */}
                            <div className="text-[11px] font-black text-white bg-gray-900 px-4 py-2 rounded-xl group-hover:bg-primary-600 transition-colors shadow-sm">
                                View Journey
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </Link>
    );
}
