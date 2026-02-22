import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';
import {
  CheckCircle, XCircle, Clock, Search, Eye, Filter,
  Car, Shield, FileText, User, ChevronRight, AlertCircle,
  MessageSquare, ExternalLink, ThumbsUp, ThumbsDown, RotateCcw,
  UserPlus, Trash2, Tag, Flag, BarChart3, PieChart, Activity, TrendingUp,
  DollarSign, Briefcase, Calendar, Layers, Save, ArrowLeft, CreditCard
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart as RePieChart, Pie
} from 'recharts';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { getMediaUrl } from '../../utils/media';
import { Price } from '../../context/CurrencyContext';

export default function TaskDashboard() {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const userRoles = user?.roles?.map(r => r.role) || [];
  const isSuperRole = user?.is_superuser || userRoles.includes('SUPER_ADMIN');

  const getRoleConfig = () => {
    if (isSuperRole) return { title: 'Internal Task Dashboard', subtitle: 'Admin Mode', icon: <Shield className="h-6 w-6" />, label: 'Super Admin' };

    if (userRoles.includes('VERIFIER')) return { title: 'Verification Workspace', subtitle: 'Identity & Vehicle Review', icon: <CheckCircle className="h-6 w-6" />, label: 'Verifier' };
    if (userRoles.includes('CAR_VERIFIER')) return { title: 'Fleet Verification', subtitle: 'Vehicle & Asset Review', icon: <Car className="h-6 w-6" />, label: 'Car Verifier' };
    if (userRoles.includes('BUSINESS_VERIFIER')) return { title: 'Business Verification', subtitle: 'Corporate & Entity Review', icon: <Briefcase className="h-6 w-6" />, label: 'Business Verifier' };
    if (userRoles.includes('SUPPORT')) return { title: 'Support & Resolution Hub', subtitle: 'Ticket & Dispute Management', icon: <MessageSquare className="h-6 w-6" />, label: 'Support' };
    if (userRoles.includes('OPS')) return { title: 'Operations Dashboard', subtitle: 'Fleet & Audit Management', icon: <Activity className="h-6 w-6" />, label: 'Operations' };
    if (userRoles.includes('LEGAL')) return { title: 'Legal & Dispute Review', subtitle: 'Compliance & Resolution', icon: <Shield className="h-6 w-6" />, label: 'Legal' };

    return { title: 'Staff Workspace', subtitle: 'Operational Queue', icon: <Clock className="h-6 w-6" />, label: 'Staff' };
  };

  const roleConfig = getRoleConfig();
  const permissions = user?.permissions || [];

  const [activeTab, setActiveTab] = useState<string>('tasks');
  const [tasks, setTasks] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [processNotes, setProcessNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [staffUsers, setStaffUsers] = useState<any[]>([]);

  // Assignment state
  const [assignTo, setAssignTo] = useState('');
  const [assignRole, setAssignRole] = useState('');
  const [assignPriority, setAssignPriority] = useState('');

  // Dynamic Tabs based on roles/permissions
  const getTabs = () => {
    const tabs = [{ id: 'tasks', label: 'Operational Queue', icon: <Clock className="h-4 w-4" /> }];

    if (isSuperRole) {
      tabs.push({ id: 'analytics', label: 'Global Analytics', icon: <BarChart3 className="h-4 w-4" /> });
    }

    if (userRoles.includes('SUPPORT') || permissions.includes('DISPUTE_RESOLVE')) {
      tabs.push({ id: 'support', label: 'Support Center', icon: <MessageSquare className="h-4 w-4" /> });
    }

    return tabs;
  };

  const dashboardTabs = getTabs();

  useEffect(() => {
    fetchData();
    if (isSuperRole) {
      fetchStaffUsers();
      fetchAnalytics();
    }
  }, [isSuperRole, activeTab]);

  const fetchData = async (tab?: string) => {
    try {
      setIsLoading(true);
      const currentTab = tab || activeTab;

      let url = '/tasks/';
      if (currentTab === 'support') url = '/tasks/?task_type=SUPPORT_TICKET,DISPUTE_RESOLUTION';

      const [tasksRes, summaryRes] = await Promise.all([
        api.get(url),
        api.get('/tasks/dashboard_summary/')
      ]);
      setTasks(tasksRes.data.results || tasksRes.data);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Unable to load staff dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    fetchData(tabId);
  };

  const fetchStaffUsers = async () => {
    try {
      const res = await api.get('/tasks/staff_users/');
      setStaffUsers(res.data);
    } catch (error) {
      console.error('Failed to fetch staff users:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/tasks/super_analytics/');
      setAnalytics(res.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  const handleProcessTask = async (action: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES' | 'REVOKE') => {
    if (!selectedTask) return;

    setIsProcessing(true);
    try {
      await api.post(`/tasks/${selectedTask.id}/process/`, {
        action,
        notes: processNotes
      });
      toast.success(`Task ${action.toLowerCase()} successfully`);
      setSelectedTask(null);
      setIsReviewMode(false);
      setProcessNotes('');
      fetchData();
    } catch (error) {
      console.error('Processing failed:', error);
      toast.error('Failed to process task');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAssignTask = async () => {
    if (!selectedTask) return;

    setIsProcessing(true);
    try {
      await api.post(`/tasks/${selectedTask.id}/assign/`, {
        assigned_to: assignTo || null,
        assigned_role: assignRole || undefined,
        priority: assignPriority || undefined
      });
      toast.success('Task assigned successfully');
      fetchData();
      const updatedTask = await api.get(`/tasks/${selectedTask.id}/`);
      setSelectedTask(updatedTask.data);
    } catch (error) {
      console.error('Assignment failed:', error);
      toast.error('Failed to assign task');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTask || !window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) return;

    setIsProcessing(true);
    try {
      await api.delete(`/tasks/${selectedTask.id}/`);
      toast.success('Task deleted successfully');
      setSelectedTask(null);
      fetchData();
    } catch (error) {
      console.error('Deletion failed:', error);
      toast.error('Failed to delete task');
    } finally {
      setIsProcessing(false);
    }
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'VEHICLE_VERIFICATION': return <Car className="h-6 w-6" />;
      case 'IDENTITY_VERIFICATION': return <User className="h-6 w-6" />;
      case 'CORPORATE_VERIFICATION': return <Briefcase className="h-6 w-6" />;
      case 'SUPPORT_TICKET': return <MessageSquare className="h-6 w-6" />;
      case 'DISPUTE_RESOLUTION': return <AlertCircle className="h-6 w-6" />;
      default: return <Shield className="h-6 w-6" />;
    }
  };

  const renderResourceDetails = (task: any) => {
    const detail = task.resource_detail;
    if (!detail) return <p className="text-gray-500 italic">No additional details available.</p>;

    switch (task.task_type) {
      case 'CORPORATE_VERIFICATION':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Briefcase className="h-3 w-3" /> Business Identity
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Company Name</p>
                  <p className="text-sm font-black text-gray-900">{detail.company_name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase">Reg. Number</p>
                    <p className="text-xs font-bold text-gray-900">{detail.registration_number}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase">Tax ID / TIN</p>
                    <p className="text-xs font-bold text-gray-900">{detail.tax_id}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Represented By</p>
                  <p className="text-sm font-black text-primary-600">{detail.user_email}</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <FileText className="h-3 w-3" /> Verification Documents
              </h3>
              <div className="space-y-3">
                {(detail.verification_documents || []).length > 0 ? (
                  detail.verification_documents.map((doc: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-transparent">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-xs font-bold text-gray-900">{doc.name}</p>
                          <p className="text-[8px] font-black text-gray-400 uppercase">Size: {(doc.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-primary-600 uppercase">STAMPED</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs italic text-gray-500">No digital documents attached.</p>
                )}
              </div>
            </div>

            <div className="md:col-span-2 card p-6 bg-primary-50/50 border-primary-100">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <CreditCard className="h-3 w-3" /> Subscription & Payment
              </h3>
              <div className="flex flex-wrap gap-8">
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Payment Ref</p>
                  <p className="text-sm font-black text-gray-900 uppercase">{detail.payment_reference || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Plan</p>
                  <span className="bg-primary-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase">{detail.plan_type}</span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Amount</p>
                  <p className="text-sm font-black text-emerald-600"><Price amount={detail.amount_paid} /></p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'VEHICLE_VERIFICATION':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <User className="h-3 w-3" /> Applicant & Resource
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Owner</p>
                  <p className="text-sm font-black text-gray-900">{detail.owner_email}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Location</p>
                  <p className="text-sm font-black text-gray-900">{detail.city}, {detail.country}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(detail.properties || {}).map(([key, val]) => (
                    <div key={key}>
                      <p className="text-[10px] font-bold text-gray-500 uppercase">{key.replace('_', ' ')}</p>
                      <p className="text-xs font-bold text-primary-600">{val as string}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <FileText className="h-3 w-3" /> Uploaded Documents
              </h3>
              <div className="space-y-3">
                {detail.documents?.map((doc: any) => (
                  <a key={doc.id} href={getMediaUrl(doc.file)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-primary-50 transition-all border border-transparent group">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-xs font-bold text-gray-900">{doc.name}</p>
                        <p className="text-[8px] font-black text-primary-600 uppercase">{doc.document_type}</p>
                      </div>
                    </div>
                    <ExternalLink className="h-3 w-3 text-gray-300 group-hover:text-primary-600" />
                  </a>
                ))}
              </div>
            </div>

            {detail.photos && detail.photos.length > 0 && (
              <div className="card p-6 md:col-span-2">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Resource Photos</h3>
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                  {detail.photos.map((photo: any) => (
                    <img key={photo.id} src={getMediaUrl(photo.url)} alt="" className="h-32 w-48 object-cover rounded-xl shadow-md flex-shrink-0" />
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'IDENTITY_VERIFICATION':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <User className="h-3 w-3" /> User Identity Profile
              </h3>
              <div className="space-y-4">
                <div><p className="text-[10px] font-bold text-gray-500 uppercase">Full Name</p><p className="text-sm font-black text-gray-900">{detail.first_name} {detail.last_name}</p></div>
                <div><p className="text-[10px] font-bold text-gray-500 uppercase">Email Address</p><p className="text-sm font-black text-gray-900">{detail.email}</p></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-[10px] font-bold text-gray-500 uppercase">Email Verified</p><p className={`text-xs font-bold ${detail.is_email_verified ? 'text-green-600' : 'text-red-600'}`}>{detail.is_email_verified ? 'Yes' : 'No'}</p></div>
                  <div><p className="text-[10px] font-bold text-gray-500 uppercase">Phone Verified</p><p className={`text-xs font-bold ${detail.is_phone_verified ? 'text-green-600' : 'text-red-600'}`}>{detail.is_phone_verified ? 'Yes' : 'No'}</p></div>
                </div>
              </div>
            </div>
            <div className="card p-6">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Shield className="h-3 w-3" /> Identification Document</h3>
              {detail.profile?.identity_document ? (
                <div className="space-y-4">
                  <p className="text-xs font-medium text-gray-600">Review the government ID provided.</p>
                  <a href={getMediaUrl(detail.profile.identity_document)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-primary-50 rounded-2xl border border-primary-200 group transition-all hover:bg-primary-100">
                    <div className="flex items-center gap-3"><FileText className="h-6 w-6 text-primary-600" /><div><p className="text-sm font-black text-gray-900">Identity Document</p><p className="text-[10px] font-bold text-primary-600 uppercase">Open & verify</p></div></div>
                    <ExternalLink className="h-4 w-4 text-primary-400 group-hover:text-primary-600" />
                  </a>
                </div>
              ) : <div className="flex flex-col items-center justify-center h-full py-8 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200"><AlertCircle className="h-8 w-8 text-gray-300 mb-2" /><p className="text-xs font-black text-gray-400 uppercase tracking-widest">No Document Found</p></div>}
            </div>
          </div>
        );

      default:
        return <div className="card p-6"><pre className="text-xs bg-gray-50 p-4 rounded overflow-auto">{JSON.stringify(detail, null, 2)}</pre></div>;
    }
  };

  const renderAnalytics = () => {
    if (!analytics) return null;
    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    const assetPieData = Object.entries(analytics.assets.by_type).map(([name, value]) => ({ name, value }));

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card p-6 bg-gradient-to-br from-blue-600 to-blue-700 text-white border-none shadow-blue-200/50">
            <div className="flex justify-between items-start mb-4"><div className="p-2 bg-white/20 rounded-lg"><DollarSign className="h-6 w-6" /></div><TrendingUp className="h-4 w-4 text-blue-200" /></div>
            <p className="text-blue-100 text-xs font-black uppercase tracking-widest mb-1">Total Volume</p>
            <h3 className="text-3xl font-black tracking-tighter"><Price amount={analytics.financials.total_volume} /></h3>
          </div>
          <div className="card p-6 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white border-none shadow-emerald-200/50">
            <div className="flex justify-between items-start mb-4"><div className="p-2 bg-white/20 rounded-lg"><User className="h-6 w-6" /></div><Activity className="h-4 w-4 text-emerald-200" /></div>
            <p className="text-emerald-100 text-xs font-black uppercase tracking-widest mb-1">Total Users</p>
            <h3 className="text-3xl font-black tracking-tighter">{analytics.users.total.toLocaleString()}</h3>
          </div>
          <div className="card p-6 bg-gradient-to-br from-orange-600 to-orange-700 text-white border-none shadow-orange-200/50">
            <div className="flex justify-between items-start mb-4"><div className="p-2 bg-white/20 rounded-lg"><Calendar className="h-6 w-6" /></div><TrendingUp className="h-4 w-4 text-orange-200" /></div>
            <p className="text-orange-100 text-xs font-black uppercase tracking-widest mb-1">Bookings</p>
            <h3 className="text-3xl font-black tracking-tighter">{analytics.performance.total_bookings.toLocaleString()}</h3>
          </div>
          <div className="card p-6 bg-gradient-to-br from-slate-800 to-slate-900 text-white border-none shadow-slate-200/50">
            <div className="flex justify-between items-start mb-4"><div className="p-2 bg-white/20 rounded-lg"><Briefcase className="h-6 w-6" /></div><Layers className="h-4 w-4 text-slate-400" /></div>
            <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Total Assets</p>
            <h3 className="text-3xl font-black tracking-tighter">{analytics.assets.total.toLocaleString()}</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 card p-8">
            <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2 mb-8"><TrendingUp className="h-5 w-5 text-primary-600" /> Growth Trajectory</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.growth}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dy={10} /><YAxis hide /><Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={4} dot={{ r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="users" stroke="#10b981" strokeWidth={4} dot={{ r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card p-8">
            <h3 className="text-lg font-black text-gray-900 tracking-tight mb-8 flex items-center gap-2"><PieChart className="h-5 w-5 text-primary-600" /> Inventory Mix</h3>
            <div className="h-[250px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart><Pie data={assetPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">{assetPieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip /></RePieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-6 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center">{roleConfig.icon}</div>
          <div><h1 className="text-2xl font-black text-gray-900 tracking-tight">{roleConfig.title}</h1><p className="text-xs font-bold text-gray-400 tracking-widest mt-1">{roleConfig.subtitle}</p></div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 text-[10px] font-black text-primary-600 bg-primary-50 px-3 py-1.5 rounded-lg border border-primary-100 tracking-widest shadow-sm"><Shield className="h-3 w-3" />{roleConfig.label} Mode</div>
          <div className="flex flex-wrap gap-1 max-w-[250px] justify-end">{user?.roles?.map(r => (<span key={r.role} className="text-[7px] font-black bg-gray-100 text-gray-500 px-1 py-0.5 rounded border border-gray-200">{r.role}</span>))}{isSuperRole && <span className="text-[7px] font-black bg-primary-100 text-primary-600 px-1 py-0.5 rounded border border-primary-200">Full Access</span>}</div>
        </div>
      </div>

      <div className="flex gap-4 border-b border-gray-200">
        {dashboardTabs.map(tab => (
          <button key={tab.id} onClick={() => handleTabChange(tab.id)} className={`pb-4 px-2 text-sm font-black tracking-widest transition-all relative flex items-center gap-2 ${activeTab === tab.id ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}>{tab.icon}{tab.label}{activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary-600 rounded-t-full" />}</button>
        ))}
      </div>

      {activeTab === 'analytics' ? renderAnalytics() : isReviewMode && selectedTask ? (
        <div className="animate-in slide-in-from-bottom-4 duration-500">
          <button onClick={() => setIsReviewMode(false)} className="flex items-center gap-2 text-xs font-black text-gray-400 tracking-widest mb-6 hover:text-primary-600 transition-colors"><ArrowLeft className="h-3 w-3" /> Back to Task Queue</button>
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            <div className="xl:col-span-8 space-y-8">
              <div className="flex items-center justify-between bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4"><div className="h-16 w-16 bg-primary-50 text-primary-600 rounded-3xl flex items-center justify-center">{getTaskIcon(selectedTask.task_type)}</div><div><p className="text-[10px] font-black text-primary-600 tracking-widest mb-1">{selectedTask.task_type.replace('_', ' ')}</p><h1 className="text-3xl font-black text-gray-900 tracking-tighter">{selectedTask.title}</h1></div></div>
                <div className="text-right"><p className="text-[10px] font-black text-gray-400 tracking-widest">Priority</p><span className={`text-xs font-black ${selectedTask.priority === 'URGENT' ? 'text-red-600' : 'text-gray-900'}`}>{selectedTask.priority}</span></div>
              </div>
              <div className="bg-white p-2 rounded-[2.5rem] border border-gray-100">{renderResourceDetails(selectedTask)}</div>
            </div>
            <div className="xl:col-span-4 space-y-6">
              <div className="sticky top-8">
                <div className="card p-8 bg-gray-900 text-white border-none shadow-2xl shadow-gray-200">
                  <div className="flex items-center gap-2 mb-6"><MessageSquare className="h-5 w-5 text-primary-400" /><h3 className="text-lg font-black tracking-tight">Final Decision</h3></div>
                  <div className="space-y-6">
                    <div><label htmlFor="processNotesSuper" className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Official Reviewer Notes</label><textarea id="processNotesSuper" name="processNotesSuper" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-primary-500 focus:outline-none min-h-[150px] placeholder:text-gray-600" placeholder="Provide detailed feedback..." value={processNotes} onChange={(e) => setProcessNotes(e.target.value)} /></div>
                    <div className="space-y-3"><button onClick={() => handleProcessTask('APPROVE')} disabled={isProcessing} className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-lg transition-all">Confirm & Approve</button><div className="grid grid-cols-2 gap-3"><button onClick={() => handleProcessTask('REJECT')} disabled={isProcessing} className="py-3 bg-white/5 hover:bg-red-950/30 text-red-400 border border-white/10 font-black rounded-xl transition-all">Reject</button><button onClick={() => handleProcessTask('REQUEST_CHANGES')} disabled={isProcessing} className="py-3 bg-white/5 hover:bg-orange-950/30 text-orange-400 border border-white/10 font-black rounded-xl transition-all">Re-evaluate</button></div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-4">
            <div className="card p-3 flex items-center gap-3 bg-gray-50/50 border-gray-200"><Search className="h-4 w-4 text-gray-400" /><input type="text" placeholder="Search tasks..." className="bg-transparent border-none focus:outline-none text-xs w-full font-bold" /></div>
            <div className="space-y-2">
              {tasks.length === 0 ? <div className="card p-12 text-center bg-gray-50 border-dashed border-2"><p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Queue Empty</p></div> : tasks.map((task) => (
                <button key={task.id} onClick={() => { setSelectedTask(task); setAssignTo(task.assigned_to || ''); setAssignRole(task.assigned_role || ''); setAssignPriority(task.priority || ''); if (!isSuperRole) setIsReviewMode(true); }} className={`w-full text-left p-4 rounded-2xl transition-all border-l-4 ${selectedTask?.id === task.id ? 'bg-white border-l-primary-600 shadow-md' : 'bg-gray-50 border-l-transparent hover:bg-gray-100'}`}>
                  <div className="flex justify-between items-start mb-2"><span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${task.status === 'PENDING' ? 'bg-orange-100 text-orange-600' : task.status === 'COMPLETED' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>{task.status}</span><span className="text-[8px] font-bold text-gray-400">{new Date(task.created_at).toLocaleDateString()}</span></div>
                  <h3 className="text-xs font-black text-gray-900 mb-1 leading-tight">{task.title}</h3>
                  <div className="flex items-center justify-between mt-3"><div className="flex items-center gap-2 text-[8px] font-black text-gray-400 uppercase tracking-tighter">{task.task_type.replace('_', ' ')}</div></div>
                </button>
              ))}
            </div>
          </div>
          <div className="lg:col-span-2">
            {selectedTask ? (
              <div className="space-y-6">
                <div className={`card p-6 ${isSuperRole ? 'bg-gray-900 text-white' : 'bg-white border-2 border-gray-100'} relative overflow-hidden`}>
                  <div className="relative">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3"><div className={`h-10 w-10 ${isSuperRole ? 'bg-primary-600' : 'bg-gray-100 text-gray-900'} rounded-xl flex items-center justify-center`}>{getTaskIcon(selectedTask.task_type)}</div><div><p className={`text-[9px] font-black uppercase tracking-widest ${isSuperRole ? 'text-primary-400' : 'text-gray-400'} mb-0.5`}>{selectedTask.task_type.replace('_', ' ')}</p><h2 className="text-xl font-black tracking-tight leading-none">{selectedTask.title}</h2></div></div>
                      {isSuperRole && <button onClick={handleDeleteTask} className="p-2 text-red-400 hover:text-red-500 hover:bg-white/5 rounded-xl transition-all"><Trash2 className="h-5 w-5" /></button>}
                    </div>
                    <p className={`text-sm font-medium leading-relaxed ${isSuperRole ? 'text-gray-400' : 'text-gray-600'}`}>{selectedTask.description}</p>
                  </div>
                </div>
                {isSuperRole && (
                  <div className="card p-6 border-2 border-dashed border-gray-200 bg-gray-50/50">
                    <div className="flex items-center gap-2 mb-4"><UserPlus className="h-4 w-4 text-primary-600" /><h3 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em]">Administrative Control</h3></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      <div><label htmlFor="assignTo" className="text-[10px] font-black text-gray-400 uppercase mb-1.5 block">Assign Individual</label><select id="assignTo" name="assignTo" className="input text-xs h-10 font-bold border-gray-200" value={assignTo} onChange={(e) => setAssignTo(e.target.value)}><option value="">Auto (Unassigned)</option>{staffUsers.map(u => (<option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.email})</option>))}</select></div>
                      <div><label htmlFor="assignRole" className="text-[10px] font-black text-gray-400 uppercase mb-1.5 block">Assign Role</label><select id="assignRole" name="assignRole" className="input text-xs h-10 font-bold border-gray-200" value={assignRole} onChange={(e) => setAssignRole(e.target.value)}><option value="">Open to all</option><option value="VERIFIER">Verifier</option><option value="CAR_VERIFIER">Car Verifier</option><option value="BUSINESS_VERIFIER">Business Verifier</option><option value="OPS">Operations</option><option value="SUPPORT">Support</option><option value="SUPER_ADMIN">Super Admin</option></select></div>
                      <div className="flex gap-2"><div className="flex-1"><label htmlFor="assignPriority" className="text-[10px] font-black text-gray-400 uppercase mb-1.5 block">Set Priority</label><select id="assignPriority" name="assignPriority" className="input text-xs h-10 font-bold border-gray-200" value={assignPriority} onChange={(e) => setAssignPriority(e.target.value)}><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="URGENT">Urgent</option></select></div><button onClick={handleAssignTask} disabled={isProcessing} className="btn-primary h-10 px-4 flex items-center justify-center gap-2 shadow-lg">{isProcessing ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}</button></div>
                    </div>
                  </div>
                )}
                {renderResourceDetails(selectedTask)}
                {selectedTask.status === 'PENDING' || selectedTask.status === 'ASSIGNED' || selectedTask.status === 'IN_PROGRESS' || isSuperRole ? (
                  <div className={`card p-6 ${isSuperRole ? 'border-2 border-primary-100 bg-primary-50/10' : 'border border-gray-200'}`}>
                    <div className="flex items-center gap-2 mb-6"><MessageSquare className="h-4 w-4 text-primary-600" /><h3 className="text-sm font-black text-gray-900 tracking-tight">Review Decision</h3></div>
                    <div className="space-y-6">
                      <div><label htmlFor="processNotesPrimary" className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Decision Notes</label><textarea id="processNotesPrimary" name="processNotesPrimary" className="input min-h-[100px] text-sm font-medium" placeholder="Provide reasons..." value={processNotes} onChange={(e) => setProcessNotes(e.target.value)} /></div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4"><button onClick={() => handleProcessTask('APPROVE')} disabled={isProcessing} className="btn-primary py-3 bg-emerald-600 hover:bg-emerald-700 border-none shadow-lg">Approve</button><button onClick={() => handleProcessTask('REJECT')} disabled={isProcessing} className="btn-secondary py-3 text-red-600 border-red-100 hover:bg-red-50">Reject</button><button onClick={() => handleProcessTask('REQUEST_CHANGES')} disabled={isProcessing} className="btn-secondary py-3 text-orange-600 border-orange-100 hover:bg-orange-50">Re-evaluate</button></div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="card p-6 bg-gray-50 border-gray-100"><div className="flex items-center gap-3 mb-4">{selectedTask.status === 'COMPLETED' ? <CheckCircle className="h-8 w-8 text-emerald-500" /> : <XCircle className="h-8 w-8 text-red-500" />}<div><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Resolution</p><h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">{selectedTask.status}</h3></div></div><div className="bg-white p-4 rounded-xl border border-gray-100"><p className="text-xs font-medium text-gray-700 leading-relaxed">"{selectedTask.reviewer_notes || 'No notes provided.'}"</p></div></div>
                    <div className="card p-6 border-2 border-red-50 bg-red-50/10"><div className="flex items-center gap-2 mb-4"><RotateCcw className="h-4 w-4 text-red-600" /><h3 className="text-sm font-black text-gray-900 tracking-tight">Re-evaluate Task</h3></div><p className="text-xs text-gray-500 mb-6 font-medium">Revoke status and return to queue.</p><div className="space-y-4"><textarea className="input min-h-[80px] text-xs font-medium bg-white" placeholder="Reason for revocation..." value={processNotes} onChange={(e) => setProcessNotes(e.target.value)} /><button onClick={() => handleProcessTask('REVOKE')} disabled={isProcessing || !processNotes} className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-xs transition-all shadow-lg disabled:opacity-50">Revoke & Re-open Task</button></div></div>
                  </div>
                )}
              </div>
            ) : <div className="card h-[500px] flex flex-col items-center justify-center text-center p-12 bg-gray-50 border-dashed border-2"><p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Select a task</p></div>}
          </div>
        </div>
      )}
    </div>
  );
}
