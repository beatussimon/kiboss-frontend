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
  Plus, X, PenTool, CheckSquare, Download
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart as RePieChart, Pie
} from 'recharts';
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
    if (isSuperRole) return { title: 'Internal Task Dashboard', subtitle: 'Full Administrative Control', icon: <Shield className="h-6 w-6" />, label: 'Super Admin', accent: 'from-primary-600 to-primary-700' };
    if (userRoles.includes('VERIFIER')) return { title: 'Verification Workspace', subtitle: 'Identity & Vehicle Review', icon: <CheckCircle className="h-6 w-6" />, label: 'Verifier', accent: 'from-emerald-600 to-emerald-700' };
    if (userRoles.includes('CAR_VERIFIER')) return { title: 'Fleet Verification', subtitle: 'Vehicle & Asset Review', icon: <Car className="h-6 w-6" />, label: 'Car Verifier', accent: 'from-primary-600 to-primary-700' };
    if (userRoles.includes('RIDE_BUSINESS_VERIFIER')) return { title: 'Ride Business Verification', subtitle: 'Corporate Transport Review', icon: <Briefcase className="h-6 w-6" />, label: 'Ride Business Verifier', accent: 'from-violet-600 to-violet-700' };
    if (userRoles.includes('ASSET_BUSINESS_VERIFIER')) return { title: 'Asset Business Verification', subtitle: 'Corporate Real Estate Review', icon: <Briefcase className="h-6 w-6" />, label: 'Asset Business Verifier', accent: 'from-violet-600 to-violet-700' };
    if (userRoles.includes('SUPPORT')) return { title: 'Support & Resolution Hub', subtitle: 'Ticket & Dispute Management', icon: <MessageSquare className="h-6 w-6" />, label: 'Support', accent: 'from-sky-600 to-sky-700' };
    if (userRoles.includes('OPS')) return { title: 'Operations Dashboard', subtitle: 'Fleet & Audit Management', icon: <Activity className="h-6 w-6" />, label: 'Operations', accent: 'from-orange-600 to-orange-700' };
    if (userRoles.includes('LEGAL')) return { title: 'Legal & Dispute Review', subtitle: 'Compliance & Resolution', icon: <Shield className="h-6 w-6" />, label: 'Legal', accent: 'from-rose-600 to-rose-700' };
    return { title: 'Staff Workspace', subtitle: 'Operational Queue', icon: <Clock className="h-6 w-6" />, label: 'Staff', accent: 'from-gray-600 to-gray-700' };
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
  const [isReviewMode, setIsReviewMode] = useState(false);
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

  const handleExportCSV = () => {
    const csvContent = [
      ['ID', 'Type', 'Title', 'Status', 'Priority', 'Assigned To', 'Created At'],
      ...tasks.map(t => [
        t.id, t.task_type, `"${t.title.replace(/"/g, '""')}"`, t.status, t.priority, t.assigned_to_email || 'Unassigned', new Date(t.created_at).toLocaleString()
      ])
    ].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `tasks_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const executeBatchApprove = async () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
    setIsProcessing(true);
    let successCount = 0;
    
    // Process in chunks of 5 to avoid overloading the backend
    const chunkSize = 5;
    for (let i = 0; i < selectedTasks.length; i += chunkSize) {
      const chunk = selectedTasks.slice(i, i + chunkSize);
      
      setTaskStatuses(prev => {
        const next = { ...prev };
        chunk.forEach(taskId => { next[taskId] = 'pending'; });
        return next;
      });

      const promises = chunk.map(taskId => 
        api.post(`/tasks/${taskId}/process/`, { action: 'APPROVE', notes: 'Batch Approved' })
          .then(() => { 
            successCount++; 
            setTaskStatuses(prev => ({ ...prev, [taskId]: 'success' }));
          })
          .catch(e => { 
            console.error(`Failed to approve ${taskId}`, e); 
            setTaskStatuses(prev => ({ ...prev, [taskId]: 'error' }));
          })
      );
      await Promise.all(promises);
    }
    
    toast.success(`Successfully approved ${successCount}/${selectedTasks.length} tasks`);
    setTimeout(() => {
      setSelectedTasks([]);
      setTaskStatuses({});
      fetchData();
      setIsProcessing(false);
    }, 1500);
  };

  const handleBatchApprove = () => {
    if (selectedTasks.length === 0) return;
    setConfirmModal({
      isOpen: true,
      title: 'Batch Approve Tasks',
      message: `Are you sure you want to approve ${selectedTasks.length} tasks simultaneously?`,
      onConfirm: executeBatchApprove
    });
  };

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

  useEffect(() => {
    const handleNotification = (event: any) => {
      // Refresh dashboard when a notification is received
      fetchData();
    };
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
          return ''; // Super admin sees all
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

  const handleProcessTask = async (action: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES' | 'REVOKE' | 'SUBMIT_COMPLETION') => {
    if (!selectedTask) return;
    setIsProcessing(true);
    try {
      await api.post(`/tasks/${selectedTask.id}/process/`, {
        action,
        notes: processNotes,
        attachment: feedbackAttachment
      });
      toast.success(`Task ${action.toLowerCase()} successfully`);
      setSelectedTask(null);
      setIsReviewMode(false);
      setProcessNotes('');
      setFeedbackAttachment('');
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

  const executeDeleteTask = async () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
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

  const handleDeleteTask = () => {
    if (!selectedTask) return;
    setConfirmModal({
      isOpen: true,
      title: 'Delete Task',
      message: 'Are you sure you want to delete this task? This action cannot be undone.',
      onConfirm: executeDeleteTask
    });
  };

  const handleCreateCustomTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title) return toast.error('Title is required');
    setIsProcessing(true);
    try {
      const payload: any = {
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority.toUpperCase(),
        attachments: newTask.attachments ? [{ type: 'link', url: newTask.attachments }] : []
      };
      if (newTask.assignType === 'person' && newTask.assigned_to) {
        payload.assigned_to = newTask.assigned_to;
      } else if (newTask.assignType === 'role' && newTask.assigned_role) {
        payload.assigned_role = newTask.assigned_role;
      }
      await api.post('/tasks/create_custom/', payload);
      toast.success('Custom task created successfully');
      setIsCreateModalOpen(false);
      setNewTask({ title: '', description: '', priority: 'MEDIUM', assigned_to: '', assigned_role: '', attachments: '', assignType: 'person' });
      fetchData();
    } catch (error) {
      console.error('Creation failed:', error);
      toast.error('Failed to create custom task');
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
      case 'CUSTOM_TASK': return <PenTool className="h-6 w-6" />;
      case 'CORPORATE_RIDE_VERIFICATION': case 'CORPORATE_ASSET_VERIFICATION': return <Briefcase className="h-6 w-6" />;
      case 'ASSET_AUDIT': return <Activity className="h-6 w-6" />;
      case 'SUBSCRIPTION_VERIFICATION': return <CreditCard className="h-6 w-6" />;
      default: return <Shield className="h-6 w-6" />;
    }
  };

  // ═══════════════════════════════════════════════════════════
  // RESOURCE DETAILS RENDERER — each task type gets a rich card
  // ═══════════════════════════════════════════════════════════
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
                <div><p className="text-[10px] font-bold text-gray-500 uppercase">Company Name</p><p className="text-sm font-black text-gray-900 dark:text-white">{detail.company_name}</p></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-[10px] font-bold text-gray-500 uppercase">Reg. Number</p><p className="text-xs font-bold text-gray-900 dark:text-white">{detail.registration_number}</p></div>
                  <div><p className="text-[10px] font-bold text-gray-500 uppercase">Tax ID / TIN</p><p className="text-xs font-bold text-gray-900 dark:text-white">{detail.tax_id}</p></div>
                </div>
                <div><p className="text-[10px] font-bold text-gray-500 uppercase">Represented By</p><p className="text-sm font-black text-primary-600">{detail.user_email}</p></div>
              </div>
            </div>
            <div className="card p-6">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <FileText className="h-3 w-3" /> Verification Documents
              </h3>
              <div className="space-y-3">
                {(detail.verification_documents || []).length > 0 ? (
                  detail.verification_documents.map((doc: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-transparent">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <div><p className="text-xs font-bold text-gray-900 dark:text-white">{doc.name}</p><p className="text-[8px] font-black text-gray-400 uppercase">Size: {(doc.size / 1024).toFixed(1)} KB</p></div>
                      </div>
                      <span className="text-[10px] font-black text-primary-600 uppercase">STAMPED</span>
                    </div>
                  ))
                ) : (<p className="text-xs italic text-gray-500 dark:text-gray-400">No digital documents attached.</p>)}
              </div>
            </div>
            <div className="md:col-span-2 card p-6 bg-primary-50/50 border-primary-100">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <CreditCard className="h-3 w-3" /> Subscription & Payment
              </h3>
              <div className="flex flex-wrap gap-8">
                <div><p className="text-[10px] font-bold text-gray-500 uppercase">Payment Ref</p><p className="text-sm font-black text-gray-900 uppercase">{detail.payment_reference || 'N/A'}</p></div>
                <div><p className="text-[10px] font-bold text-gray-500 uppercase">Plan</p><span className="bg-primary-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase">{detail.plan_type}</span></div>
                <div><p className="text-[10px] font-bold text-gray-500 uppercase">Amount</p><p className="text-sm font-black text-emerald-600"><Price amount={detail.amount_paid} /></p></div>
              </div>
            </div>
          </div>
        );

      case 'VEHICLE_VERIFICATION':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><User className="h-3 w-3" /> Applicant & Resource</h3>
              <div className="space-y-4">
                <div><p className="text-[10px] font-bold text-gray-500 uppercase">Owner</p><p className="text-sm font-black text-gray-900 dark:text-white">{detail.owner_email}</p></div>
                <div><p className="text-[10px] font-bold text-gray-500 uppercase">Location</p><p className="text-sm font-black text-gray-900 dark:text-white">{detail.city}, {detail.country}</p></div>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(detail.properties || {}).map(([key, val]) => (
                    <div key={key}><p className="text-[10px] font-bold text-gray-500 uppercase">{key.replace('_', ' ')}</p><p className="text-xs font-bold text-primary-600">{val as string}</p></div>
                  ))}
                </div>
              </div>
            </div>
            <div className="card p-6">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><FileText className="h-3 w-3" /> Uploaded Documents</h3>
              <div className="space-y-3">
                {detail.documents?.map((doc: any) => (
                  <a key={doc.id} href={getMediaUrl(doc.file)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-xl hover:bg-primary-50 transition-all border border-transparent group">
                    <div className="flex items-center gap-3"><FileText className="h-4 w-4 text-gray-400" /><div><p className="text-xs font-bold text-gray-900 dark:text-white">{doc.name}</p><p className="text-[8px] font-black text-primary-600 uppercase">{doc.document_type}</p></div></div>
                    <ExternalLink className="h-3 w-3 text-gray-300 group-hover:text-primary-600" />
                  </a>
                ))}
              </div>
            </div>
            {detail.photos && detail.photos.length > 0 && (
              <div className="card p-6 md:col-span-2">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Resource Photos</h3>
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                  {detail.photos.map((photo: any) => (<img key={photo.id} src={getMediaUrl(photo.url)} alt="" className="h-32 w-48 object-cover rounded-xl shadow-md flex-shrink-0" />))}
                </div>
              </div>
            )}
          </div>
        );

      case 'IDENTITY_VERIFICATION':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><User className="h-3 w-3" /> User Identity Profile</h3>
              <div className="space-y-4">
                <div><p className="text-[10px] font-bold text-gray-500 uppercase">Full Name</p><p className="text-sm font-black text-gray-900 dark:text-white">{detail.first_name} {detail.last_name}</p></div>
                <div><p className="text-[10px] font-bold text-gray-500 uppercase">Email Address</p><p className="text-sm font-black text-gray-900 dark:text-white">{detail.email}</p></div>
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
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-300">Review the government ID provided.</p>
                  <a href={getMediaUrl(detail.profile.identity_document)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-primary-50 rounded-2xl border border-primary-200 group transition-all hover:bg-primary-100">
                    <div className="flex items-center gap-3"><FileText className="h-6 w-6 text-primary-600" /><div><p className="text-sm font-black text-gray-900 dark:text-white">Identity Document</p><p className="text-[10px] font-bold text-primary-600 uppercase">Open & verify</p></div></div>
                    <ExternalLink className="h-4 w-4 text-primary-400 group-hover:text-primary-600" />
                  </a>
                </div>
              ) : <div className="flex flex-col items-center justify-center h-full py-8 text-center bg-gray-50 dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700"><AlertCircle className="h-8 w-8 text-gray-300 mb-2" /><p className="text-xs font-black text-gray-400 uppercase tracking-widest">No Document Found</p></div>}
            </div>
          </div>
        );

      case 'SUPPORT_TICKET':
      case 'DISPUTE_RESOLUTION': {
        const getClientUser = () => {
          if (detail.participants && detail.participants.length > 0) {
            return detail.participants.find((p: any) => p.email !== user?.email) || detail.participants[0];
          }
          return null;
        };
        const clientUser = getClientUser();
        const clientName = clientUser ? `${clientUser.first_name || ''} ${clientUser.last_name || ''}`.trim() : (detail.user_email || task.created_by_email);
        const clientInitial = clientName ? clientName.charAt(0).toUpperCase() : 'U';

        return (
          <div className="card p-6 bg-gradient-to-br from-primary-50 to-indigo-50 border-primary-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-black text-primary-600 uppercase tracking-widest flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                {detail.id ? 'Live Support Connection' : 'Support Request'}
              </h3>
              {detail.message_count !== undefined && (
                <span className="text-xs font-bold text-primary-600 bg-primary-100/50 px-2 py-1 rounded border border-primary-200 dark:border-primary-800">
                  {detail.message_count} Message{detail.message_count !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="space-y-6">
              {detail.id ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-primary-100">
                  <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
                    <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-lg border-2 border-white shadow-sm">{clientInitial}</div>
                    <div><h4 className="text-base font-black text-gray-900 dark:text-white leading-tight">{clientName}</h4><p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">{clientUser?.email || detail.user_email || task.created_by_email}</p></div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 mb-6 border border-gray-100 dark:border-gray-800">
                    <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>Subject: {detail.subject || 'Support Request'}</span>
                      {detail.last_message && (<span className="text-[10px] bg-white px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700">Latest</span>)}
                    </h5>
                    <p className="text-sm font-medium text-gray-700 italic border-l-2 border-primary-200 pl-3 py-1">
                      "{detail.last_message?.content || detail.message || 'No messages yet.'}"
                    </p>
                    {detail.last_message && (<p className="text-[10px] text-gray-400 mt-3 text-right font-medium pr-1">{new Date(detail.last_message.created_at).toLocaleString()}</p>)}
                  </div>
                  {detail.is_resolved !== undefined ? (
                    <div className="flex items-center gap-2 px-4 py-3 bg-primary-50 rounded-xl text-sm font-bold text-primary-800 border border-primary-100"><AlertCircle className="h-5 w-5 text-primary-500 flex-shrink-0" />Feedback form submitted — please reach out via email.</div>
                  ) : (
                    <div className="flex items-center justify-end mt-4">
                      <button onClick={() => navigate(`/messages/${detail.id}`)} className="btn-primary w-full sm:w-auto px-6 py-2.5 rounded-xl shadow-md shadow-primary-500/20 flex items-center justify-center gap-2 hover:translate-y-[-1px] transition-all">
                        <MessageSquare className="h-4 w-4" /> Enter Live Chat
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-red-50 text-center"><AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-3" /><p className="text-sm font-medium text-gray-900 dark:text-white">No direct connection found.</p><p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">This support ticket is missing its threaded context.</p></div>
              )}
            </div>
          </div>
        );
      }

      case 'CUSTOM_TASK':
        return (
          <div className="card p-6 border-l-4 border-l-purple-500 bg-purple-50/10">
            <h3 className="text-xs font-black text-purple-600 uppercase tracking-widest mb-4 flex items-center gap-2"><PenTool className="h-4 w-4" /> Administrative Task Request</h3>
            {detail.custom_attachments && detail.custom_attachments.length > 0 && (
              <div className="space-y-3 mt-4">
                <p className="text-[10px] font-bold text-gray-500 uppercase">Attached Context</p>
                {detail.custom_attachments.map((att: any, i: number) => (
                  <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-bold text-primary-600 bg-primary-50 px-3 py-2 rounded-lg border border-primary-100 hover:bg-primary-100 transition-colors max-w-max"><ExternalLink className="h-3 w-3" /> External Link Reference</a>
                ))}
              </div>
            )}
          </div>
        );

      case 'CORPORATE_RIDE_VERIFICATION':
      case 'CORPORATE_ASSET_VERIFICATION':
        return (
          <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500 relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 rounded-[3rem] blur-3xl -z-10" />
            <div className="card p-8 bg-white/70 backdrop-blur-2xl border border-white shadow-xl shadow-indigo-900/5 relative overflow-hidden group hover:border-indigo-100/50 transition-all duration-500">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-100/30 to-purple-100/30 rounded-full blur-3xl -mr-32 -mt-32 transition-transform duration-700 group-hover:scale-110" />
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-12 w-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/30 flex items-center justify-center text-white transform group-hover:scale-105 transition-transform duration-300"><Briefcase className="h-5 w-5" /></div>
                  <div><h3 className="text-base font-black text-gray-900 tracking-tight">Corporate Entity Profile</h3><p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-0.5">Registration & Tax Details</p></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/60 rounded-2xl p-5 border border-white hover:bg-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 drop-shadow-sm">Registered Company Name</p><p className="text-sm font-black text-gray-900 tracking-tight">{detail.company_name || 'N/A'}</p></div>
                  <div className="bg-white/60 rounded-2xl p-5 border border-white hover:bg-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 drop-shadow-sm">Business Category</p><div className="inline-flex items-center px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-black uppercase ring-1 ring-indigo-100">{detail.business_category || 'N/A'}</div></div>
                  <div className="bg-white/60 rounded-2xl p-5 border border-white hover:bg-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 drop-shadow-sm">Registration Number</p><p className="text-sm font-bold text-gray-700 font-mono tracking-tight bg-gray-50/50 inline-block px-2 py-0.5 rounded border border-gray-100 dark:border-gray-800">{detail.registration_number || 'N/A'}</p></div>
                  <div className="bg-white/60 rounded-2xl p-5 border border-white hover:bg-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 drop-shadow-sm">Tax Identification (TIN)</p><p className="text-sm font-bold text-gray-700 font-mono tracking-tight bg-gray-50/50 inline-block px-2 py-0.5 rounded border border-gray-100 dark:border-gray-800">{detail.tax_id || 'N/A'}</p></div>
                  <div className="bg-white/60 rounded-2xl p-5 border border-white hover:bg-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 md:col-span-2 flex items-center justify-between group/contact">
                    <div><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 drop-shadow-sm">Primary Contact Email</p><p className="text-sm font-black text-gray-900 dark:text-white">{detail.user_email || 'N/A'}</p></div>
                    {detail.user_email && (<a href={`mailto:${detail.user_email}`} className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover/contact:bg-indigo-600 group-hover/contact:text-white transition-all shadow-sm ring-1 ring-indigo-100 group-hover/contact:ring-indigo-600"><ExternalLink className="h-4 w-4" /></a>)}
                  </div>
                </div>
              </div>
            </div>
            <div className="card p-8 border border-gray-100 shadow-xl shadow-gray-200/20 bg-white/90 backdrop-blur-md">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-gray-50 text-gray-600 rounded-2xl border border-gray-200 flex items-center justify-center shadow-inner"><FileText className="h-5 w-5" /></div>
                  <div><h3 className="text-base font-black text-gray-900 tracking-tight">Corporate Documents</h3><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{detail.verification_documents?.length || 0} Files Attached</p></div>
                </div>
                {detail.verification_documents && detail.verification_documents.length > 0 && (<span className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest rounded-full ring-1 ring-green-200">Documents Received</span>)}
              </div>
              {detail.verification_documents && detail.verification_documents.length > 0 ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {detail.verification_documents.map((doc: any, idx: number) => (
                    <a key={doc.id} href={getMediaUrl(doc.file)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 group">
                      <div className="h-12 w-12 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors border border-gray-100 dark:border-gray-800"><FileText className="h-5 w-5 text-gray-400 group-hover:text-indigo-500 transition-colors" /></div>
                      <div className="flex-1 min-w-0"><p className="text-sm font-black text-gray-900 dark:text-white truncate group-hover:text-indigo-900 transition-colors">{doc.name || `Document ${idx + 1}`}</p><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">{doc.document_type || 'Corporate File'}</p></div>
                      <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm border border-gray-100 group-hover:border-indigo-600"><ExternalLink className="h-3 w-3 text-gray-400 group-hover:text-white transition-colors" /></div>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-gray-50/50 rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-gray-700">
                  <div className="h-16 w-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-sm mb-4 border border-gray-100 dark:border-gray-800"><AlertCircle className="h-8 w-8 text-gray-300" /></div>
                  <h4 className="text-sm font-black text-gray-900 dark:text-white mb-1">No Documents Available</h4>
                  <p className="text-xs font-medium text-gray-500 max-w-[200px]">The user has not uploaded any required corporate files yet.</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'ASSET_AUDIT':
        return (
          <div className="card p-6 border-l-4 border-l-orange-500 bg-orange-50/10">
            <h3 className="text-xs font-black text-orange-600 uppercase tracking-widest mb-4 flex items-center gap-2"><Activity className="h-4 w-4" /> Physical Asset Audit</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div><p className="text-[10px] font-bold text-gray-500 uppercase">Target Asset Category</p><p className="text-sm font-black text-gray-900 dark:text-white">{detail.category || 'N/A'}</p></div>
              <div><p className="text-[10px] font-bold text-gray-500 uppercase">Owner Identification</p><p className="text-sm font-black text-gray-900 dark:text-white">{detail.owner?.first_name} {detail.owner?.last_name} ({detail.owner?.email})</p></div>
            </div>
            {detail.location && (
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 flex items-center gap-3"><Flag className="h-5 w-5 text-gray-400" /><div><p className="text-[10px] font-bold text-gray-500 uppercase mb-0.5">Reported Location</p><p className="text-xs font-bold text-gray-900 dark:text-white">{detail.location.address || 'Coordinates provided'}</p></div></div>
            )}
          </div>
        );

      case 'SUBSCRIPTION_VERIFICATION':
        return (
          <div className="card p-6 border-l-4 border-l-emerald-500 bg-emerald-50/10">
            <h3 className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2">
              <CreditCard className="h-4 w-4" /> Subscription Payment Verification
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase">Payment Amount</p>
                <p className="text-sm font-black text-emerald-600">
                  <Price amount={Number(detail.amount)} from={detail.currency || 'TZS'} />
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase">Payment Method</p>
                <p className="text-sm font-black text-gray-900 dark:text-white">{detail.payment_method_details?.network_name || 'Manual Transfer'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase">User / Account Info</p>
                <p className="text-sm font-black text-gray-900 dark:text-white">{detail.user_payment_method_details?.account_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase">Plan / Type</p>
                <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase mt-1 inline-block">{detail.booking_details?.plan_type || 'Upgrade Request'}</span>
              </div>
            </div>
            
            {(detail.transaction_id || detail.confirmation_message) && (
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 flex items-start gap-3 mb-4">
                <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase mb-0.5">Confirmation Message / TX ID</p>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-200">{detail.confirmation_message || detail.transaction_id || 'N/A'}</p>
                </div>
              </div>
            )}
            
            {detail.receipt_image && (
               <div className="mt-2">
                 <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Attached Receipt</p>
                 <a href={detail.receipt_image.includes('http') ? detail.receipt_image : getMediaUrl(detail.receipt_image)} target="_blank" rel="noopener noreferrer" className="inline-block relative rounded-xl overflow-hidden border-2 border-gray-100 hover:border-emerald-300 transition-colors group bg-white dark:bg-gray-800 p-2">
                   <img src={detail.receipt_image.includes('http') ? detail.receipt_image : getMediaUrl(detail.receipt_image)} alt="Receipt" className="h-32 object-contain" />
                   <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity flex-col gap-2">
                     <ExternalLink className="h-6 w-6 text-white" />
                     <span className="text-[10px] text-white font-bold uppercase tracking-wider">View Full</span>
                   </div>
                 </a>
               </div>
            )}
          </div>
        );

      default:
        return (
          <div className="card p-6 border-l-4 border-l-gray-300 bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center gap-2 mb-4"><AlertCircle className="h-4 w-4 text-gray-400" /><h3 className="text-xs font-black text-gray-600 uppercase tracking-widest">Unparsed Payload Data</h3></div>
            <pre className="text-[10px] font-mono bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 overflow-auto shadow-inner text-gray-600 dark:text-gray-300">{JSON.stringify(detail, null, 2)}</pre>
          </div>
        );
    }
  };

  // ═══════════════════════════════════════════════════════════
  // FILTERS & PROCESSING
  // ═══════════════════════════════════════════════════════════
  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;

  const filterOptions = [
    { id: 'ALL', label: 'All' },
    { id: 'PENDING', label: 'Pending' }
  ];
  if (isSuperRole || userRoles.includes('SUPPORT')) filterOptions.push({ id: 'SUPPORT_TICKET', label: 'Support' });
  if (isSuperRole || userRoles.includes('VERIFIER') || userRoles.includes('CAR_VERIFIER') || userRoles.includes('OPS')) filterOptions.push({ id: 'VEHICLE_VERIFICATION', label: 'Vehicles' });
  if (isSuperRole || userRoles.includes('VERIFIER') || userRoles.includes('IDENTITY_VERIFIER')) filterOptions.push({ id: 'IDENTITY_VERIFICATION', label: 'Identity' });
  if (isSuperRole || userRoles.includes('RIDE_BUSINESS_VERIFIER') || userRoles.includes('ASSET_BUSINESS_VERIFIER')) filterOptions.push({ id: 'CORPORATE_RIDE_VERIFICATION', label: 'Corporate' });
  if (isSuperRole) filterOptions.push({ id: 'SUBSCRIPTION_VERIFICATION', label: 'Subscriptions' });
  filterOptions.push({ id: 'CUSTOM_TASK', label: 'Custom' });

  const processedTasks = tasks.filter(t => {
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase()) && !t.task_type.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'PENDING') return t.status === 'PENDING';
    return t.task_type === activeFilter;
  });

  const selectTask = (task: any) => {
    setSelectedTask(task);
    setAssignTo(task.assigned_to || '');
    setAssignRole(task.assigned_role || '');
    setAssignPriority(task.priority || '');
    setProcessNotes('');
    setFeedbackAttachment('');
    if (!isSuperRole) setIsReviewMode(true);
  };

  const getStatusConfig = (status: string) => {
    const c: Record<string, { color: string; bg: string; icon: any }> = {
      PENDING: { color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', icon: <Clock className="h-3 w-3" /> },
      ASSIGNED: { color: 'text-primary-600', bg: 'bg-primary-50 dark:bg-primary-900/20 border-primary-200', icon: <UserPlus className="h-3 w-3" /> },
      IN_PROGRESS: { color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200', icon: <Activity className="h-3 w-3" /> },
      COMPLETED: { color: 'text-green-600', bg: 'bg-green-50 border-green-200', icon: <CheckCircle className="h-3 w-3" /> },
      REJECTED: { color: 'text-red-600', bg: 'bg-red-50 border-red-200', icon: <XCircle className="h-3 w-3" /> },
      CHANGES_REQUESTED: { color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200', icon: <RotateCcw className="h-3 w-3" /> },
      CANCELLED: { color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-900 border-gray-200', icon: <X className="h-3 w-3" /> },
    };
    return c[status] || c.PENDING;
  };

  const timeAgo = (date: string) => {
    const d = Date.now() - new Date(date).getTime();
    const m = Math.floor(d / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  const pendingCount = tasks.filter(t => t.status === 'PENDING').length;
  const assignedCount = tasks.filter(t => t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS').length;
  const completedCount = tasks.filter(t => t.status === 'COMPLETED').length;
  const rejectedCount = tasks.filter(t => t.status === 'REJECTED').length;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className={`bg-gradient-to-r ${roleConfig.accent} text-white rounded-2xl p-6 shadow-lg relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full blur-3xl -mr-36 -mt-36" />
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur border border-white/20">{roleConfig.icon}</div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">{roleConfig.title}</h1>
              <p className="text-white/60 text-sm font-medium">{roleConfig.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-bold px-3 py-1.5 rounded-lg border bg-amber-400/20 text-amber-200 border-amber-400/30 flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />{pendingCount} Pending</span>
            <span className="text-xs font-bold px-3 py-1.5 rounded-lg border bg-primary-400/20 text-primary-200 border-primary-400/30">{assignedCount} Active</span>
            <span className="text-xs font-bold px-3 py-1.5 rounded-lg border bg-green-400/20 text-green-200 border-green-400/30">{completedCount} Done</span>
            <span className="text-xs font-bold px-3 py-1.5 rounded-lg border bg-red-400/20 text-red-200 border-red-400/30">{rejectedCount} Rejected</span>
            <span className="text-xs font-black text-white/30 bg-white/10 px-2 py-1 rounded border border-white/10">{roleConfig.label}</span>
          </div>
        </div>
      </div>

      {/* TAB BAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-200 gap-2 sm:gap-0 pb-2 sm:pb-0">
        <div className="flex overflow-x-auto w-full no-scrollbar">
          {dashboardTabs.map(tab => (
            <button key={tab.id} onClick={() => handleTabChange(tab.id)} className={`whitespace-nowrap flex-shrink-0 flex items-center gap-2 px-5 py-3.5 text-sm font-bold transition-all relative ${activeTab === tab.id ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}>
              {tab.icon} {tab.label}
              {activeTab === tab.id && <div className="absolute bottom-0 inset-x-2 h-0.5 bg-primary-600 rounded-full" />}
            </button>
          ))}
        </div>
        {isSuperRole && <div className="px-2 sm:px-0 pb-2 sm:pb-0"><button onClick={() => setIsCreateModalOpen(true)} className="flex-shrink-0 flex items-center gap-2 px-4 py-2 text-sm font-bold text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-xl transition-colors border border-primary-100"><Plus className="h-4 w-4" /> New Task</button></div>}
      </div>

      {/* CONTENT */}
      {activeTab === 'analytics' ? <AnalyticsPanel analytics={analytics} /> : isReviewMode && selectedTask ? (
        /* REVIEW MODE — full width */
        <div className="animate-in slide-in-from-bottom-4 duration-500 fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-gray-800 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] max-h-[85vh] overflow-y-auto md:relative md:shadow-none md:rounded-none md:bg-transparent p-4 md:p-0">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => setIsReviewMode(false)} className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-primary-600 transition-colors"><ArrowLeft className="h-4 w-4" /> <span className="hidden md:inline">Back to Queue</span><span className="md:inline md:hidden">Back</span></button>
            <button onClick={() => setIsReviewMode(false)} className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-full"><X className="h-5 w-5" /></button>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              <div className="card p-6">
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center flex-shrink-0">{getTaskIcon(selectedTask.task_type)}</div>
                  <div className="flex-1">
                    <p className="text-xs font-black text-primary-600 uppercase tracking-widest mb-1">{selectedTask.task_type.replace(/_/g, ' ')}</p>
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">{selectedTask.title}</h2>
                    {selectedTask.description && <p className="text-sm text-gray-600 mt-2">{selectedTask.description}</p>}
                    <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100 flex-wrap">
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full border ${getStatusConfig(selectedTask.status).bg} ${getStatusConfig(selectedTask.status).color}`}>{getStatusConfig(selectedTask.status).icon} {selectedTask.status}</span>
                      <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{selectedTask.priority}</span>
                      <span className="text-xs text-gray-400">{timeAgo(selectedTask.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
              {renderResourceDetails(selectedTask)}
            </div>
            <div className="sticky top-6 space-y-4">
              {selectedTask.task_type === 'CUSTOM_TASK' && !isSuperRole && !['COMPLETED', 'REJECTED'].includes(selectedTask.status) ? (
                <div className="card p-6 bg-gray-900 text-white border-gray-800">
                  <h3 className="text-sm font-black mb-4 flex items-center gap-2"><PenTool className="h-4 w-4 text-indigo-400" /> Completion Report</h3>
                  <div className="space-y-4">
                    <textarea className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none min-h-[120px] placeholder:text-gray-600 dark:text-gray-300" placeholder="Describe what was done..." value={processNotes} onChange={e => setProcessNotes(e.target.value)} />
                    <input type="url" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none placeholder:text-gray-600 dark:text-gray-300" placeholder="Attachment URL (optional)" value={feedbackAttachment} onChange={e => setFeedbackAttachment(e.target.value)} />
                    <button onClick={() => handleProcessTask('SUBMIT_COMPLETION')} disabled={isProcessing || !processNotes} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-black rounded-xl"><CheckCircle className="h-4 w-4 inline mr-2" />Submit</button>
                  </div>
                </div>
              ) : (
                <div className="card p-6 bg-gray-900 text-white border-gray-800">
                  {selectedTask.task_type === 'CUSTOM_TASK' && selectedTask.extra_data?.completion_feedback && (
                    <div className="bg-indigo-900/30 rounded-xl p-4 mb-4 border border-indigo-500/20">
                      <p className="text-xs font-bold text-indigo-400 uppercase mb-2">Staff Feedback</p>
                      <p className="text-sm text-gray-300">{selectedTask.extra_data.completion_feedback}</p>
                      {selectedTask.extra_data.completion_attachment && <a href={selectedTask.extra_data.completion_attachment} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 hover:underline mt-2 inline-flex items-center gap-1"><ExternalLink className="h-3 w-3" /> Attachment</a>}
                    </div>
                  )}
                  <h3 className="text-sm font-black mb-4 flex items-center gap-2"><Shield className="h-4 w-4 text-primary-400" /> Decision</h3>
                  <textarea className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none min-h-[100px] placeholder:text-gray-600 mb-4" placeholder="Notes..." value={processNotes} onChange={e => setProcessNotes(e.target.value)} />
                  {['COMPLETED', 'REJECTED'].includes(selectedTask.status) ? (
                    <button onClick={() => handleProcessTask('REVOKE')} disabled={isProcessing} className="w-full py-3 bg-orange-900/50 text-orange-400 border border-orange-500/30 font-black rounded-xl"><RotateCcw className="h-4 w-4 inline mr-2" />Revoke & Reopen</button>
                  ) : (
                    <div className="space-y-2">
                      <button onClick={() => handleProcessTask('APPROVE')} disabled={isProcessing} className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-black rounded-xl"><ThumbsUp className="h-4 w-4 inline mr-2" />Approve</button>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => handleProcessTask('REJECT')} disabled={isProcessing} className="py-2.5 bg-white/5 text-red-400 border border-white/10 font-black rounded-xl text-sm">Reject</button>
                        <button onClick={() => handleProcessTask('REQUEST_CHANGES')} disabled={isProcessing} className="py-2.5 bg-white/5 text-orange-400 border border-white/10 font-black rounded-xl text-sm">Re-evaluate</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* TASK QUEUE — full-width cards */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="text" placeholder="Search tasks..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 focus:border-primary-300 focus:ring-2 focus:ring-primary-100 focus:outline-none text-sm" />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
              {selectedTasks.length > 0 && (
                <button onClick={handleBatchApprove} disabled={isProcessing} className="px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all border bg-primary-600 text-white border-primary-600 hover:bg-primary-700 flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" /> Approve ({selectedTasks.length})
                </button>
              )}
              {filterOptions.map(opt => (
                <button key={opt.id} onClick={() => setActiveFilter(opt.id)} className={`px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${activeFilter === opt.id ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>{opt.label}</button>
              ))}
            </div>
          </div>

          {processedTasks.length === 0 ? (
            <div className="py-20 text-center card"><Layers className="h-12 w-12 text-gray-200 mx-auto mb-4" /><p className="text-base font-bold text-gray-400">Queue Empty</p><p className="text-sm text-gray-400 mt-1">No tasks match your filters</p></div>
          ) : (
            <div className="space-y-8">
              {(Object.entries(processedTasks.reduce((acc, task) => {
                const type = task.task_type;
                if (!acc[type]) acc[type] = [];
                acc[type].push(task);
                return acc;
              }, {} as Record<string, any[]>)) as [string, any[]][]).map(([type, groupTasks]) => (
                <div key={type} className="space-y-4">
                  <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest border-b border-gray-100 pb-2 flex items-center gap-2">
                    {type.replace(/_/g, ' ')} <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{groupTasks.length}</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {groupTasks.map((task: any) => {
                      const sc = getStatusConfig(task.status);
                      const done = ['COMPLETED', 'REJECTED'].includes(task.status);
                      const isUrgentUnread = task.priority === 'URGENT' && task.status === 'PENDING';
                      return (
                        <div key={task.id} className={`relative text-left card p-5 transition-all group hover:shadow-lg hover:-translate-y-0.5 ${selectedTask?.id === task.id ? 'ring-2 ring-primary-500 border-primary-200' : ''} ${isUrgentUnread ? 'border-2 border-red-500' : ''} ${done ? 'opacity-60' : ''}`}>
                          {!done && (
                            <button onClick={(e) => {
                              e.stopPropagation();
                              if (taskStatuses[task.id]) return; // disable toggle during processing
                              setSelectedTasks(prev => prev.includes(task.id) ? prev.filter(id => id !== task.id) : [...prev, task.id]);
                            }} className="absolute top-4 right-4 z-10 p-1">
                              <div className={`h-5 w-5 rounded flex items-center justify-center transition-colors ${selectedTasks.includes(task.id) || taskStatuses[task.id] ? 'bg-primary-600 border border-primary-600' : 'bg-white dark:bg-gray-800 border border-gray-300 group-hover:border-primary-400'}`}>
                                 {taskStatuses[task.id] === 'pending' ? <RotateCcw className="h-3 w-3 text-white animate-spin" /> : 
                                  taskStatuses[task.id] === 'success' ? <CheckCircle className="h-4 w-4 text-white" /> :
                                  taskStatuses[task.id] === 'error' ? <XCircle className="h-4 w-4 text-white" /> :
                                  selectedTasks.includes(task.id) && <CheckSquare className="h-4 w-4 text-white" />}
                              </div>
                            </button>
                          )}
                          <div onClick={() => selectTask(task)} className="cursor-pointer h-full flex flex-col">
                            <div className="flex items-start justify-between mb-3 pr-8">
                              <div className="flex items-center gap-3">
                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${done ? 'bg-gray-100 text-gray-400' : 'bg-primary-50 text-primary-600'}`}>{getTaskIcon(task.task_type)}</div>
                                <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${sc.bg} ${sc.color}`}>{sc.icon} {task.status === 'CHANGES_REQUESTED' ? 'CHANGES' : task.status}</span>
                              </div>
                              {task.priority === 'URGENT' && <span className="text-[10px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200 animate-pulse">URGENT</span>}
                              {task.priority === 'HIGH' && <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">HIGH</span>}
                            </div>
                            <h3 className={`text-sm font-bold leading-snug mb-2 group-hover:text-primary-600 transition-colors ${done ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{task.title}</h3>
                            <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100 dark:border-gray-800">
                              <span className="text-[10px] font-bold text-gray-400 uppercase">{task.task_type.replace(/_/g, ' ')}</span>
                              <div className="flex items-center gap-2">
                                {task.assigned_to_email && <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">{task.assigned_to_email.split('@')[0]}</span>}
                                <span className="text-[10px] text-gray-400">{timeAgo(task.created_at)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SELECTED TASK DETAIL (super admin — expands below grid) */}
      {selectedTask && !isReviewMode && isSuperRole && (
        <div className="card p-0 overflow-hidden border-t-4 border-t-primary-600 animate-in slide-in-from-bottom-4 duration-500">
          <div className="p-6 bg-gray-900 text-white">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-primary-600 rounded-2xl flex items-center justify-center text-white shadow-lg">{getTaskIcon(selectedTask.task_type)}</div>
                <div>
                  <p className="text-xs font-black text-primary-400 uppercase tracking-widest mb-1">{selectedTask.task_type.replace(/_/g, ' ')}</p>
                  <h2 className="text-xl font-black tracking-tight">{selectedTask.title}</h2>
                  {selectedTask.description && <p className="text-sm text-gray-400 mt-1">{selectedTask.description}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setSelectedTask(null)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl"><X className="h-4 w-4" /></button>
                <button onClick={handleDeleteTask} className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-xl"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4 flex-wrap">
              <span className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full border ${getStatusConfig(selectedTask.status).bg} ${getStatusConfig(selectedTask.status).color}`}>{getStatusConfig(selectedTask.status).icon} {selectedTask.status}</span>
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{selectedTask.priority}</span>
              <span className="text-xs text-gray-400">{timeAgo(selectedTask.created_at)}</span>
              {selectedTask.assigned_to_email && <span className="text-xs font-bold text-primary-400">→ {selectedTask.assigned_to_email}</span>}
            </div>
          </div>
          <div className="p-5 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2"><UserPlus className="h-4 w-4 text-primary-600" /> Assignment</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div><label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Person</label><select className="w-full rounded-xl border-gray-200 text-sm h-10 px-3" value={assignTo} onChange={e => setAssignTo(e.target.value)}><option value="">Unassigned</option>{staffUsers.map(u => <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>)}</select></div>
              <div><label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Role</label><select className="w-full rounded-xl border-gray-200 text-sm h-10 px-3" value={assignRole} onChange={e => setAssignRole(e.target.value)}><option value="">Open</option><option value="VERIFIER">Verifier</option><option value="CAR_VERIFIER">Car Verifier</option><option value="RIDE_BUSINESS_VERIFIER">Ride Biz</option><option value="ASSET_BUSINESS_VERIFIER">Asset Biz</option><option value="OPS">Ops</option><option value="SUPPORT">Support</option><option value="SUPER_ADMIN">Super Admin</option></select></div>
              <div><label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Priority</label><select className="w-full rounded-xl border-gray-200 text-sm h-10 px-3" value={assignPriority} onChange={e => setAssignPriority(e.target.value)}><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="URGENT">Urgent</option></select></div>
              <button onClick={handleAssignTask} disabled={isProcessing} className="btn-primary h-10 flex items-center justify-center gap-2 rounded-xl">{isProcessing ? <RotateCcw className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Save</>}</button>
            </div>
          </div>
          <div className="p-6">{renderResourceDetails(selectedTask)}</div>
          <div className="p-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2"><Shield className="h-4 w-4 text-primary-600" /> Review Decision</h3>
            {selectedTask.task_type === 'CUSTOM_TASK' && selectedTask.extra_data?.completion_feedback && (
              <div className="card p-4 bg-indigo-50 border-indigo-100 mb-4">
                <p className="text-xs font-bold text-indigo-600 uppercase mb-2">Staff Feedback</p>
                <p className="text-sm text-gray-700 dark:text-gray-200">{selectedTask.extra_data.completion_feedback}</p>
                {selectedTask.extra_data.completion_attachment && <a href={selectedTask.extra_data.completion_attachment} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline mt-2 inline-flex items-center gap-1"><ExternalLink className="h-3 w-3" /> Attachment</a>}
              </div>
            )}
            <textarea className="w-full rounded-xl border-gray-200 p-4 text-sm min-h-[80px] focus:ring-2 focus:ring-primary-100 focus:border-primary-300 focus:outline-none mb-4" placeholder="Decision notes..." value={processNotes} onChange={e => setProcessNotes(e.target.value)} />
            {['COMPLETED', 'REJECTED'].includes(selectedTask.status) ? (
              <div className="space-y-3">
                <div className="card p-4 bg-gray-50 flex items-center gap-3">{selectedTask.status === 'COMPLETED' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />}<div><p className="text-sm font-bold text-gray-900 dark:text-white">{selectedTask.status}</p><p className="text-xs text-gray-500 italic">"{selectedTask.reviewer_notes || 'No notes.'}"</p></div></div>
                <button onClick={() => handleProcessTask('REVOKE')} disabled={isProcessing} className="w-full py-3 bg-orange-50 text-orange-600 border border-orange-200 font-black rounded-xl hover:bg-orange-100 flex items-center justify-center gap-2"><RotateCcw className="h-4 w-4" /> Revoke & Reopen</button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                <button onClick={() => handleProcessTask('APPROVE')} disabled={isProcessing} className="py-3 bg-green-600 hover:bg-green-700 text-white font-black rounded-xl flex items-center justify-center gap-2"><ThumbsUp className="h-4 w-4" /> Approve</button>
                <button onClick={() => handleProcessTask('REJECT')} disabled={isProcessing} className="py-3 bg-white text-red-600 border border-red-200 font-black rounded-xl hover:bg-red-50 flex items-center justify-center gap-2"><ThumbsDown className="h-4 w-4" /> Reject</button>
                <button onClick={() => handleProcessTask('REQUEST_CHANGES')} disabled={isProcessing} className="py-3 bg-white text-orange-600 border border-orange-200 font-black rounded-xl hover:bg-orange-50 flex items-center justify-center gap-2"><RotateCcw className="h-4 w-4" /> Re-evaluate</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center gap-3"><div className="h-10 w-10 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center"><PenTool className="h-5 w-5" /></div><div><h2 className="text-lg font-black text-gray-900 dark:text-white">Create Custom Task</h2><p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Assign work to your team</p></div></div>
              <button onClick={() => setIsCreateModalOpen(false)} className="h-9 w-9 flex items-center justify-center rounded-xl bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-700"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <form id="create-task-form" onSubmit={handleCreateCustomTask} className="space-y-5">
                <div><label className="text-xs font-bold text-gray-500 uppercase block mb-2">Title <span className="text-red-500">*</span></label><input type="text" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} className="w-full rounded-xl border-gray-200 font-bold text-sm py-3 px-4 focus:ring-2 focus:ring-primary-100 focus:border-primary-300 focus:outline-none" placeholder="E.g., Investigate Report #1024" required /></div>
                <div><label className="text-xs font-bold text-gray-500 uppercase block mb-2">Instructions</label><textarea value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })} className="w-full rounded-xl border-gray-200 text-sm py-3 px-4 min-h-[120px] focus:ring-2 focus:ring-primary-100 focus:border-primary-300 focus:outline-none" placeholder="Context..." /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs font-bold text-gray-500 uppercase block mb-2">Priority</label><select value={newTask.priority} onChange={e => setNewTask({ ...newTask, priority: e.target.value })} className="w-full rounded-xl border-gray-200 font-bold text-sm h-12 px-3"><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="URGENT">Urgent</option></select></div>
                  <div><label className="text-xs font-bold text-gray-500 uppercase block mb-2">Link</label><input type="url" value={newTask.attachments} onChange={e => setNewTask({ ...newTask, attachments: e.target.value })} className="w-full rounded-xl border-gray-200 text-sm h-12 px-3" placeholder="https://..." /></div>
                </div>
                <div className="p-5 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 space-y-4">
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2"><UserPlus className="h-3.5 w-3.5 text-primary-600" /> Assignment</h4>
                  <div className="flex gap-3 mb-3">
                    <button type="button" onClick={() => setNewTask({ ...newTask, assignType: 'person' })} className={`flex-1 py-2 rounded-lg text-sm font-bold ${newTask.assignType === 'person' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Person</button>
                    <button type="button" onClick={() => setNewTask({ ...newTask, assignType: 'role' })} className={`flex-1 py-2 rounded-lg text-sm font-bold ${newTask.assignType === 'role' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Role</button>
                  </div>
                  {newTask.assignType === 'person' ? (
                    <select value={newTask.assigned_to} onChange={e => setNewTask({ ...newTask, assigned_to: e.target.value })} className="w-full rounded-xl border-gray-200 font-bold text-sm h-10 px-3"><option value="">Unassigned</option>{staffUsers.map(u => <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>)}</select>
                  ) : (
                    <select value={newTask.assigned_role} onChange={e => setNewTask({ ...newTask, assigned_role: e.target.value })} className="w-full rounded-xl border-gray-200 font-bold text-sm h-10 px-3"><option value="">Any</option><option value="VERIFIER">Verifier</option><option value="CAR_VERIFIER">Car Verifier</option><option value="RIDE_BUSINESS_VERIFIER">Ride Biz</option><option value="ASSET_BUSINESS_VERIFIER">Asset Biz</option><option value="OPS">Ops</option><option value="SUPPORT">Support</option></select>
                  )}
                </div>
              </form>
            </div>
            <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setIsCreateModalOpen(false)} className="px-5 py-2.5 font-bold text-sm text-gray-600 hover:bg-gray-200 dark:bg-gray-700 rounded-xl">Cancel</button>
              <button type="submit" form="create-task-form" disabled={isProcessing || !newTask.title} className="btn-primary px-6 py-2.5 rounded-xl shadow-lg disabled:opacity-50 flex items-center gap-2">{isProcessing ? <RotateCcw className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Create Task</>}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
