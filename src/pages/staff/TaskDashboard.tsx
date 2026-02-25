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
  Plus, X, PenTool
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
    if (userRoles.includes('RIDE_BUSINESS_VERIFIER')) return { title: 'Ride Business Verification', subtitle: 'Corporate Transport Review', icon: <Briefcase className="h-6 w-6" />, label: 'Ride Business Verifier' };
    if (userRoles.includes('ASSET_BUSINESS_VERIFIER')) return { title: 'Asset Business Verification', subtitle: 'Corporate Real Estate Review', icon: <Briefcase className="h-6 w-6" />, label: 'Asset Business Verifier' };
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
  const [feedbackAttachment, setFeedbackAttachment] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [staffUsers, setStaffUsers] = useState<any[]>([]);

  // Assignment state
  const [assignTo, setAssignTo] = useState('');
  const [assignRole, setAssignRole] = useState('');
  const [assignPriority, setAssignPriority] = useState('');

  // Custom Task Creation State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'MEDIUM', assigned_to: '', assigned_role: '', attachments: '', assignType: 'person' });
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

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

      case 'SUPPORT_TICKET':
      case 'DISPUTE_RESOLUTION':
        // Determine the client user (who is not the current admin user)
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
          <div className="card p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                {detail.id ? 'Live Support Connection' : 'Support Request'}
              </h3>
              {detail.message_count !== undefined && (
                <span className="text-xs font-bold text-blue-600 bg-blue-100/50 px-2 py-1 rounded border border-blue-200">
                  {detail.message_count} Message{detail.message_count !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div className="space-y-6">
              {detail.id ? (
                // This is a Thread/Feedback object mapped natively
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-blue-100">
                  <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg border-2 border-white shadow-sm">
                      {clientInitial}
                    </div>
                    <div>
                      <h4 className="text-base font-black text-gray-900 leading-tight">
                        {clientName}
                      </h4>
                      <p className="text-xs font-medium text-gray-500 mt-0.5">
                        {clientUser?.email || detail.user_email || task.created_by_email}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
                    <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>Subject: {detail.subject || 'Support Request'}</span>
                      {detail.last_message && (
                        <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-gray-200">Latest</span>
                      )}
                    </h5>
                    <p className="text-sm font-medium text-gray-700 italic border-l-2 border-primary-200 pl-3 py-1">
                      "{detail.last_message?.content || detail.message || 'No messages yet.'}"
                    </p>
                    {detail.last_message && (
                      <p className="text-[10px] text-gray-400 mt-3 text-right font-medium pr-1">
                        {new Date(detail.last_message.created_at).toLocaleString()}
                      </p>
                    )}
                  </div>

                  {detail.is_resolved !== undefined ? (
                    // Feedback Form
                    <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 rounded-xl text-sm font-bold text-blue-800 border border-blue-100">
                      <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />
                      Feedback form submitted — please reach out via email.
                    </div>
                  ) : (
                    // Messaging Thread
                    <div className="flex items-center justify-end mt-4">
                      <button
                        onClick={() => navigate(`/messages/${detail.id}`)}
                        className="btn-primary w-full sm:w-auto px-6 py-2.5 rounded-xl shadow-md shadow-primary-500/20 flex items-center justify-center gap-2 hover:translate-y-[-1px] transition-all"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Enter Live Chat
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-red-50 text-center">
                  <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-900">No direct connection found.</p>
                  <p className="text-xs text-gray-500 mt-1 italic">This support ticket is missing its threaded context.</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'CUSTOM_TASK':
        return (
          <div className="card p-6 border-l-4 border-l-purple-500 bg-purple-50/10">
            <h3 className="text-xs font-black text-purple-600 uppercase tracking-widest mb-4 flex items-center gap-2">
              <PenTool className="h-4 w-4" /> Administrative Task Request
            </h3>
            {detail.custom_attachments && detail.custom_attachments.length > 0 && (
              <div className="space-y-3 mt-4">
                <p className="text-[10px] font-bold text-gray-500 uppercase">Attached Context</p>
                {detail.custom_attachments.map((att: any, i: number) => (
                  <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-bold text-primary-600 bg-primary-50 px-3 py-2 rounded-lg border border-primary-100 hover:bg-primary-100 transition-colors max-w-max">
                    <ExternalLink className="h-3 w-3" /> External Link Reference
                  </a>
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
                  <div className="h-12 w-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/30 flex items-center justify-center text-white transform group-hover:scale-105 transition-transform duration-300">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-gray-900 tracking-tight">Corporate Entity Profile</h3>
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-0.5">Registration & Tax Details</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/60 rounded-2xl p-5 border border-white hover:bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 drop-shadow-sm">Registered Company Name</p>
                    <p className="text-sm font-black text-gray-900 tracking-tight">{detail.company_name || 'N/A'}</p>
                  </div>
                  <div className="bg-white/60 rounded-2xl p-5 border border-white hover:bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 drop-shadow-sm">Business Category</p>
                    <div className="inline-flex items-center px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-black uppercase ring-1 ring-indigo-100">{detail.business_category || 'N/A'}</div>
                  </div>
                  <div className="bg-white/60 rounded-2xl p-5 border border-white hover:bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 drop-shadow-sm">Registration Number</p>
                    <p className="text-sm font-bold text-gray-700 font-mono tracking-tight bg-gray-50/50 inline-block px-2 py-0.5 rounded border border-gray-100">{detail.registration_number || 'N/A'}</p>
                  </div>
                  <div className="bg-white/60 rounded-2xl p-5 border border-white hover:bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 drop-shadow-sm">Tax Identification (TIN)</p>
                    <p className="text-sm font-bold text-gray-700 font-mono tracking-tight bg-gray-50/50 inline-block px-2 py-0.5 rounded border border-gray-100">{detail.tax_id || 'N/A'}</p>
                  </div>
                  <div className="bg-white/60 rounded-2xl p-5 border border-white hover:bg-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 md:col-span-2 flex items-center justify-between group/contact">
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 drop-shadow-sm">Primary Contact Email</p>
                      <p className="text-sm font-black text-gray-900">{detail.user_email || 'N/A'}</p>
                    </div>
                    {detail.user_email && (
                      <a href={`mailto:${detail.user_email}`} className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover/contact:bg-indigo-600 group-hover/contact:text-white transition-all shadow-sm ring-1 ring-indigo-100 group-hover/contact:ring-indigo-600">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-8 border border-gray-100 shadow-xl shadow-gray-200/20 bg-white/90 backdrop-blur-md">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-gray-50 text-gray-600 rounded-2xl border border-gray-200 flex items-center justify-center shadow-inner">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-gray-900 tracking-tight">Corporate Documents</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{detail.verification_documents?.length || 0} Files Attached</p>
                  </div>
                </div>
                {detail.verification_documents && detail.verification_documents.length > 0 && (
                  <span className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest rounded-full ring-1 ring-green-200">Documents Received</span>
                )}
              </div>

              {detail.verification_documents && detail.verification_documents.length > 0 ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {detail.verification_documents.map((doc: any, idx: number) => (
                    <a key={doc.id} href={getMediaUrl(doc.file)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 group">
                      <div className="h-12 w-12 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors border border-gray-100">
                        <FileText className="h-5 w-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-gray-900 truncate group-hover:text-indigo-900 transition-colors">{doc.name || `Document ${idx + 1}`}</p>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">{doc.document_type || 'Corporate File'}</p>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm border border-gray-100 group-hover:border-indigo-600">
                        <ExternalLink className="h-3 w-3 text-gray-400 group-hover:text-white transition-colors" />
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-gray-50/50 rounded-[2rem] border-2 border-dashed border-gray-200">
                  <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 border border-gray-100">
                    <AlertCircle className="h-8 w-8 text-gray-300" />
                  </div>
                  <h4 className="text-sm font-black text-gray-900 mb-1">No Documents Available</h4>
                  <p className="text-xs font-medium text-gray-500 max-w-[200px]">The user has not uploaded any required corporate files yet.</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'ASSET_AUDIT':
        return (
          <div className="card p-6 border-l-4 border-l-orange-500 bg-orange-50/10">
            <h3 className="text-xs font-black text-orange-600 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4" /> Physical Asset Audit
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div><p className="text-[10px] font-bold text-gray-500 uppercase">Target Asset Category</p><p className="text-sm font-black text-gray-900">{detail.category || 'N/A'}</p></div>
              <div><p className="text-[10px] font-bold text-gray-500 uppercase">Owner Identification</p><p className="text-sm font-black text-gray-900">{detail.owner?.first_name} {detail.owner?.last_name} ({detail.owner?.email})</p></div>
            </div>

            {detail.location && (
              <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-3">
                <Flag className="h-5 w-5 text-gray-400" />
                <div><p className="text-[10px] font-bold text-gray-500 uppercase mb-0.5">Reported Location</p><p className="text-xs font-bold text-gray-900">{detail.location.address || 'Coordinates provided'}</p></div>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="card p-6 border-l-4 border-l-gray-300 bg-gray-50">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="h-4 w-4 text-gray-400" />
              <h3 className="text-xs font-black text-gray-600 uppercase tracking-widest">Unparsed Payload Data</h3>
            </div>
            <pre className="text-[10px] font-mono bg-white p-4 rounded-xl border border-gray-200 overflow-auto shadow-inner text-gray-600">{JSON.stringify(detail, null, 2)}</pre>
          </div>
        );
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

  const filterOptions = [
    { id: 'ALL', label: 'All' },
    { id: 'PENDING', label: 'Pending' }
  ];

  if (isSuperRole || userRoles.includes('SUPPORT')) {
    filterOptions.push({ id: 'SUPPORT_TICKET', label: 'Support' });
  }

  if (isSuperRole || userRoles.includes('VERIFIER') || userRoles.includes('CAR_VERIFIER') || userRoles.includes('OPS')) {
    filterOptions.push({ id: 'VEHICLE_VERIFICATION', label: 'Vehicles' });
  }

  if (isSuperRole || userRoles.includes('VERIFIER') || userRoles.includes('IDENTITY_VERIFIER')) {
    filterOptions.push({ id: 'IDENTITY_VERIFICATION', label: 'Identity' });
  }

  if (isSuperRole || userRoles.includes('RIDE_BUSINESS_VERIFIER') || userRoles.includes('ASSET_BUSINESS_VERIFIER')) {
    filterOptions.push({ id: 'CORPORATE_RIDE_VERIFICATION', label: 'Corporate' });
  }

  filterOptions.push({ id: 'CUSTOM_TASK', label: 'Custom' });

  const processedTasks = tasks.filter(t => {
    // 1. Filter by text search
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase()) && !t.task_type.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    // 2. Filter by pill
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'PENDING') return t.status === 'PENDING';
    return t.task_type === activeFilter;
  });

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
                {selectedTask.task_type === 'CUSTOM_TASK' && !isSuperRole && !['COMPLETED', 'REJECTED'].includes(selectedTask.status) ? (
                  <div className="card p-8 bg-indigo-950 text-white border-none shadow-2xl shadow-indigo-900/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600 rounded-full blur-3xl -mr-16 -mt-16 opacity-30" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-6">
                        <PenTool className="h-5 w-5 text-indigo-400" />
                        <h3 className="text-lg font-black tracking-tight">Task Completion Report</h3>
                      </div>
                      <div className="space-y-6">
                        <div>
                          <label className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-3 block">Summary of Work Done</label>
                          <textarea className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[120px] placeholder:text-indigo-200/50" placeholder="Detail what actions were taken..." value={processNotes} onChange={(e) => setProcessNotes(e.target.value)} />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-3 block">Attachment Link &lt;span className="text-xs lowercase normal-case italic font-normal"&gt;(Optional)&lt;/span&gt;</label>
                          <input type="url" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-indigo-200/50" placeholder="https://..." value={feedbackAttachment} onChange={(e) => setFeedbackAttachment(e.target.value)} />
                        </div>
                        <button onClick={() => handleProcessTask('SUBMIT_COMPLETION')} disabled={isProcessing || !processNotes} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black rounded-2xl shadow-lg shadow-indigo-900/50 transition-all flex items-center justify-center gap-2">
                          <CheckCircle className="h-4 w-4" /> Submit Task Assignment
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {selectedTask.task_type === 'CUSTOM_TASK' && selectedTask.extra_data?.completion_feedback && (
                      <div className="card p-6 bg-indigo-50 border-l-4 border-l-indigo-500 shadow-sm animate-in fade-in duration-500">
                        <div className="flex items-center gap-2 mb-4">
                          <MessageSquare className="h-4 w-4 text-indigo-600" />
                          <h3 className="text-xs font-black text-indigo-900 uppercase tracking-widest">Staff Completion Feedback</h3>
                        </div>
                        <p className="text-sm font-medium text-gray-700 leading-relaxed mb-4">{selectedTask.extra_data.completion_feedback}</p>
                        {selectedTask.extra_data.completion_attachment && (
                          <a href={selectedTask.extra_data.completion_attachment} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs font-black text-indigo-600 bg-white px-4 py-2 rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-colors shadow-sm">
                            <ExternalLink className="h-3 w-3" /> View Attached Source
                          </a>
                        )}
                      </div>
                    )}

                    <div className="card p-8 bg-gray-900 text-white border-none shadow-2xl shadow-gray-200">
                      <div className="flex items-center gap-2 mb-6"><Shield className="h-5 w-5 text-primary-400" /><h3 className="text-lg font-black tracking-tight">Final Decision</h3></div>
                      <div className="space-y-6">
                        <div><label htmlFor="processNotesSuper" className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Official Reviewer Notes</label><textarea id="processNotesSuper" name="processNotesSuper" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-primary-500 focus:outline-none min-h-[150px] placeholder:text-gray-600" placeholder="Provide detailed feedback..." value={processNotes} onChange={(e) => setProcessNotes(e.target.value)} /></div>
                        {selectedTask.status === 'COMPLETED' || selectedTask.status === 'REJECTED' ? (
                          <button onClick={() => handleProcessTask('REVOKE')} disabled={isProcessing} className="w-full py-4 bg-orange-900/50 hover:bg-orange-800/50 text-orange-400 border border-orange-500/30 font-black rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"><RotateCcw className="h-4 w-4" /> Revoke & Reopen Case</button>
                        ) : (
                          <div className="space-y-3"><button onClick={() => handleProcessTask('APPROVE')} disabled={isProcessing} className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-lg transition-all">Confirm & Approve</button><div className="grid grid-cols-2 gap-3"><button onClick={() => handleProcessTask('REJECT')} disabled={isProcessing} className="py-3 bg-white/5 hover:bg-red-950/30 text-red-400 border border-white/10 font-black rounded-xl transition-all">Reject</button><button onClick={() => handleProcessTask('REQUEST_CHANGES')} disabled={isProcessing} className="py-3 bg-white/5 hover:bg-orange-950/30 text-orange-400 border border-white/10 font-black rounded-xl transition-all">Re-evaluate</button></div></div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center gap-2">
              <div className="card p-3 flex items-center gap-3 bg-gray-50/50 border-gray-200 flex-1"><Search className="h-4 w-4 text-gray-400" /><input type="text" placeholder="Search tasks..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-transparent border-none focus:outline-none text-xs w-full font-bold" /></div>
              {isSuperRole && <button onClick={() => setIsCreateModalOpen(true)} className="btn-primary h-12 w-12 flex items-center justify-center rounded-2xl shadow-md flex-shrink-0" title="Create Custom Task"><Plus className="h-5 w-5" /></button>}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {filterOptions.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setActiveFilter(opt.id)}
                  className={`px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-colors ${activeFilter === opt.id ? 'bg-gray-200 text-gray-900 border border-gray-300' : 'bg-gray-100/50 text-gray-500 hover:bg-gray-200/50'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="space-y-6">
              {processedTasks.length === 0 ? <div className="card p-12 text-center bg-gray-50 border-dashed border-2"><p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Queue Empty</p></div> : (
                <>
                  {[
                    { title: 'Verification & Audits', items: processedTasks.filter(t => ['VEHICLE_VERIFICATION', 'IDENTITY_VERIFICATION', 'CORPORATE_RIDE_VERIFICATION', 'CORPORATE_ASSET_VERIFICATION', 'ASSET_AUDIT'].includes(t.task_type)) },
                    { title: 'Support & Disputes', items: processedTasks.filter(t => ['SUPPORT_TICKET', 'DISPUTE_RESOLUTION'].includes(t.task_type)) },
                    { title: 'Administrative Tasks', items: processedTasks.filter(t => t.task_type === 'CUSTOM_TASK') },
                    { title: 'Other Processes', items: processedTasks.filter(t => !['VEHICLE_VERIFICATION', 'IDENTITY_VERIFICATION', 'CORPORATE_RIDE_VERIFICATION', 'CORPORATE_ASSET_VERIFICATION', 'ASSET_AUDIT', 'SUPPORT_TICKET', 'DISPUTE_RESOLUTION', 'CUSTOM_TASK'].includes(t.task_type)) }

                  ].map((group, idx) => group.items.length > 0 && (
                    <div key={idx} className="space-y-2">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{group.title} <span className="text-gray-300">({group.items.length})</span></h4>
                      {group.items.sort((a: any, b: any) => {
                        const aFinalized = a.status === 'COMPLETED' || a.status === 'REJECTED';
                        const bFinalized = b.status === 'COMPLETED' || b.status === 'REJECTED';

                        if (aFinalized && !bFinalized) return 1;
                        if (!aFinalized && bFinalized) return -1;

                        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                      }).map((task: any) => (
                        <button key={task.id} onClick={() => { setSelectedTask(task); setAssignTo(task.assigned_to || ''); setAssignRole(task.assigned_role || ''); setAssignPriority(task.priority || ''); if (!isSuperRole) setIsReviewMode(true); }} className={`w-full text-left p-4 rounded-2xl transition-all border-l-4 ${selectedTask?.id === task.id ? 'bg-white border-l-primary-600 shadow-md' : 'bg-gray-50 border-l-transparent hover:bg-gray-100'}`}>
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${task.status === 'PENDING' ? 'bg-orange-100 text-orange-600' : task.status === 'COMPLETED' ? 'bg-green-100 text-green-600' : task.status === 'REJECTED' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>{task.status}</span>
                              {task.status === 'PENDING' && (
                                <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-red-100 text-red-600 shadow-sm animate-pulse">
                                  <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span> Unattended
                                </span>
                              )}
                            </div>
                            <span className="text-[8px] font-bold text-gray-400">{new Date(task.created_at).toLocaleDateString()}</span>
                          </div>
                          <h3 className={`text-xs font-black mb-1 leading-tight ${(task.status === 'COMPLETED' || task.status === 'REJECTED') ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{task.title}</h3>
                          <div className="flex items-center justify-between mt-3"><div className="flex items-center gap-2 text-[8px] font-black text-gray-400 uppercase tracking-tighter">{task.task_type.replace('_', ' ')}</div></div>
                        </button>
                      ))}
                    </div>
                  ))}
                </>
              )}
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
                      <div><label htmlFor="assignRole" className="text-[10px] font-black text-gray-400 uppercase mb-1.5 block">Assign Role</label><select id="assignRole" name="assignRole" className="input text-xs h-10 font-bold border-gray-200" value={assignRole} onChange={(e) => setAssignRole(e.target.value)}><option value="">Open to all</option><option value="VERIFIER">Verifier</option><option value="CAR_VERIFIER">Car Verifier</option><option value="RIDE_BUSINESS_VERIFIER">Ride Business Verifier</option><option value="ASSET_BUSINESS_VERIFIER">Asset Business Verifier</option><option value="OPS">Operations</option><option value="SUPPORT">Support</option><option value="SUPER_ADMIN">Super Admin</option></select></div>
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

      {/* Create Custom Task Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center">
                  <PenTool className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900 tracking-tight">Create Custom Task</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Assign custom operational work</p>
                </div>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="h-10 w-10 flex items-center justify-center rounded-xl bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto flex-1">
              <form id="create-task-form" onSubmit={handleCreateCustomTask} className="space-y-6">
                <div>
                  <label htmlFor="title" className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Task Title <span className="text-red-500">*</span></label>
                  <input id="title" type="text" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} className="input font-bold text-sm" placeholder="E.g., Investigate User Report #1024" required />
                </div>

                <div>
                  <label htmlFor="description" className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Detailed Instructions</label>
                  <textarea id="description" value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })} className="input font-medium text-sm min-h-[120px]" placeholder="Provide full context for the assignee..." />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="priority" className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Priority Level</label>
                    <select id="priority" value={newTask.priority} onChange={e => setNewTask({ ...newTask, priority: e.target.value })} className="input font-bold text-xs h-12">
                      <option value="LOW">Low - Routine</option>
                      <option value="MEDIUM">Medium - Standard</option>
                      <option value="HIGH">High - Important</option>
                      <option value="URGENT">Urgent - Immediate Action</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="attachments" className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">External Link / Reference (Optional)</label>
                    <input id="attachments" type="url" value={newTask.attachments} onChange={e => setNewTask({ ...newTask, attachments: e.target.value })} className="input font-medium text-xs h-12" placeholder="https://..." />
                  </div>
                </div>

                <div className="p-5 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                  <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2"><UserPlus className="h-4 w-4 text-primary-600" /> Assignment Targeting</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="newAssignTo" className="text-[9px] font-bold text-gray-500 uppercase mb-1.5 block">Specific Person</label>
                      <select id="newAssignTo" value={newTask.assigned_to} onChange={e => setNewTask({ ...newTask, assigned_to: e.target.value })} className="input font-bold text-xs h-10 border-gray-200">
                        <option value="">Leave unassigned</option>
                        {staffUsers.map(u => (
                          <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.email})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="newAssignRole" className="text-[9px] font-bold text-gray-500 uppercase mb-1.5 block">Or Required Role</label>
                      <select id="newAssignRole" value={newTask.assigned_role} onChange={e => setNewTask({ ...newTask, assigned_role: e.target.value })} className="input font-bold text-xs h-10 border-gray-200">
                        <option value="">Any Role / Open Queue</option>
                        <option value="VERIFIER">Verifier</option>
                        <option value="CAR_VERIFIER">Car Verifier</option>
                        <option value="RIDE_BUSINESS_VERIFIER">Ride Business Verifier</option>
                        <option value="ASSET_BUSINESS_VERIFIER">Asset Business Verifier</option>
                        <option value="OPS">Operations</option>
                        <option value="SUPPORT">Support</option>
                      </select>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setIsCreateModalOpen(false)} className="px-6 py-3 font-bold text-sm text-gray-600 hover:bg-gray-200 rounded-xl transition-colors">Cancel</button>
              <button type="submit" form="create-task-form" disabled={isProcessing || !newTask.title} className="btn-primary px-8 py-3 rounded-xl shadow-lg shadow-primary-500/20 disabled:opacity-50 flex items-center gap-2">
                {isProcessing ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Create & Assign Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
