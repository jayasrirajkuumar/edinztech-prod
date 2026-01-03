import {
    CheckCircle,
    AlertCircle,
    Info,
    Upload,
    History, // Added
    BookOpen,
    Briefcase,
    Users,
    Home,
    Shield, // Added
    QrCode, // Added
    ShieldCheck,
    LogIn,
    LogOut,
    ChevronRight,
    ChevronDown, // Added
    Menu,
    X,
    Rocket,
    Award,
    CreditCard,
    Clock,
    Calendar,
    Search,
    Plus,
    Filter,
    Download as DownloadIcon,
    Trash2,
    Edit,
    Mail,
    UserPlus,
    MessageSquare,
    MessageCircle, // Added
    BarChart,
    Dot,
    User, // Added
    LayoutDashboard, // Added
    Settings, // Added for ProgramForm
    File, // Added
    FileText, // Added
    ArrowLeft, // Added
    Phone, // Added
    Presentation, // Added
    GraduationCap, // Added
    FolderKanban, // Added
    Link, // Added
    XCircle, // Added
    Code, // Added
    ArrowRight, // Added

    RefreshCcw, // Added
    Globe, // Added
    Power, // Added
    Copy, // Added
} from 'lucide-react';

export const Icons = {
    // Navigation & General
    Sync: (props) => <RefreshCcw className="text-primary" {...props} />, // Added for Sync
    ArrowRight: (props) => <ArrowRight className="text-secondary" {...props} />, // Added
    History: (props) => <History className="text-secondary" {...props} />, // Added
    Rocket: (props) => <Rocket className="text-primary" {...props} />,
    ShieldCheck: (props) => <ShieldCheck className="text-secondary" {...props} />,
    Shield: (props) => <Shield className="text-secondary" {...props} />, // Added
    QrCode: (props) => <QrCode className="text-secondary" {...props} />, // Added
    Home: (props) => <Home className="text-secondary" {...props} />,
    BookOpen: (props) => <BookOpen className="text-secondary" {...props} />, // Added for generic usage
    Learning: (props) => <GraduationCap className="text-secondary" {...props} />, // Added for Learning Programs
    Project: (props) => <FolderKanban className="text-secondary" {...props} />, // Added for Projects
    Courses: (props) => <BookOpen className="text-secondary" {...props} />,
    Internships: (props) => <Briefcase className="text-secondary" {...props} />,
    Workshops: (props) => <Presentation className="text-secondary" {...props} />,
    Users: (props) => <Users className="text-secondary" {...props} />,
    Verify: (props) => <ShieldCheck className="text-secondary" {...props} />,
    Login: (props) => <LogIn className="text-secondary" {...props} />,
    Logout: (props) => <LogOut className="text-secondary" {...props} />,
    LogOut: (props) => <LogOut className="text-secondary" {...props} />, // Added alias
    Code: (props) => <Code className="text-primary" {...props} />, // Added
    Contact: (props) => <Phone className="text-secondary" {...props} />, // Added

    // UI Controls
    Menu: (props) => <Menu className="text-primary" {...props} />,
    Close: (props) => <X className="text-primary" {...props} />,
    X: (props) => <X className="text-primary" {...props} />, // Added alias
    ChevronRight: (props) => <ChevronRight className="text-gray-400" {...props} />,
    ChevronDown: (props) => <ChevronDown className="text-gray-400" {...props} />, // Added
    Search: (props) => <Search className="text-gray-400" {...props} />,
    Plus: (props) => <Plus className="text-primary" {...props} />,
    Filter: (props) => <Filter className="text-secondary" {...props} />,
    Download: (props) => <DownloadIcon className="text-secondary" {...props} />,
    Edit: (props) => <Edit className="text-blue-600" {...props} />,
    Trash: (props) => <Trash2 className="text-danger" {...props} />,
    Dot: (props) => <Dot {...props} />,

    // Communication
    Mail: (props) => <Mail className="text-secondary" {...props} />,
    UserPlus: (props) => <UserPlus className="text-secondary" {...props} />,
    MessageSquare: (props) => <MessageSquare className="text-secondary" {...props} />,
    MessageCircle: (props) => <MessageCircle className="text-secondary" {...props} />, // Added
    BarChart: (props) => <BarChart className="text-secondary" {...props} />,
    CheckCircle: (props) => <CheckCircle className="text-success" {...props} />,
    AlertCircle: (props) => <AlertCircle className="text-danger" {...props} />,
    XCircle: (props) => <XCircle className="text-danger" {...props} />, // Added

    // Status
    Success: (props) => <CheckCircle className="text-success" {...props} />,
    Danger: (props) => <AlertCircle className="text-danger" {...props} />,
    Info: (props) => <Info className="text-secondary" {...props} />,

    // Feature Specific
    HelpCircle: (props) => <AlertCircle className="text-secondary" {...props} />, // Fallback to AlertCircle
    Duration: (props) => <Clock className="text-primary" {...props} />,
    Date: (props) => <Calendar className="text-primary" {...props} />,
    Fee: (props) => <CreditCard className="text-primary" {...props} />,
    Certificate: (props) => <Award className="text-primary" {...props} />,
    Award: (props) => <Award className="text-secondary" {...props} />, // Added specifically for direct usage
    Settings: (props) => <Settings className="text-secondary" {...props} />, // Added for ProgramForm
    Quiz: (props) => <Rocket className="text-primary" {...props} />,
    Upload: (props) => <Upload className="text-primary" {...props} />,
    User: (props) => <User className="text-primary" {...props} />, // Added
    Dashboard: (props) => <LayoutDashboard className="text-primary" {...props} />, // Added
    Clock: (props) => <Clock className="text-primary" {...props} />, // Added generic Clock
    File: (props) => <File className="text-secondary" {...props} />, // Added
    FileText: (props) => <FileText className="text-secondary" {...props} />, // Added
    ArrowLeft: (props) => <ArrowLeft className="text-secondary" {...props} />, // Added
    GraduationCap: (props) => <GraduationCap className="text-secondary" {...props} />, // Added
    Presentation: (props) => <Presentation className="text-secondary" {...props} />, // Added
    Link: (props) => <Link className="text-secondary" {...props} />, // Added
    Power: (props) => <Power className="text-secondary" {...props} />, // Added
    Globe: (props) => <Globe className="text-secondary" {...props} />, // Added
    Copy: (props) => <Copy className="text-secondary" {...props} />, // Added
};