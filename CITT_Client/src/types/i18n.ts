// CITT Language/i18n Type Definitions
// English & Kiswahili (Swahili) language support

export type Language = 'en' | 'sw';

export interface Translations {
  // Navigation
  home: string;
  about: string;
  projects: string;
  funding: string;
  ipManagement: string;
  events: string;
  gallery: string;
  contact: string;
  login: string;
  register: string;
  logout: string;
  dashboard: string;
  profile: string;
  settings: string;
  workspace: string;

  // Projects
  myProjects: string;
  submitProject: string;
  projectTitle: string;
  projectDescription: string;
  projectCategory: string;
  projectStatus: string;
  pending: string;
  approved: string;
  rejected: string;
  inProgress: string;
  completed: string;

  // Actions
  submit: string;
  cancel: string;
  save: string;
  edit: string;
  delete: string;
  approve: string;
  reject: string;
  search: string;
  filter: string;
  export: string;
  view: string;
  back: string;
  confirm: string;

  // Messages
  loading: string;
  noData: string;
  errorOccurred: string;
  success: string;
  operationSuccessful: string;
  operationFailed: string;
  confirmDelete: string;
  unsavedChanges: string;

  // Auth
  email: string;
  password: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  forgotPassword: string;
  resetPassword: string;
  signInWithGoogle: string;
  dontHaveAccount: string;
  alreadyHaveAccount: string;

  // Profile
  name: string;
  phone: string;
  university: string;
  college: string;
  yearOfStudy: string;
  campus: string;
  role: string;
  accountStatus: string;

  // Notifications
  notifications: string;
  markAllRead: string;
  noNotifications: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    home: 'Home',
    about: 'About',
    projects: 'Projects',
    funding: 'Funding',
    ipManagement: 'IP Management',
    events: 'Events',
    gallery: 'Gallery',
    contact: 'Contact',
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
    dashboard: 'Dashboard',
    profile: 'Profile',
    settings: 'Settings',
    workspace: 'Workspace',
    myProjects: 'My Projects',
    submitProject: 'Submit Project',
    projectTitle: 'Project Title',
    projectDescription: 'Description',
    projectCategory: 'Category',
    projectStatus: 'Status',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    inProgress: 'In Progress',
    completed: 'Completed',
    submit: 'Submit',
    cancel: 'Cancel',
    save: 'Save',
    edit: 'Edit',
    delete: 'Delete',
    approve: 'Approve',
    reject: 'Reject',
    search: 'Search',
    filter: 'Filter',
    export: 'Export',
    view: 'View',
    back: 'Back',
    confirm: 'Confirm',
    loading: 'Loading...',
    noData: 'No data available',
    errorOccurred: 'An error occurred',
    success: 'Success',
    operationSuccessful: 'Operation completed successfully',
    operationFailed: 'Operation failed',
    confirmDelete: 'Are you sure you want to delete this?',
    unsavedChanges: 'You have unsaved changes',
    email: 'Email',
    password: 'Password',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm Password',
    forgotPassword: 'Forgot Password?',
    resetPassword: 'Reset Password',
    signInWithGoogle: 'Sign in with Google',
    dontHaveAccount: "Don't have an account?",
    alreadyHaveAccount: 'Already have an account?',
    name: 'Name',
    phone: 'Phone',
    university: 'University',
    college: 'College',
    yearOfStudy: 'Year of Study',
    campus: 'Campus',
    role: 'Role',
    accountStatus: 'Account Status',
    notifications: 'Notifications',
    markAllRead: 'Mark all as read',
    noNotifications: 'No notifications',
  },
  sw: {
    home: 'Nyumbani',
    about: 'Kuhusu',
    projects: 'Miradi',
    funding: 'Ufadhili',
    ipManagement: 'Usimamizi wa IP',
    events: 'Matukio',
    gallery: 'Matunzio',
    contact: 'Mawasiliano',
    login: 'Ingia',
    register: 'Jisajili',
    logout: 'Toka',
    dashboard: 'Dashibodi',
    profile: 'Wasifu',
    settings: 'Mipangilio',
    workspace: 'Eneo la Kazi',
    myProjects: 'Miradi Yangu',
    submitProject: 'Wasilisha Mradi',
    projectTitle: 'Jina la Mradi',
    projectDescription: 'Maelezo',
    projectCategory: 'Aina',
    projectStatus: 'Hali',
    pending: 'Inasubiri',
    approved: 'Imekubaliwa',
    rejected: 'Imekataliwa',
    inProgress: 'Inaendelea',
    completed: 'Imekamilika',
    submit: 'Wasilisha',
    cancel: 'Ghairi',
    save: 'Hifadhi',
    edit: 'Hariri',
    delete: 'Futa',
    approve: 'Kubali',
    reject: 'Kataa',
    search: 'Tafuta',
    filter: 'Chuja',
    export: 'Hamisha',
    view: 'Angalia',
    back: 'Rudi',
    confirm: 'Thibitisha',
    loading: 'Inapakia...',
    noData: 'Hakuna data',
    errorOccurred: 'Hitilafu imetokea',
    success: 'Imefanikiwa',
    operationSuccessful: 'Operesheni imefanikiwa',
    operationFailed: 'Operesheni imeshindwa',
    confirmDelete: 'Una uhakika unataka kufuta?',
    unsavedChanges: 'Una mabadiliko ambayo hayajahifadhiwa',
    email: 'Barua Pepe',
    password: 'Nywila',
    currentPassword: 'Nywila ya Sasa',
    newPassword: 'Nywila Mpya',
    confirmPassword: 'Thibitisha Nywila',
    forgotPassword: 'Umesahau Nywila?',
    resetPassword: 'Weka Upya Nywila',
    signInWithGoogle: 'Ingia kwa Google',
    dontHaveAccount: 'Huna akaunti?',
    alreadyHaveAccount: 'Tayari una akaunti?',
    name: 'Jina',
    phone: 'Simu',
    university: 'Chuo Kikuu',
    college: 'Chuo',
    yearOfStudy: 'Mwaka wa Masomo',
    campus: 'Kampasi',
    role: 'Wadhifa',
    accountStatus: 'Hali ya Akaunti',
    notifications: 'Arifa',
    markAllRead: 'Weka zote kama zimesomwa',
    noNotifications: 'Hakuna arifa',
  },
};
