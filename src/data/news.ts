export interface NewsArticle {
  id: string
  title_zh: string
  title_en: string
  content_zh: string
  content_en: string
  coverImage: string
  category: 'event' | 'platform' | 'review' | 'other'
  regions: Array<'CN' | 'AP' | 'AM' | 'EU'>
  isPinned: boolean
  publishedAt: string
  author: string
  relatedEventIds?: string[]
}

export const news: NewsArticle[] = [
  {
    id: 'n1',
    title_zh: 'MOZA GT3 挑战赛 2026 正式启动',
    title_en: 'MOZA GT3 Challenge 2026 Officially Launched',
    content_zh: 'MOZA Racing 宣布2026赛季GT3挑战赛正式启动！本赛季共5站比赛。首站将于4月20日在意大利蒙扎举行。欢迎所有MOZA用户及模拟赛车爱好者报名参加！\n\n本赛季亮点：\n- 全新积分系统\n- 多Split自动分组\n- 赛事直播覆盖\n- 丰厚奖品',
    content_en: 'MOZA Racing announces the launch of the 2026 GT3 Challenge! This season features 5 rounds. The opener takes place at Monza, Italy on April 20th. All MOZA users and sim racing enthusiasts are welcome!\n\nSeason Highlights:\n- New points system\n- Multi-Split auto assignment\n- Live stream coverage\n- Great prizes',
    coverImage: '',
    category: 'event',
    regions: ['CN', 'AP', 'AM', 'EU'],
    isPinned: true,
    publishedAt: '2026-04-10T09:00:00Z',
    author: 'MOZA Racing',
    relatedEventIds: ['e1'],
  },
  {
    id: 'n2',
    title_zh: 'Racing Arcade 平台功能更新 - 车队系统上线',
    title_en: 'Racing Arcade Platform Update - Team System Launch',
    content_zh: '我们很高兴地宣布，Racing Arcade 平台现已支持车队管理功能！车手可以创建车队、邀请成员、以车队名义参加团队赛事。\n\n新功能包括：\n- 车队创建与管理\n- 成员邀请与移除\n- 队长转让\n- 车队公开页面',
    content_en: 'We are excited to announce that Racing Arcade now supports team management! Drivers can create teams, invite members, and compete as a team.\n\nNew features:\n- Team creation & management\n- Member invitations\n- Captain transfer\n- Public team pages',
    coverImage: '',
    category: 'platform',
    regions: ['CN', 'AP', 'AM', 'EU'],
    isPinned: false,
    publishedAt: '2026-04-12T14:00:00Z',
    author: 'Racing Arcade Team',
  },
  {
    id: 'n3',
    title_zh: '斯帕站赛事回顾 - SilverArrow 完美夺冠',
    title_en: 'Spa Race Review - SilverArrow Takes Victory',
    content_zh: '在昨晚结束的LMP2锦标赛斯帕站中，SilverArrow以出色的表现夺得冠军。比赛在动态天气条件下进行，多位车手展现了精湛的雨战技巧。\n\n最终成绩：\n1. SilverArrow - 1:28:15.234\n2. DriftKing - +17.657\n3. StormChaser - +46.333',
    content_en: 'SilverArrow took a dominant victory in last night\'s LMP2 Championship at Spa. The race featured dynamic weather conditions with several drivers showcasing superb wet-weather skills.\n\nFinal Results:\n1. SilverArrow - 1:28:15.234\n2. DriftKing - +17.657\n3. StormChaser - +46.333',
    coverImage: '',
    category: 'review',
    regions: ['EU'],
    isPinned: false,
    publishedAt: '2026-04-16T21:00:00Z',
    author: 'MOZA Racing',
    relatedEventIds: ['e4'],
  },
  {
    id: 'n4',
    title_zh: 'AC Evo 赛事即将上线',
    title_en: 'AC Evo Events Coming Soon',
    content_zh: '随着Assetto Corsa Evo的发布，Racing Arcade 将在5月开始举办AC Evo相关赛事。敬请期待！',
    content_en: 'With the release of Assetto Corsa Evo, Racing Arcade will begin hosting AC Evo events starting in May. Stay tuned!',
    coverImage: '',
    category: 'event',
    regions: ['CN', 'AP', 'AM', 'EU'],
    isPinned: false,
    publishedAt: '2026-04-14T10:00:00Z',
    author: 'Racing Arcade Team',
  },
  {
    id: 'n5',
    title_zh: '耐力系列赛 - 伊莫拉站精彩回顾',
    title_en: 'AP Endurance Series - Imola Round Recap',
    content_zh: '耐力系列赛伊莫拉站在激烈的竞争中落下帷幕。TurboMaster以稳健的表现夺得冠军，全程2小时耐力赛中展现了出色的策略和轮胎管理。\n\n最终成绩：\n1. TurboMaster - 2:22:15.678\n2. ApexHunter - +8.234\n3. SilverArrow - +12.456\n\n下一站铃鹿站报名现已开放！',
    content_en: 'The AP Endurance Series Imola round concluded with thrilling competition. TurboMaster took the win with a consistent performance, showcasing excellent strategy and tire management throughout the 2-hour endurance race.\n\nFinal Results:\n1. TurboMaster - 2:22:15.678\n2. ApexHunter - +8.234\n3. SilverArrow - +12.456\n\nRegistration for the next round at Suzuka is now open!',
    coverImage: '',
    category: 'review',
    regions: ['AP', 'CN'],
    isPinned: false,
    publishedAt: '2026-04-02T18:00:00Z',
    author: 'MOZA Racing',
    relatedEventIds: ['e11', 'e2'],
  },
]
