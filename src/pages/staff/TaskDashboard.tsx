import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';
import {
  CheckCircle, XCircle, Clock, Search, Eye, Filter,
  Car, Shield, FileText, User, ChevronRight, AlertCircle,
  MessageSquare, ExternalLink, ThumbsUp, ThumbsDown, RotateCcw,
  UserPlus, Trash2, Tag, Flag, BarChart3, PieChart, Activity, TrendingUp,
  DollarSign, Briefcase, Calendar, Layers, Save, ArrowLeft, CreditCard,
  Plus, X, PenTool, CheckSquare, Download, ShieldCheck, RotateCw, Monitor
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { getMediaUrl } from '../../utils/media';
import { Price } from '../../context/CurrencyContext';
import AnalyticsPanel from '../../features/staff/AnalyticsPanel';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

export default function TaskDashboard() {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const userRoles = user?.roles?.map(r => r.role) || [];
  const isSuperRole = user?.is_superuser || userRoles.includes('SUPER_ADMIN');

  const getRoleConfig = () => {
    if (isSuperRole) return { title: 'Internal Task Dashboard', icon: <ShieldCheck className="h-4 w-4" />, label: 'Super Admin', accent: 'from-primary-600 to-primary-700' };
    if (userRoles.includes('VERIFIER')) return { title: 'Verification Workspace', icon: <CheckCircle className="h-4 w-4" />, label: 'Verifier', accent: 'from-emerald-600 to-emerald-700' };
    if (userRoles.includes('CAR_VERIFIER')) return { title: 'Fleet Verification', icon: <Car className="h-4 w-4" />, label: 'Car Verifier', accent: 'from-primary-600 to-primary-700' };
    if (userRoles.includes('RIDE_BUSINESS_VERIFIER')) return { title: 'Ride Business Verification', icon: <Briefcase className="h-4 w-4" />, label: 'Ride Business Verifier', accent: 'from-violet-600 to-violet-700' };
    if (userRoles.includes('ASSET_BUSINESS_VERIFIER')) return { title: 'Asset Business Verification', icon: <Briefcase className="h-4 w-4" />, label: 'Asset Business Verifier', accent: 'from-violet-600 to-violet-700' };
    if (userRoles.includes('SUPPORT')) return { title: 'Support & Resolution', icon: <MessageSquare className="h-4 w-4" />, label: 'Support', accent: 'from-sky-600 to-sky-700' };
    if (userRoles.includes('OPS')) return { title: 'Operations Dashboard', icon: <Activity className="h-4 w-4" />, label: 'Operations', accent: 'from-orange-600 to-orange-700' };
    if (userRoles.includes('LEGAL')) return { title: 'Legal & Dispute Review', icon: <Shield className="h-4 w-4" />, label: 'Legal', accent: 'from-rose-600 to-rose-700' };
    return { title: 'Staff Workspace', icon: <Clock className="h-4 w-4" />, label: 'Staff', accent: 'from-gray-600 to-gray-700' };
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
  const [feedbackAttachment, setFeedbackAttachment] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [staffUsers, setStaffUsers] = useState<any[]>([]);
  const [assignTo, setAssignTo] = useState('');
  const [assignRole, setAssignRole] = useState('');
  const [assignPriority, setAssignPriority] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'MEDIUM', assigned_to: '', assigned_role: '', attachments: '', assignType: 'person' });
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void}>({isOpen: false, title: '', message: '', onConfirm: () => {}});
  const [taskStatuses, setTaskStatuses] = useState<Record<string, 'pending' | 'success' | 'error'>>({});

  const dashboardTabs = [
    { id: 'tasks', label: 'Queue', icon: <Clock className="h-4 w-4" /> },
    ...(isSuperRole ? [{ id: 'analytics', label: 'Analytics', icon: <BarChart3 className="h-4 w-4" /> }] : []),
    ...((userRoles.includes('SUPPORT') || permissions.includes('DISPUTE_RESOLVE')) ? [{ id: 'support', label: 'Support', icon: <MessageSquare className="h-4 w-4" /> }] : [])
  ];

  useEffect(() => {
    fetchData();
    if (isSuperRole) {
      fetchStaffUsers();
      fetchAnalytics();
    }
  }, [isSuperRole, activeTab]);

  useEffect(() => {
    const handleNotification = (event: any) => fetchData();
    window.addEventListener('ws:notification', handleNotification);
    return () => window.removeEventListener('ws:notification', handleNotification);
  }, []);

  const fetchData = async (tab?: string) => {
    try {
      setIsLoading(true);
      const currentTab = tab || activeTab;
      let url = '/tasks/';
      
      if (currentTab === 'support') {
        url = '/tasks/?task_type=SUPPORT_TICKET,DISPUTE_RESOLUTION';
      } else if (currentTab === 'tasks') {
        const getRoleFilter = () => {
          if (userRoles.includes('VERIFIER')) return '?task_type=IDENTITY_VERIFICATION,DOCUMENT_VERIFICATION';
          if (userRoles.includes('CAR_VERIFIER')) return '?task_type=VEHICLE_VERIFICATION';
          if (userRoles.includes('SUPPORT')) return '?task_type=SUPPORT_TICKET,DISPUTE_RESOLUTION';
          if (userRoles.includes('OPS')) return '?task_type=OPERATIONAL';
          return '';
        };
        url = `/tasks/${getRoleFilter()}`;
      }
      
      const [tasksRes, summaryRes] = await Promise.all([
        api.get(url),
        api.get('/tasks/dashboard_summary/')
      ]);
      setTasks(tasksRes.data.results || tasksRes.data);
      setSummary(summaryRes.data);
    } catch (error) {
      toast.error('Unable to load staff dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStaffUsers = async () => {
    try {
      const res = await api.get('/tasks/staff_users/');
      setStaffUsers(res.data);
    } catch (error) {}
  };

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/tasks/super_analytics/');
      setAnalytics(res.data);
    } catch (error) {}
  };

  const handleProcessTask = async (action: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES' | 'REVOKE' | 'SUBMIT_COMPLETION') => {
    if (!selectedTask) return;
    setIsProcessing(true);
    try {
      await api.post(`/tasks/${selectedTask.id}/process/`, {
        action,
        notes: processNotes,
        attachment: feedbackAttachment
      });
      toast.success(`Task ${action.toLowerCase()} successful`);
      setSelectedTask(null);
      setProcessNotes('');
      setFeedbackAttachment('');
      fetchData();
    } catch (error) {
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
      toast.success('Task assigned');
      fetchData();
      const updatedTask = await api.get(`/tasks/${selectedTask.id}/`);
      setSelectedTask(updatedTask.data);
    } catch (error) {
      toast.error('Failed to assign task');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchApprove = async () => {
    if (selectedTasks.length === 0) return;
    setConfirmModal({
      isOpen: true,
      title: 'Batch Approve',
      message: `Approve ${selectedTasks.length} tasks?`,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setIsProcessing(true);
        let successCount = 0;
        for (const taskId of selectedTasks) {
          try {
            await api.post(`/tasks/${taskId}/process/`, { action: 'APPROVE', notes: 'Batch Approved' });
            successCount++;
          } catch (e) {}
        }
        toast.success(`Approved ${successCount}/${selectedTasks.length} tasks`);
        setSelectedTasks([]);
        fetchData();
        setIsProcessing(false);
      }
    });
  };

  const handleDeleteTask = () => {
    if (!selectedTask) return;
    setConfirmModal({
      isOpen: true,
      title: 'Delete Task',
      message: 'Permanently delete this task?',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setIsProcessing(true);
        try {
          await api.delete(`/tasks/${selectedTask.id}/`);
          toast.success('Task deleted');
          setSelectedTask(null);
          fetchData();
        } catch (error) {
          toast.error('Failed to delete task');
        } finally {
          setIsProcessing(false);
        }
      }
    });
  };

  const handleCreateCustomTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title) return;
    setIsProcessing(true);
    try {
      const payload: any = {
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority.toUpperCase(),
        attachments: newTask.attachments ? [{ type: 'link', url: newTask.attachments }] : []
      };
      if (newTask.assignType === 'person' && newTask.assigned_to) payload.assigned_to = newTask.assigned_to;
      else if (newTask.assignType === 'role' && newTask.assigned_role) payload.assigned_role = newTask.assigned_role;
      
      await api.post('/tasks/create_custom/', payload);
      toast.success('Task created');
      setIsCreateModalOpen(false);
      setNewTask({ title: '', description: '', priority: 'MEDIUM', assigned_to: '', assigned_role: '', attachments: '', assignType: 'person' });
      fetchData();
    } catch (error) {
      toast.error('Failed to create task');
    } finally {
      setIsProcessing(false);
    }
  };

  const getTaskIcon = (type: string) => {
    const sizeClasses = "h-4 w-4";
    switch (type) {
      case 'VEHICLE_VERIFICATION': return <Car className={sizeClasses} />;
      case 'IDENTITY_VERIFICATION': return <User className={sizeClasses} />;
      case 'CORPORATE_VERIFICATION': return <Briefcase className={sizeClasses} />;
      case 'SUPPORT_TICKET': return <MessageSquare className={sizeClasses} />;
      case 'DISPUTE_RESOLUTION': return <AlertCircle className={sizeClasses} />;
      case 'CUSTOM_TASK': return <PenTool className={sizeClasses} />;
      case 'CORPORATE_RIDE_VERIFICATION': case 'CORPORATE_ASSET_VERIFICATION': return <Briefcase className={sizeClasses} />;
      case 'ASSET_AUDIT': return <Activity className={sizeClasses} />;
      case 'SUBSCRIPTION_VERIFICATION': return <CreditCard className={sizeClasses} />;
      default: return <Shield className={sizeClasses} />;
    }
  };

  const getStatusConfig = (status: string) => {
    const c: Record<string, { color: string; bg: string; icon: any }> = {
      PENDING: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800', icon: <Clock className="h-3 w-3" /> },
      ASSIGNED: { color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-900/20 border-primary-100 dark:border-primary-800', icon: <UserPlus className="h-3 w-3" /> },
      IN_PROGRESS: { color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800', icon: <Activity className="h-3 w-3" /> },
      COMPLETED: { color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800', icon: <CheckCircle className="h-3 w-3" /> },
      REJECTED: { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800', icon: <XCircle className="h-3 w-3" /> },
      CHANGES_REQUESTED: { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-800', icon: <RotateCcw className="h-3 w-3" /> },
    };
    return c[status] || c.PENDING;
  };

  const timeAgo = (date: string) => {
    const d = Date.now() - new Date(date).getTime();
    const m = Math.floor(d / 60000);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
  };

  // ═══════════════════════════════════════════════════════════
  // RESOURCE DETAILS RENDERER
  // ═══════════════════════════════════════════════════════════
  const renderResourceDetails = (task: any) => {
    const detail = task.resource_detail;
    if (!detail) return <p className="text-gray-500 italic p-6 text-sm">No additional payload data.</p>;

    return (
      <div className="p-6 space-y-6">
        {task.task_type.includes('CORPORATE') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Company Entity</p>
              <h4 className="text-sm font-black text-gray-900 dark:text-white">{detail.company_name}</h4>
              <p className="text-xs text-gray-500 mt-1">ID: {detail.registration_number}</p>
              <p className="text-xs text-gray-500">Tax: {detail.tax_id}</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Representative</p>
              <p className="text-xs font-bold text-gray-900 dark:text-white">{detail.user_email}</p>
              <p className="text-[10px] text-gray-400 mt-1 uppercase">Role: {detail.business_category}</p>
            </div>
            {detail.verification_documents?.length > 0 && (
              <div className="md:col-span-2 space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Documents</p>
                {detail.verification_documents.map((doc: any, i: number) => (
                  <a key={i} href={getMediaUrl(doc.file || doc.url)} target="_blank" rel="noopener noreferrer" 
                    className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span className="text-xs font-medium">{doc.name || 'View Document'}</span>
                    </div>
                    <ExternalLink className="h-3 w-3 text-gray-300" />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {(task.task_type === 'VEHICLE_VERIFICATION' || task.task_type === 'IDENTITY_VERIFICATION') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">User / Owner</p>
              <p className="text-xs font-bold">{detail.email || detail.owner_email}</p>
              <p className="text-xs text-gray-500 mt-1">{detail.first_name} {detail.last_name}</p>
            </div>
            {detail.profile?.identity_document && (
              <a href={getMediaUrl(detail.profile.identity_document)} target="_blank" rel="noopener noreferrer"
                className="p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 rounded-xl flex items-center justify-between group">
                <div>
                  <p className="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest">Gov Identity</p>
                  <p className="text-xs font-black text-primary-700 dark:text-primary-300">Review ID Doc</p>
                </div>
                <ExternalLink className="h-4 w-4 text-primary-400 group-hover:text-primary-600" />
              </a>
            )}
            {detail.photos?.length > 0 && (
              <div className="md:col-span-2 space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Inspection Photos</p>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {detail.photos.map((p: any, i: number) => (
                    <img key={i} src={getMediaUrl(p.url)} className="h-20 w-32 object-cover rounded-lg shadow-sm flex-shrink-0" />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {task.task_type.includes('SUPPORT') && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold">
                {detail.user_email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <p className="text-xs font-black">{detail.user_email || 'Support Client'}</p>
                <p className="text-[10px] text-gray-400 uppercase">{detail.subject || 'Support Ticket'}</p>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg italic text-sm text-gray-600 dark:text-gray-300 border-l-2 border-primary-500">
              "{detail.last_message?.content || detail.message || 'No messages.'}"
            </div>
            {detail.id && (
              <button onClick={() => navigate(`/messages/${detail.id}`)} 
                className="w-full btn-primary py-2 text-xs font-black mt-4 flex items-center justify-center gap-2">
                <MessageSquare className="h-3 w-3" /> Go to Chat
              </button>
            )}
          </div>
        )}

        {task.task_type === 'SUBSCRIPTION_VERIFICATION' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl">
                <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Amount</p>
                <p className="text-sm font-black text-emerald-700 dark:text-emerald-300"><Price amount={detail.amount} /></p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                <p className="text-[9px] font-bold text-gray-400 uppercase">Network</p>
                <p className="text-xs font-bold">{detail.payment_method_details?.network_name || 'Manual'}</p>
              </div>
            </div>
            {detail.receipt_image && (
              <div className="p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Receipt / TX Proof</p>
                <a href={getMediaUrl(detail.receipt_image)} target="_blank" rel="noopener noreferrer">
                  <img src={getMediaUrl(detail.receipt_image)} className="max-h-40 mx-auto rounded-lg object-contain hover:opacity-90 transition-opacity" />
                </a>
              </div>
            )}
            <p className="text-[10px] font-mono text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded break-all">{detail.confirmation_message || detail.transaction_id}</p>
          </div>
        )}

        {task.task_type === 'CUSTOM_TASK' && (
          <div className="p-4 bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-800 rounded-xl">
            <h4 className="text-xs font-black text-violet-600 dark:text-violet-400 uppercase mb-2">Internal Instructions</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">{task.description || 'No detailed instructions provided.'}</p>
          </div>
        )}
      </div>
    );
  };

  if (isLoading && tasks.length === 0) return (
    <div className="flex h-[calc(100vh-64px)] items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
    </div>
  );

  const filterOptions = [
    { id: 'ALL', label: 'All' },
    { id: 'PENDING', label: 'Pending' },
    { id: 'CUSTOM_TASK', label: 'Custom' }
  ];

  const processedTasks = tasks.filter(t => {
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'PENDING') return t.status === 'PENDING';
    return t.task_type === activeFilter;
  });

  const pendingCount = tasks.filter(t => t.status === 'PENDING').length;
  const completedCount = tasks.filter(t => t.status === 'COMPLETED').length;

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-gray-50 dark:bg-[#0a0a0a]">
      <ConfirmModal 
        isOpen={confirmModal.isOpen} 
        title={confirmModal.title} 
        message={confirmModal.message} 
        onConfirm={confirmModal.onConfirm} 
        onCancel={() => setConfirmModal(prev => ({...prev, isOpen: false}))} 
      />

      {/* LEFT PANEL — TASK LIST */}
      <div className="w-full lg:w-[400px] xl:w-[440px] flex-shrink-0 border-r border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden bg-white dark:bg-gray-900">
        {/* COMPACT HEADER */}
        <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-white bg-gradient-to-br ${roleConfig.accent}`}>
              {roleConfig.icon}
            </div>
            <div>
              <h1 className="text-base font-black text-gray-900 dark:text-white leading-none">{roleConfig.title}</h1>
              <p className="text-xs text-gray-400 mt-0.5">{roleConfig.label}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
              {pendingCount}
            </span>
            {isSuperRole && (
              <button onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary-600 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 rounded-lg border border-primary-100 dark:border-primary-800 transition-colors">
                <Plus className="h-3.5 w-3.5" /> New
              </button>
            )}
          </div>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-[57px] z-10">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
            {filterOptions.map(opt => (
              <button key={opt.id} onClick={() => setActiveFilter(opt.id)}
                className={`flex-shrink-0 px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                  activeFilter === opt.id
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}>
                {opt.label}
              </button>
            ))}
            {selectedTasks.length > 0 && (
              <button onClick={handleBatchApprove} disabled={isProcessing}
                className="flex-shrink-0 flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg bg-primary-600 text-white ml-auto">
                <CheckSquare className="h-3 w-3" /> Approve {selectedTasks.length}
              </button>
            )}
          </div>
        </div>

        {/* TASK ITEMS */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800">
          {processedTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <div className="h-16 w-16 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-4">
                <Layers className="h-8 w-8 text-gray-300" />
              </div>
              <p className="font-bold text-gray-400 text-sm">Queue is empty</p>
              <p className="text-xs text-gray-300 mt-1">No tasks match your filters</p>
            </div>
          ) : processedTasks.map(task => {
            const sc = getStatusConfig(task.status);
            const isSelected = selectedTask?.id === task.id;
            const isChecked = selectedTasks.includes(task.id);
            const done = ['COMPLETED', 'REJECTED'].includes(task.status);
            return (
              <div key={task.id}
                onClick={() => setSelectedTask(task)}
                className={`flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors group
                  ${isSelected ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}
                  ${task.priority === 'URGENT' ? 'border-l-2 border-l-red-500' : ''}
                  ${done ? 'opacity-50' : ''}
                `}
              >
                {!done && (
                  <button onClick={e => { e.stopPropagation(); setSelectedTasks(p => p.includes(task.id) ? p.filter(id => id !== task.id) : [...p, task.id]); }}
                    className={`mt-0.5 h-4 w-4 flex-shrink-0 rounded border-2 transition-colors
                      ${isChecked ? 'bg-primary-600 border-primary-600' : 'border-gray-300 group-hover:border-primary-400'}`}
                  >
                    {isChecked && <CheckSquare className="h-3 w-3 text-white" />}
                  </button>
                )}
                
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5
                  ${isSelected ? 'bg-primary-100 dark:bg-primary-800 text-primary-600 dark:text-primary-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                  {getTaskIcon(task.task_type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-bold leading-snug truncate ${done ? 'line-through text-gray-400' : isSelected ? 'text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-white'}`}>
                      {task.title}
                    </p>
                    {task.priority === 'URGENT' && (
                      <span className="flex-shrink-0 text-[9px] font-black text-red-600 bg-red-50 dark:bg-red-900/30 px-1.5 py-0.5 rounded-full border border-red-100 dark:border-red-800 animate-pulse">!</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center gap-0.5 text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full border ${sc.bg} ${sc.color}`}>
                      {sc.icon} {task.status === 'CHANGES_REQUESTED' ? 'REVIEW' : task.status}
                    </span>
                    <span className="text-[10px] text-gray-400">{timeAgo(task.created_at)}</span>
                    {task.assigned_to_email && (
                      <span className="text-[10px] text-primary-500 font-medium truncate max-w-[80px]">{task.assigned_to_email.split('@')[0]}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT PANEL — DETAIL / REVIEW */}
      <div className={`fixed inset-0 lg:relative lg:flex-1 lg:flex flex-col z-50 bg-white dark:bg-[#0a0a0a] transition-all duration-300 ${selectedTask ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
        {selectedTask ? (
          <div className="flex flex-col h-full overflow-hidden">
            {/* DETAIL HEADER */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedTask(null)} className="p-2 -ml-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg lg:hidden transition-colors">
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="h-10 w-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                  {getTaskIcon(selectedTask.task_type)}
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{selectedTask.task_type.replace(/_/g, ' ')}</p>
                  <h2 className="text-base font-black text-gray-900 dark:text-white leading-tight">{selectedTask.title}</h2>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {isSuperRole && (
                  <button onClick={handleDeleteTask} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                <button onClick={() => setSelectedTask(null)} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* SCROLLABLE CONTENT */}
            <div className="flex-1 overflow-y-auto">
              {renderResourceDetails(selectedTask)}
            </div>

            {/* ACTION BAR */}
            <div className="border-t border-gray-100 dark:border-gray-800 p-4 bg-white dark:bg-gray-900">
              {isSuperRole && (
                <div className="flex gap-2 mb-3">
                  <select value={assignTo} onChange={e => setAssignTo(e.target.value)}
                    className="flex-1 min-w-0 text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-primary-500">
                    <option value="">Unassigned</option>
                    {staffUsers.map(u => <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>)}
                  </select>
                  <select value={assignPriority} onChange={e => setAssignPriority(e.target.value)}
                    className="w-24 text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-primary-500">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                  <button onClick={handleAssignTask} disabled={isProcessing}
                    className="px-3 py-1.5 text-xs font-bold bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors">
                    {isProcessing ? '...' : 'Assign'}
                  </button>
                </div>
              )}

              <textarea
                value={processNotes}
                onChange={e => setProcessNotes(e.target.value)}
                placeholder="Decision notes..."
                className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none mb-3"
                rows={2}
              />

              {['COMPLETED', 'REJECTED'].includes(selectedTask.status) ? (
                <button onClick={() => handleProcessTask('REVOKE')} disabled={isProcessing}
                  className="w-full py-2.5 text-sm font-bold text-orange-600 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl hover:bg-orange-100 transition-colors flex items-center justify-center gap-2">
                  <RotateCcw className="h-4 w-4" /> Revoke & Reopen
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => handleProcessTask('APPROVE')} disabled={isProcessing}
                    className="flex-1 py-2.5 text-sm font-black text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors flex items-center justify-center gap-1.5">
                    <ThumbsUp className="h-4 w-4" /> Approve
                  </button>
                  <button onClick={() => handleProcessTask('REQUEST_CHANGES')} disabled={isProcessing}
                    className="px-4 py-2.5 text-sm font-bold text-orange-600 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 rounded-xl hover:bg-orange-100 transition-colors">
                    <RotateCcw className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleProcessTask('REJECT')} disabled={isProcessing}
                    className="px-4 py-2.5 text-sm font-bold text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl hover:bg-red-100 transition-colors">
                    <ThumbsDown className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="hidden lg:flex flex-col items-center justify-center h-full text-center p-12 bg-gray-50 dark:bg-gray-900/50">
            <div className="h-16 w-16 rounded-2xl bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-gray-200 dark:text-gray-700" />
            </div>
            <p className="text-sm font-bold text-gray-300 dark:text-gray-600 uppercase tracking-widest">Select a task to review</p>
          </div>
        )}
      </div>

      {/* CREATE TASK MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h2 className="text-lg font-black text-gray-900 dark:text-white">New Task</h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X /></button>
            </div>
            <form onSubmit={handleCreateCustomTask} className="p-6 space-y-4">
              <input type="text" placeholder="Task Title" value={newTask.title} 
                onChange={e => setNewTask({...newTask, title: e.target.value})}
                className="w-full input p-3 text-sm font-bold" required />
              <textarea placeholder="Instructions..." value={newTask.description}
                onChange={e => setNewTask({...newTask, description: e.target.value})}
                className="w-full input p-3 text-sm min-h-[100px]" />
              <div className="grid grid-cols-2 gap-4">
                <select value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})}
                  className="w-full input p-3 text-sm font-bold">
                  <option value="LOW">Low Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="HIGH">High Priority</option>
                  <option value="URGENT">Urgent Priority</option>
                </select>
                <input type="url" placeholder="Attachment URL" value={newTask.attachments}
                  onChange={e => setNewTask({...newTask, attachments: e.target.value})}
                  className="w-full input p-3 text-sm" />
              </div>
              <div className="flex gap-4">
                <button type="submit" disabled={isProcessing} className="flex-1 btn-primary py-3 font-black">
                  {isProcessing ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
