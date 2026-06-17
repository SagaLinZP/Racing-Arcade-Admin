export interface ManagedOption {
  value: string
  label_en: string
  label_zh: string
}

export type OptionCategory = 'competition' | 'result' | 'protest' | 'user' | 'news' | 'notification'

export interface OptionGroup {
  key: string
  name_en: string
  name_zh: string
  category: OptionCategory
  options: ManagedOption[]
}

export const optionGroups: OptionGroup[] = [
  {
    key: 'game',
    name_en: 'Game Platform',
    name_zh: '游戏平台',
    category: 'competition',
    options: [
      { value: 'ACC', label_en: 'ACC', label_zh: 'ACC' },
      { value: 'AC', label_en: 'AC', label_zh: 'AC' },
    ],
  },
  {
    key: 'carClass',
    name_en: 'Car Class',
    name_zh: '车型组',
    category: 'competition',
    options: [
      { value: 'GT3', label_en: 'GT3', label_zh: 'GT3' },
      { value: 'GT4', label_en: 'GT4', label_zh: 'GT4' },
      { value: 'GTE', label_en: 'GTE', label_zh: 'GTE' },
      { value: 'LMP1', label_en: 'LMP1', label_zh: 'LMP1' },
      { value: 'LMP2', label_en: 'LMP2', label_zh: 'LMP2' },
      { value: 'LMP3', label_en: 'LMP3', label_zh: 'LMP3' },
      { value: 'Formula', label_en: 'Formula', label_zh: '方程式' },
      { value: 'TCR', label_en: 'TCR', label_zh: 'TCR' },
      { value: 'Touring', label_en: 'Touring Car', label_zh: '房车' },
      { value: 'Open', label_en: 'Open', label_zh: '开放' },
    ],
  },
  {
    key: 'region',
    name_en: 'Region',
    name_zh: '区域',
    category: 'competition',
    options: [
      { value: 'CN', label_en: 'China', label_zh: '中国' },
      { value: 'AP', label_en: 'Asia Pacific', label_zh: '亚太' },
      { value: 'AM', label_en: 'Americas', label_zh: '美洲' },
      { value: 'EU', label_en: 'Europe & Africa', label_zh: '欧洲与非洲' },
    ],
  },
  {
    key: 'splitRule',
    name_en: 'Split Assignment Rule',
    name_zh: '分组规则',
    category: 'competition',
    options: [
      { value: 'First Come First Served', label_en: 'First Come First Served', label_zh: '先到先得' },
      { value: 'By Skill', label_en: 'By Skill', label_zh: '按实力' },
      { value: 'Manual', label_en: 'Manual', label_zh: '手动' },
      { value: 'Random', label_en: 'Random', label_zh: '随机' },
    ],
  },
  {
    key: 'eligibilitySource',
    name_en: 'Eligibility Source',
    name_zh: '参赛资格来源',
    category: 'competition',
    options: [
      { value: 'roundRegistration', label_en: 'Round Registration', label_zh: '分站报名' },
      { value: 'previousStageResult', label_en: 'Previous Stage Result', label_zh: '上一阶段成绩' },
      { value: 'manualInvite', label_en: 'Manual Invite', label_zh: '手动邀请' },
    ],
  },
  {
    key: 'resultStatus',
    name_en: 'Result Status',
    name_zh: '成绩状态',
    category: 'result',
    options: [
      { value: 'Finished', label_en: 'Finished', label_zh: '完赛' },
      { value: 'DNF', label_en: 'DNF', label_zh: '未完赛' },
      { value: 'DNS', label_en: 'DNS', label_zh: '未发车' },
      { value: 'DSQ', label_en: 'DSQ', label_zh: '取消资格' },
      { value: 'Qualified', label_en: 'Qualified', label_zh: '晋级' },
      { value: 'Eliminated', label_en: 'Eliminated', label_zh: '淘汰' },
    ],
  },
  {
    key: 'protestStatus',
    name_en: 'Protest Status',
    name_zh: '抗议状态',
    category: 'protest',
    options: [
      { value: 'pending', label_en: 'Pending', label_zh: '待处理' },
      { value: 'reviewing', label_en: 'Reviewing', label_zh: '审核中' },
      { value: 'resolved', label_en: 'Resolved', label_zh: '已裁决' },
      { value: 'dismissed', label_en: 'Dismissed', label_zh: '已驳回' },
    ],
  },
  {
    key: 'penaltyType',
    name_en: 'Penalty Type',
    name_zh: '处罚类型',
    category: 'protest',
    options: [
      { value: 'warning', label_en: 'Warning', label_zh: '警告' },
      { value: 'timePenalty', label_en: 'Time Penalty', label_zh: '时间处罚' },
      { value: 'positionDrop', label_en: 'Position Drop', label_zh: '名次降级' },
      { value: 'disqualifyRace', label_en: 'Disqualify (Race)', label_zh: '取消资格（本场）' },
      { value: 'disqualifyChampionship', label_en: 'Disqualify (Championship)', label_zh: '取消资格（整个赛事）' },
      { value: 'raceBan', label_en: 'Race Ban', label_zh: '禁赛' },
      { value: 'timeBan', label_en: 'Time Ban', label_zh: '限时封禁' },
    ],
  },
  {
    key: 'banType',
    name_en: 'Ban Type',
    name_zh: '封禁类型',
    category: 'user',
    options: [
      { value: 'warning', label_en: 'Warning', label_zh: '警告' },
      { value: 'temporary', label_en: 'Temporary Ban', label_zh: '临时封禁' },
      { value: 'permanent', label_en: 'Permanent Ban', label_zh: '永久封禁' },
      { value: 'race', label_en: 'Race Suspension', label_zh: '禁赛' },
    ],
  },
  {
    key: 'newsCategory',
    name_en: 'News Category',
    name_zh: '新闻分类',
    category: 'news',
    options: [
      { value: 'event', label_en: 'Event Announcement', label_zh: '赛事公告' },
      { value: 'platform', label_en: 'Platform Update', label_zh: '平台更新' },
      { value: 'review', label_en: 'Race Review', label_zh: '赛事回顾' },
      { value: 'other', label_en: 'Other', label_zh: '其他' },
    ],
  },
  {
    key: 'notificationType',
    name_en: 'Notification Type',
    name_zh: '通知类型',
    category: 'notification',
    options: [
      { value: 'registration', label_en: 'Registration', label_zh: '报名' },
      { value: 'cancellation', label_en: 'Cancellation', label_zh: '取消' },
      { value: 'results', label_en: 'Results', label_zh: '成绩' },
      { value: 'protest', label_en: 'Protest', label_zh: '抗议' },
      { value: 'system', label_en: 'System', label_zh: '系统' },
    ],
  },
  {
    key: 'notificationRecipient',
    name_en: 'Notification Recipient',
    name_zh: '通知接收者',
    category: 'notification',
    options: [
      { value: 'all', label_en: 'All Users', label_zh: '所有用户' },
      { value: 'registered', label_en: 'Registered Drivers', label_zh: '已注册车手' },
      { value: 'specific', label_en: 'Specific Users', label_zh: '指定用户' },
    ],
  },
  {
    key: 'notificationChannel',
    name_en: 'Notification Channel',
    name_zh: '通知渠道',
    category: 'notification',
    options: [
      { value: 'inApp', label_en: 'In-App Only', label_zh: '仅应用内' },
      { value: 'email', label_en: 'Email Only', label_zh: '仅邮件' },
      { value: 'both', label_en: 'In-App + Email', label_zh: '应用内 + 邮件' },
    ],
  },
]
