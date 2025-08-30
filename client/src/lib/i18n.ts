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
      'landing.individualTeacher': 'Individual teacher? Try Concern2Care for $10/month:',
      'landing.startSubscription': 'Start Your Individual Subscription',
      
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
      'pricing.smallSchool': 'Small School',
      'pricing.smallSchoolRange': '1-20 Teachers',
      'pricing.mediumSchool': 'Medium School',
      'pricing.mediumSchoolRange': '21-50 Teachers',
      'pricing.largeSchool': 'Large School',
      'pricing.largeSchoolRange': '51-200 Teachers',
      'pricing.enterprise': 'Enterprise',
      'pricing.enterpriseRange': '200+ Teachers',
      'pricing.popular': 'Popular',
      'pricing.annual': 'Annual: $108/teacher/year',
      'pricing.save10': 'Save 10% annually',
      'pricing.custom': 'Custom',
      'pricing.customPricing': 'Annual: Custom pricing',
      'pricing.getStarted': 'Get Started',
      'pricing.features.aiRecommendations': 'Full AI-powered recommendations',
      'pricing.features.supportRequests': '20 support requests per teacher/month',
      'pricing.features.pdfGeneration': 'PDF report generation',
      'pricing.features.emailSharing': 'Email sharing capabilities',
      'pricing.features.basicSupport': 'Basic onboarding support',
      'pricing.features.everythingInSmall': 'Everything in Small School',
      'pricing.features.prioritySupport': 'Priority customer support',
      'pricing.features.analytics': 'Advanced analytics dashboard',
      'pricing.features.bulkManagement': 'Bulk teacher management',
      'pricing.features.training': 'Custom training sessions',
      
      // Real School Examples - specific translations
      'pricing.examples.teachers25': '25 Teachers',
      'pricing.examples.teachers75': '75 Teachers', 
      'pricing.examples.teachers150': '150 Teachers',
      'pricing.annualLabel': 'Annual',
      'pricing.annualSavings300': 'Annual Savings: $300',
      'pricing.annualSavings900': 'Annual Savings: $900',
      'pricing.annualSavings1800': 'Annual Savings: $1,800',
      'pricing.supportRequests500': 'Monthly Support Requests: 500 total',
      'pricing.supportRequests1500': 'Monthly Support Requests: 1,500 total',
      'pricing.supportRequests3000': 'Monthly Support Requests: 3,000 total',
      'pricing.perTeacherMonth': '/teacher/month',
      'pricing.features.everythingInMedium': 'Everything in Medium School',
      'pricing.features.accountManager': 'Dedicated account manager',
      'pricing.features.integrations': 'Custom integrations',
      'pricing.features.reporting': 'Advanced reporting suite',
      'pricing.features.support24': '24/7 priority support',
      'pricing.features.everythingInLarge': 'Everything in Large School',
      'pricing.features.whiteLabel': 'White-label solutions',
      'pricing.features.apiAccess': 'API access',
      'pricing.features.customDevelopment': 'Custom feature development',
      'pricing.features.onsiteSupport': 'On-site training & support',
      
      // Real School Examples
      'pricing.realExamples': 'Real School Examples',
      'pricing.savingsDescription': 'See how much your school could save with annual billing',
      'pricing.monthly': 'Monthly',
      'pricing.annualSavings': 'Annual Savings: $300',
      'pricing.supportRequests': 'Monthly Support Requests: 500 total',
      
      // What's Included
      'pricing.whatsIncluded': 'What\'s Included',
      'pricing.included.aiRecommendations': 'AI-powered intervention recommendations',
      'pricing.included.pdfReports': 'Professional PDF report generation',
      'pricing.included.emailSharing': 'Email sharing and collaboration tools',
      'pricing.included.supportRequests': '20 support requests per teacher per month',
      'pricing.included.secureStorage': 'Secure data storage and privacy protection',
      'pricing.included.updates': 'Regular feature updates and improvements',
      'pricing.included.support': 'Customer support and training resources',
      
      // Flexible Terms
      'pricing.flexibleTerms': 'Flexible Terms',
      'pricing.terms.billing': 'Monthly or annual billing options',
      'pricing.terms.discount': '10% discount for annual subscriptions',
      'pricing.terms.addRemove': 'Add or remove teachers anytime',
      'pricing.terms.cancel': 'Cancel with 30-day notice',
      'pricing.terms.prorated': 'Prorated billing for mid-cycle changes',
      'pricing.terms.volume': 'Volume discounts for 100+ teachers',
      'pricing.terms.enterprise': 'Custom enterprise solutions available',
      
      // ROI Comparison
      'comparison.title': 'Why Schools Choose Concern2Care',
      'comparison.subtitle': 'Better outcomes, better value than other education technology solutions',
      'comparison.view': 'View',
      'comparison.hide': 'Hide',
      'comparison.roiComparison': 'ROI Comparison',
      'comparison.perStudentCost': 'Per Student Cost (Annual)',
      'comparison.perTeacherCost': 'Per Teacher Cost (Annual)',
      'comparison.pricingModel': 'Pricing Model',
      'comparison.predictability': 'Predictability',
      'comparison.primaryBenefit': 'Primary Benefit',
      'comparison.magicSchoolOnly': 'Magic School Only',
      'comparison.concern2careOnly': 'Concern2Care Only',
      
      // CTA Section
      'cta.title': 'Ready to Transform Student Support?',
      'cta.subtitle': 'Join thousands of educators using AI-powered tools to better support their students. Get a personalized quote for your school today.',
      'cta.getQuote': 'Get Your Quote',
      'cta.questions': 'Questions? Email us at sales@remynd.online',
      
      // Footer
      'footer.copyright': '© 2025 Concern2Care. Built for educators, by educators.',
      'footer.poweredBy': 'Powered by ReMynd Student Services',
      
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
      'landing.individualTeacher': '个人教师？试用Concern2Care，每月10美元：',
      'landing.startSubscription': '开始您的个人订阅',
      
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
      'pricing.smallSchool': '小规模学校',
      'pricing.smallSchoolRange': '1-20位教师',
      'pricing.mediumSchool': '中等规模学校',
      'pricing.mediumSchoolRange': '21-50位教师',
      'pricing.largeSchool': '大规模学校',
      'pricing.largeSchoolRange': '51-200位教师',
      'pricing.enterprise': '企业版',
      'pricing.enterpriseRange': '200+位教师',
      'pricing.popular': '热门',
      'pricing.annual': '年付: $108/教师/年',
      'pricing.save10': '年付节省10%',
      'pricing.custom': '定制',
      'pricing.customPricing': '年付: 定制价格',
      'pricing.getStarted': '开始使用',
      'pricing.features.aiRecommendations': '完整的AI驱动推荐',
      'pricing.features.supportRequests': '每位教师每月20次支持请求',
      'pricing.features.pdfGeneration': 'PDF报告生成',
      'pricing.features.emailSharing': '邮件分享功能',
      'pricing.features.basicSupport': '基础入门支持',
      'pricing.features.everythingInSmall': '包含小规模学校的所有功能',
      'pricing.features.prioritySupport': '优先客户支持',
      'pricing.features.analytics': '高级分析仪表板',
      'pricing.features.bulkManagement': '批量教师管理',
      'pricing.features.training': '定制培训课程',
      
      // Real School Examples - specific translations
      'pricing.examples.teachers25': '25位教师',
      'pricing.examples.teachers75': '75位教师',
      'pricing.examples.teachers150': '150位教师',
      'pricing.annualLabel': '年付',
      'pricing.annualSavings300': '年付节省：$300',
      'pricing.annualSavings900': '年付节省：$900',
      'pricing.annualSavings1800': '年付节省：$1,800',
      'pricing.supportRequests500': '每月支持请求：共500次',
      'pricing.supportRequests1500': '每月支持请求：共1,500次',
      'pricing.supportRequests3000': '每月支持请求：共3,000次',
      'pricing.perTeacherMonth': '/教师/月',
      'pricing.features.everythingInMedium': '包含中等规模学校的所有功能',
      'pricing.features.accountManager': '专属客户经理',
      'pricing.features.integrations': '定制集成',
      'pricing.features.reporting': '高级报告套件',
      'pricing.features.support24': '24/7优先支持',
      'pricing.features.everythingInLarge': '包含大规模学校的所有功能',
      'pricing.features.whiteLabel': '白标解决方案',
      'pricing.features.apiAccess': 'API访问',
      'pricing.features.customDevelopment': '定制功能开发',
      'pricing.features.onsiteSupport': '现场培训和支持',
      
      // Real School Examples
      'pricing.realExamples': '真实学校案例',
      'pricing.savingsDescription': '查看您的学校通过年付可以节省多少费用',
      'pricing.monthly': '月付',
      'pricing.annualSavings': '年付节省：$300',
      'pricing.supportRequests': '每月支持请求：共500次',
      
      // What's Included
      'pricing.whatsIncluded': '包含内容',
      'pricing.included.aiRecommendations': 'AI驱动的干预推荐',
      'pricing.included.pdfReports': '专业PDF报告生成',
      'pricing.included.emailSharing': '邮件分享和协作工具',
      'pricing.included.supportRequests': '每位教师每月20次支持请求',
      'pricing.included.secureStorage': '安全数据存储和隐私保护',
      'pricing.included.updates': '定期功能更新和改进',
      'pricing.included.support': '客户支持和培训资源',
      
      // Flexible Terms
      'pricing.flexibleTerms': '灵活条款',
      'pricing.terms.billing': '月付或年付选项',
      'pricing.terms.discount': '年付享受10%折扣',
      'pricing.terms.addRemove': '随时添加或删除教师',
      'pricing.terms.cancel': '提前30天通知取消',
      'pricing.terms.prorated': '周期中变更按比例计费',
      'pricing.terms.volume': '100+教师享批量折扣',
      'pricing.terms.enterprise': '提供定制企业解决方案',
      
      // ROI Comparison
      'comparison.title': '为什么学校选择Concern2Care',
      'comparison.subtitle': '比其他教育技术解决方案更好的结果和价值',
      'comparison.view': '查看',
      'comparison.hide': '隐藏',
      'comparison.roiComparison': 'ROI比较',
      'comparison.perStudentCost': '每学生成本（年付）',
      'comparison.perTeacherCost': '每教师成本（年付）',
      'comparison.pricingModel': '定价模式',
      'comparison.predictability': '可预测性',
      'comparison.primaryBenefit': '主要优势',
      'comparison.magicSchoolOnly': '仅Magic School',
      'comparison.concern2careOnly': '仅Concern2Care',
      
      // CTA Section
      'cta.title': '准备好变革学生支持了吗？',
      'cta.subtitle': '加入数千名使用AI驱动工具更好支持学生的教育工作者。立即为您的学校获取个性化报价。',
      'cta.getQuote': '获取报价',
      'cta.questions': '有问题？请发送邮件至 sales@remynd.online',
      
      // Footer
      'footer.copyright': '© 2025 Concern2Care. 为教育工作者而打造，由教育工作者开发。',
      'footer.poweredBy': '由ReMynd Student Services提供支持',
      
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