import { useEffect, useState } from 'react';
import { Users, Plus, X, UserCheck, UserX, Shield, Mail, Briefcase, Car, HeadphonesIcon } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface Worker {
    id: string;
    email: string;
    name: string;
    role: string;
    role_display: string;
    status: string;
    status_display: string;
    user: string | null;
    user_name: string;
    invited_at: string;
    accepted_at: string | null;
    deactivated_at: string | null;
    created_at: string;
}

const ROLE_OPTIONS = [
    { value: 'DRIVER', label: 'Driver', icon: Car, color: 'text-blue-600 bg-blue-50' },
    { value: 'ACCOUNTANT', label: 'Accountant', icon: Briefcase, color: 'text-emerald-600 bg-emerald-50' },
    { value: 'MANAGER', label: 'Manager', icon: Shield, color: 'text-purple-600 bg-purple-50' },
    { value: 'SUPPORT', label: 'Support', icon: HeadphonesIcon, color: 'text-orange-600 bg-orange-50' },
];

export default function WorkerManagement() {
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [inviteData, setInviteData] = useState({ email: '', name: '', role: 'DRIVER' });

    useEffect(() => {
        fetchWorkers();
    }, []);

    const fetchWorkers = async () => {
        try {
            setIsLoading(true);
            const res = await api.get('/users/corporate/workers/');
            setWorkers(res.data);
        } catch (error) {
            console.error('Failed to fetch workers:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/users/corporate/workers/', inviteData);
            toast.success(`Worker invited: ${inviteData.email}`);
            setInviteData({ email: '', name: '', role: 'DRIVER' });
            setIsInviteOpen(false);
            fetchWorkers();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to invite worker');
        }
    };

    const handleUpdateRole = async (workerId: string, newRole: string) => {
        try {
            await api.patch('/users/corporate/workers/', { worker_id: workerId, role: newRole });
            toast.success('Role updated');
            fetchWorkers();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to update role');
        }
    };

    const handleToggleStatus = async (workerId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'ACTIVE' ? 'DEACTIVATED' : 'ACTIVE';
        try {
            await api.patch('/users/corporate/workers/', { worker_id: workerId, status: newStatus });
            toast.success(newStatus === 'ACTIVE' ? 'Worker reactivated' : 'Worker deactivated');
            fetchWorkers();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to update status');
        }
    };

    const handleRemove = async (workerId: string) => {
        if (!window.confirm('Remove this worker permanently?')) return;
        try {
            await api.delete(`/users/corporate/workers/?worker_id=${workerId}`);
            toast.success('Worker removed');
            fetchWorkers();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to remove worker');
        }
    };

    const getRoleConfig = (role: string) => ROLE_OPTIONS.find(r => r.value === role) || ROLE_OPTIONS[0];

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="card p-6 animate-pulse">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-gray-200 rounded-xl" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-1/3" />
                                <div className="h-3 bg-gray-200 rounded w-1/4" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                        <Users className="h-5 w-5 text-gray-400" />
                        Team Management
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">{workers.length} team members</p>
                </div>
                <button
                    onClick={() => setIsInviteOpen(true)}
                    className="btn-primary px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2"
                >
                    <Plus className="h-4 w-4" />
                    Invite Worker
                </button>
            </div>

            {/* Invite Modal */}
            {isInviteOpen && (
                <div className="card p-6 border-2 border-primary-200 bg-primary-50/30 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-gray-900">Invite New Team Member</h3>
                        <button onClick={() => setIsInviteOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    <form onSubmit={handleInvite} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <input
                            type="email"
                            placeholder="Email address"
                            value={inviteData.email}
                            onChange={e => setInviteData(prev => ({ ...prev, email: e.target.value }))}
                            className="input"
                            required
                        />
                        <input
                            type="text"
                            placeholder="Display name (optional)"
                            value={inviteData.name}
                            onChange={e => setInviteData(prev => ({ ...prev, name: e.target.value }))}
                            className="input"
                        />
                        <select
                            value={inviteData.role}
                            onChange={e => setInviteData(prev => ({ ...prev, role: e.target.value }))}
                            className="input"
                        >
                            {ROLE_OPTIONS.map(r => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                        </select>
                        <button type="submit" className="btn-primary px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest">
                            <Mail className="h-4 w-4 mr-1 inline" /> Send Invite
                        </button>
                    </form>
                </div>
            )}

            {/* Worker List */}
            {workers.length === 0 ? (
                <div className="card p-12 text-center border-dashed border-2 border-gray-200">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 mb-2">No team members yet</h3>
                    <p className="text-gray-500 text-sm">Invite your first team member to start building your workforce.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {workers.map(worker => {
                        const roleConfig = getRoleConfig(worker.role);
                        const RoleIcon = roleConfig.icon;
                        const isDeactivated = worker.status === 'DEACTIVATED';

                        return (
                            <div
                                key={worker.id}
                                className={`card p-4 flex items-center gap-4 transition-all ${isDeactivated ? 'opacity-50' : 'hover:shadow-lg'}`}
                            >
                                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${roleConfig.color}`}>
                                    <RoleIcon className="h-6 w-6" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-gray-900 truncate">{worker.user_name}</h4>
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${worker.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                                                worker.status === 'INVITED' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-gray-100 text-gray-500'
                                            }`}>
                                            {worker.status_display}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 truncate">{worker.email} • {worker.role_display}</p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <select
                                        value={worker.role}
                                        onChange={e => handleUpdateRole(worker.id, e.target.value)}
                                        className="input text-xs py-1 px-2 w-32"
                                    >
                                        {ROLE_OPTIONS.map(r => (
                                            <option key={r.value} value={r.value}>{r.label}</option>
                                        ))}
                                    </select>

                                    <button
                                        onClick={() => handleToggleStatus(worker.id, worker.status)}
                                        className={`p-2 rounded-lg text-xs ${isDeactivated
                                                ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                                : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                                            }`}
                                        title={isDeactivated ? 'Reactivate' : 'Deactivate'}
                                    >
                                        {isDeactivated ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                                    </button>

                                    <button
                                        onClick={() => handleRemove(worker.id)}
                                        className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                                        title="Remove permanently"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
