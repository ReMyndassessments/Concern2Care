import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation resources
const resources = {
  en: {
    translation: {
      // Navigation
      'nav.dashboard': 'Dashboard',
      'nav.concerns': 'Student Concerns',
      'nav.reports': 'Reports',
      'nav.help': 'Help Guide',
      'nav.admin': 'Admin Panel',
      'nav.logout': 'Logout',
      
      // Dashboard
      'dashboard.title': 'Teacher Dashboard',
      'dashboard.welcome': 'Welcome back',
      'dashboard.usage': 'Your Monthly Usage',
      'dashboard.usageOf': 'of',
      'dashboard.requests': 'requests',
      'dashboard.recentActivity': 'Recent Activity',
      'dashboard.noActivity': 'No recent activity',
      'dashboard.createConcern': 'Create New Concern',
      'dashboard.viewReports': 'View Reports',
      
      // Student Concerns Form
      'concerns.title': 'Document Student Concern',
      'concerns.studentName': 'Student Name',
      'concerns.studentNamePlaceholder': 'Enter student name',
      'concerns.grade': 'Grade Level',
      'concerns.gradePlaceholder': 'Select grade',
      'concerns.category': 'Concern Category',
      'concerns.categoryPlaceholder': 'Select category',
      'concerns.description': 'Detailed Description',
      'concerns.descriptionPlaceholder': 'Describe the specific concerns you have about this student...',
      'concerns.submit': 'Generate Intervention Strategies',
      'concerns.submitting': 'Generating...',
      
      // Categories
      'category.academic': 'Academic Performance',
      'category.behavioral': 'Behavioral Issues',
      'category.social': 'Social-Emotional',
      'category.attendance': 'Attendance/Engagement',
      'category.other': 'Other',
      
      // Grades
      'grade.k': 'Kindergarten',
      'grade.1': '1st Grade',
      'grade.2': '2nd Grade', 
      'grade.3': '3rd Grade',
      'grade.4': '4th Grade',
      'grade.5': '5th Grade',
      'grade.6': '6th Grade',
      'grade.7': '7th Grade',
      'grade.8': '8th Grade',
      'grade.9': '9th Grade',
      'grade.10': '10th Grade',
      'grade.11': '11th Grade',
      'grade.12': '12th Grade',
      
      // Intervention Results
      'results.title': 'AI-Generated Intervention Strategies',
      'results.forStudent': 'for',
      'results.loading': 'Generating intervention strategies...',
      'results.error': 'Failed to generate interventions. Please try again.',
      'results.copy': 'Copy to Clipboard',
      'results.copied': 'Copied to clipboard!',
      'results.download': 'Download PDF',
      'results.share': 'Share via Email',
      'results.followUp': 'Ask Follow-up Question',
      'results.followUpPlaceholder': 'Ask a question about these interventions...',
      'results.askQuestion': 'Ask Question',
      'results.asking': 'Getting answer...',
      
      // Reports
      'reports.title': 'Generated Reports',
      'reports.noReports': 'No reports generated yet',
      'reports.student': 'Student',
      'reports.concern': 'Concern',
      'reports.date': 'Generated',
      'reports.actions': 'Actions',
      'reports.view': 'View',
      'reports.download': 'Download',
      'reports.email': 'Email',
      
      // Email Sharing
      'email.title': 'Share Report via Email',
      'email.recipient': 'Recipient Email',
      'email.recipientPlaceholder': 'Enter email address',
      'email.subject': 'Email Subject',
      'email.message': 'Additional Message (Optional)',
      'email.messagePlaceholder': 'Add a personal message...',
      'email.send': 'Send Email',
      'email.sending': 'Sending...',
      'email.success': 'Email sent successfully!',
      'email.error': 'Failed to send email. Please try again.',
      'email.cancel': 'Cancel',
      
      // Authentication
      'auth.login': 'Login',
      'auth.email': 'Email',
      'auth.password': 'Password',
      'auth.signingin': 'Signing in...',
      'auth.signin': 'Sign In',
      'auth.teacherSignIn': 'Teacher Sign In',
      'auth.error': 'Login failed. Please check your credentials.',
      
      // Landing Page
      'landing.tagline': 'A Teacher Tool for Differentiation and Classroom Interventions',
      'landing.mainHeading': 'Adapt Any Lesson. Support Every Learner.',
      'landing.description': 'Trusted, AI-powered, strategies for academic, behavioral, and social-emotional needs. Teachers get practical tools to adapt instruction in the moment. Administrators get stronger capacity, consistent support, and better outcomes for every student.',
      'landing.secureLogin': 'Secure Teacher Login',
      'landing.ferpaCompliant': 'FERPA compliant • Evidence-based strategies • Trusted by educators',
      
      // Features
      'features.instantAI': 'Instant AI Recommendations',
      'features.instantAIDesc': 'Get research-based intervention strategies in seconds',
      'features.documentation': 'Professional Documentation',
      'features.documentationDesc': 'Generate comprehensive PDF reports for meetings',
      'features.collaboration': 'Seamless Collaboration',
      'features.collaborationDesc': 'Share support requests with your team effortlessly',
      'features.saveTime': 'Save Time Daily',
      'features.saveTimeDesc': 'Reduce documentation time by up to 75%',
      
      // Pricing
      'pricing.title': 'Simple, Transparent Pricing',
      'pricing.subtitle': 'Just $10 per teacher per month',
      'pricing.description': 'Empower your entire teaching staff with AI-powered student support tools. No hidden fees, no complicated tiers.',
      
      // Language Switcher
      'language.switch': 'Switch Language',
      'language.english': 'English',
      'language.chinese': '中文',
      
      // App Header
      'header.newRequest': 'New Request',
      'header.myRequests': 'My Requests', 
      'header.settings': 'Settings',
      'header.adminDashboard': 'Admin Dashboard',
      'header.signOut': 'Sign Out',
      'header.smartSupportTools': 'Smart Support Tools',
      
      // Login Page
      'login.title': 'Teacher Sign In',
      'login.secureAccess': 'Secure Access',
      'login.secureDescription': 'Sign in with your school-provided credentials.',
      'login.email': 'Email',
      'login.emailPlaceholder': 'your.email@school.edu',
      'login.password': 'Password',
      'login.passwordPlaceholder': 'Enter your password',
      'login.signingIn': 'Signing In...',
      'login.signIn': 'Sign In',
      'login.backToHome': '← Back to Home',
      
      // Register Page
      'register.title': 'Individual Teacher Subscription',
      'register.subtitle': 'Join Concern2Care for $10/month/teacher',
      'register.whatYouGet': 'What You Get',
      'register.aiDifferentiation': 'AI-Generated Differentiation Strategies',
      'register.aiDifferentiationDesc': 'Get personalized teaching adjustments for student needs',
      'register.aiInterventions': 'AI-Generated Tier 2 Interventions',
      'register.aiInterventionsDesc': 'Evidence-based intervention strategies for student concerns',
      'register.pdfReports': 'PDF Report Generation',
      'register.pdfReportsDesc': 'Professional documentation for meetings',
      'register.emailSharing': 'Email Sharing & Collaboration',
      'register.emailSharingDesc': 'Share reports with administrators and support staff',
      'register.monthlyRequests': '20 Monthly Requests',
      'register.monthlyRequestsDesc': 'Perfect for individual classroom needs',
      'register.secureData': 'Secure, FERPA-Compliant Data',
      'register.secureDataDesc': 'Your student information stays protected',
      'register.alreadyHaveAccount': 'Already have an account? Sign In',
      
      // Error Boundary
      'error.somethingWrong': 'Something went wrong',
      'error.unexpectedError': 'We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.',
      'error.tryAgain': 'Try Again',
      'error.refreshPage': 'Refresh Page',
      'error.errorDetails': 'Error Details',
      
      // 404 Page
      'notFound.title': '404 Page Not Found',
      'notFound.description': 'Did you forget to add the page to the router?',
      
      // Analytics Dashboard
      'analytics.monthlyTrends': 'Monthly Usage Trends',
      'analytics.thisMonth': 'This Month',
      'analytics.lastMonth': 'Last Month',
      'analytics.change': 'Change',
      'analytics.activeTeachers': 'Active Teachers',
      'analytics.activeThisMonth': 'Active This Month',
      'analytics.engagementRate': 'Engagement Rate',
      'analytics.recentActivity': 'Recent Activity',
      'analytics.noRecentActivity': 'No recent activity to display',
      
      // Help Guide
      'help.welcome': 'Welcome to Concern2Care',
      'help.welcomeDesc': 'Concern2Care is your AI-powered teaching assistant designed to help K-12 educators document student concerns and receive evidence-based intervention strategies. This comprehensive guide will help you make the most of all features.',
      'help.gettingStarted': 'Getting Started',
      'help.documentingConcerns': 'Documenting Concerns',
      'help.aiInterventions': 'AI Interventions',
      'help.reports': 'Reports',
      'help.emailConfig': 'Email Configuration',
      'help.profileManagement': 'Profile Management',
      'help.troubleshooting': 'Troubleshooting',
      'help.bestPractices': 'Best Practices',
      'help.dataPrivacy': 'Data Privacy',
      'help.contactSupport': 'Contact Support',
      
      // Interventions Display
      'interventions.title': 'AI-Generated Interventions',
      'interventions.loading': 'Loading interventions...',
      'interventions.error': 'Unable to load interventions. Please try again.',
      'interventions.none': 'No interventions have been generated for this concern yet.',
      
      // Object Uploader
      'upload.button': 'Upload File',
      'upload.uploading': 'Uploading...',
      'upload.success': 'File uploaded successfully',
      'upload.fileTooLarge': 'File too large',
      'upload.fileTooLargeDesc': 'Please select a file smaller than',
      'upload.invalidFileType': 'Invalid file type',
      'upload.invalidFileTypeDesc': 'Please select a file with one of these extensions:',
      'upload.remove': 'Remove',
      'upload.noFile': 'No file selected',
      
      // Common
      'common.loading': 'Loading...',
      'common.error': 'An error occurred',
      'common.success': 'Success!',
      'common.close': 'Close',
      'common.cancel': 'Cancel',
      'common.save': 'Save',
      'common.delete': 'Delete',
      'common.edit': 'Edit',
      'common.back': 'Back',
      'common.next': 'Next',
      'common.previous': 'Previous',
      'common.confirm': 'Confirm',
      'common.yes': 'Yes',
      'common.no': 'No'
    }
  },
  zh: {
    translation: {
      // Navigation
      'nav.dashboard': '仪表板',
      'nav.concerns': '学生关注',
      'nav.reports': '报告',
      'nav.help': '帮助指南',
      'nav.admin': '管理面板',
      'nav.logout': '退出登录',
      
      // Dashboard
      'dashboard.title': '教师仪表板',
      'dashboard.welcome': '欢迎回来',
      'dashboard.usage': '您的月度使用情况',
      'dashboard.usageOf': '共',
      'dashboard.requests': '次请求',
      'dashboard.recentActivity': '最近活动',
      'dashboard.noActivity': '暂无最近活动',
      'dashboard.createConcern': '创建新关注',
      'dashboard.viewReports': '查看报告',
      
      // Student Concerns Form
      'concerns.title': '记录学生关注',
      'concerns.studentName': '学生姓名',
      'concerns.studentNamePlaceholder': '输入学生姓名',
      'concerns.grade': '年级',
      'concerns.gradePlaceholder': '选择年级',
      'concerns.category': '关注类别',
      'concerns.categoryPlaceholder': '选择类别',
      'concerns.description': '详细描述',
      'concerns.descriptionPlaceholder': '描述您对该学生的具体关注...',
      'concerns.submit': '生成干预策略',
      'concerns.submitting': '生成中...',
      
      // Categories
      'category.academic': '学业表现',
      'category.behavioral': '行为问题',
      'category.social': '社交情感',
      'category.attendance': '出勤/参与度',
      'category.other': '其他',
      
      // Grades
      'grade.k': '幼儿园',
      'grade.1': '一年级',
      'grade.2': '二年级',
      'grade.3': '三年级',
      'grade.4': '四年级',
      'grade.5': '五年级',
      'grade.6': '六年级',
      'grade.7': '七年级',
      'grade.8': '八年级',
      'grade.9': '九年级',
      'grade.10': '十年级',
      'grade.11': '十一年级',
      'grade.12': '十二年级',
      
      // Intervention Results
      'results.title': 'AI生成的干预策略',
      'results.forStudent': '针对',
      'results.loading': '正在生成干预策略...',
      'results.error': '生成干预策略失败，请重试。',
      'results.copy': '复制到剪贴板',
      'results.copied': '已复制到剪贴板！',
      'results.download': '下载PDF',
      'results.share': '通过邮件分享',
      'results.followUp': '提出后续问题',
      'results.followUpPlaceholder': '询问关于这些干预策略的问题...',
      'results.askQuestion': '提问',
      'results.asking': '获取答案中...',
      
      // Reports
      'reports.title': '生成的报告',
      'reports.noReports': '尚未生成任何报告',
      'reports.student': '学生',
      'reports.concern': '关注',
      'reports.date': '生成时间',
      'reports.actions': '操作',
      'reports.view': '查看',
      'reports.download': '下载',
      'reports.email': '邮件',
      
      // Email Sharing
      'email.title': '通过邮件分享报告',
      'email.recipient': '收件人邮箱',
      'email.recipientPlaceholder': '输入邮箱地址',
      'email.subject': '邮件主题',
      'email.message': '附加消息（可选）',
      'email.messagePlaceholder': '添加个人消息...',
      'email.send': '发送邮件',
      'email.sending': '发送中...',
      'email.success': '邮件发送成功！',
      'email.error': '邮件发送失败，请重试。',
      'email.cancel': '取消',
      
      // Authentication
      'auth.login': '登录',
      'auth.email': '邮箱',
      'auth.password': '密码',
      'auth.signingin': '登录中...',
      'auth.signin': '登录',
      'auth.teacherSignIn': '教师登录',
      'auth.error': '登录失败，请检查您的凭据。',
      
      // Landing Page
      'landing.tagline': '教师差异化教学和课堂干预工具',
      'landing.mainHeading': '适应任何课程。支持每个学习者。',
      'landing.description': '值得信赖的AI驱动策略，用于学业、行为和社交情感需求。教师可获得在关键时刻调整教学的实用工具。管理者可获得更强的能力、一致的支持，以及为每个学生带来更好的结果。',
      'landing.secureLogin': '安全教师登录',
      'landing.ferpaCompliant': 'FERPA符合性 • 基于证据的策略 • 教育者信赖',
      
      // Features
      'features.instantAI': '即时AI推荐',
      'features.instantAIDesc': '在几秒钟内获得基于研究的干预策略',
      'features.documentation': '专业文档',
      'features.documentationDesc': '为会议生成全面的PDF报告',
      'features.collaboration': '无缝协作',
      'features.collaborationDesc': '轻松与您的团队共享支持请求',
      'features.saveTime': '每日节省时间',
      'features.saveTimeDesc': '将文档时间缩短多达75%',
      
      // Pricing
      'pricing.title': '简单、透明的定价',
      'pricing.subtitle': '每位教师每月仅10美元',
      'pricing.description': '使您的整个教学团队获得AI驱动的学生支持工具。无隐藏费用，无复杂分层。',
      
      // Language Switcher
      'language.switch': '切换语言',
      'language.english': 'English',
      'language.chinese': '中文',
      
      // App Header
      'header.newRequest': '新请求',
      'header.myRequests': '我的请求', 
      'header.settings': '设置',
      'header.adminDashboard': '管理仪表盘',
      'header.signOut': '退出登录',
      'header.smartSupportTools': '智能支持工具',
      
      // Login Page
      'login.title': '教师登录',
      'login.secureAccess': '安全访问',
      'login.secureDescription': '使用学校提供的凭据登录。',
      'login.email': '邮箱',
      'login.emailPlaceholder': 'your.email@school.edu',
      'login.password': '密码',
      'login.passwordPlaceholder': '输入您的密码',
      'login.signingIn': '登录中...',
      'login.signIn': '登录',
      'login.backToHome': '← 返回主页',
      
      // Register Page
      'register.title': '个人教师订阅',
      'register.subtitle': '加入Concern2Care，每位教师每月$10',
      'register.whatYouGet': '您将获得',
      'register.aiDifferentiation': 'AI生成的差异化策略',
      'register.aiDifferentiationDesc': '获得针对学生需求的个性化教学调整',
      'register.aiInterventions': 'AI生成的二级干预',
      'register.aiInterventionsDesc': '基于证据的学生关注干预策略',
      'register.pdfReports': 'PDF报告生成',
      'register.pdfReportsDesc': '会议专业文档',
      'register.emailSharing': '邮件共享和协作',
      'register.emailSharingDesc': '与管理员和支持人员共享报告',
      'register.monthlyRequests': '每月 20 次请求',
      'register.monthlyRequestsDesc': '非常适合个人课堂需求',
      'register.secureData': '安全、FERPA符合数据',
      'register.secureDataDesc': '您的学生信息得到保护',
      'register.alreadyHaveAccount': '已有账户？登录',
      
      // Error Boundary
      'error.somethingWrong': '出现错误',
      'error.unexpectedError': '我们遇到了意外错误。请尝试刷新页面，如果问题仍然存在，请联系支持。',
      'error.tryAgain': '重试',
      'error.refreshPage': '刷新页面',
      'error.errorDetails': '错误详情',
      
      // 404 Page
      'notFound.title': '404 页面未找到',
      'notFound.description': '您是否忘记将页面添加到路由器？',
      
      // Analytics Dashboard
      'analytics.monthlyTrends': '月度使用趋势',
      'analytics.thisMonth': '本月',
      'analytics.lastMonth': '上月',
      'analytics.change': '变化',
      'analytics.activeTeachers': '活跃教师',
      'analytics.activeThisMonth': '本月活跃',
      'analytics.engagementRate': '参与率',
      'analytics.recentActivity': '近期活动',
      'analytics.noRecentActivity': '暂无近期活动可显示',
      
      // Help Guide
      'help.welcome': '欢迎使用 Concern2Care',
      'help.welcomeDesc': 'Concern2Care是您的AI驱动教学助手，旨在帮助K-12教育工作者记录学生关注并获得基于证据的干预策略。这个全面指南将帮助您充分利用所有功能。',
      'help.gettingStarted': '入门指南',
      'help.documentingConcerns': '记录关注事项',
      'help.aiInterventions': 'AI干预措施',
      'help.reports': '报告',
      'help.emailConfig': '邮件配置',
      'help.profileManagement': '个人资料管理',
      'help.troubleshooting': '故障排除',
      'help.bestPractices': '最佳实践',
      'help.dataPrivacy': '数据隐私',
      'help.contactSupport': '联系支持',
      
      // Interventions Display
      'interventions.title': 'AI生成的干预措施',
      'interventions.loading': '加载干预措施中...',
      'interventions.error': '无法加载干预措施。请重试。',
      'interventions.none': '此关注事项尚未生成干预措施。',
      
      // Object Uploader
      'upload.button': '上传文件',
      'upload.uploading': '上传中...',
      'upload.success': '文件上传成功',
      'upload.fileTooLarge': '文件太大',
      'upload.fileTooLargeDesc': '请选择小于',
      'upload.invalidFileType': '无效文件类型',
      'upload.invalidFileTypeDesc': '请选择具有以下扩展名的文件：',
      'upload.remove': '删除',
      'upload.noFile': '未选择文件',
      
      // Common
      'common.loading': '加载中...',
      'common.error': '发生错误',
      'common.success': '成功！',
      'common.close': '关闭',
      'common.cancel': '取消',
      'common.save': '保存',
      'common.delete': '删除',
      'common.edit': '编辑',
      'common.back': '返回',
      'common.next': '下一步',
      'common.previous': '上一步',
      'common.confirm': '确认',
      'common.yes': '是',
      'common.no': '否'
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    
    interpolation: {
      escapeValue: false // React already does escaping
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    }
  });

export default i18n;