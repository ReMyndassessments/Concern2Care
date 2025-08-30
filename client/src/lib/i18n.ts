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
      'auth.error': 'Login failed. Please check your credentials.',
      
      // Language Switcher
      'language.switch': 'Switch Language',
      'language.english': 'English',
      'language.chinese': '中文',
      
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
      'auth.error': '登录失败，请检查您的凭据。',
      
      // Language Switcher
      'language.switch': '切换语言',
      'language.english': 'English',
      'language.chinese': '中文',
      
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