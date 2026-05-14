export interface ManagedOption {
  value: string
  label_en: string
  label_zh: string
}

export interface OptionGroup {
  key: string
  name_en: string
  name_zh: string
  options: ManagedOption[]
}

export const optionGroups: OptionGroup[] = [
  {
    key: 'weather',
    name_en: 'Weather',
    name_zh: '天气',
    options: [
      { value: 'Clear', label_en: 'Clear', label_zh: '晴天' },
      { value: 'Cloudy', label_en: 'Cloudy', label_zh: '多云' },
      { value: 'Overcast', label_en: 'Overcast', label_zh: '阴天' },
      { value: 'LightRain', label_en: 'Light Rain', label_zh: '小雨' },
      { value: 'HeavyRain', label_en: 'Heavy Rain', label_zh: '大雨' },
      { value: 'Thunderstorm', label_en: 'Thunderstorm', label_zh: '雷暴' },
      { value: 'Fog', label_en: 'Fog', label_zh: '雾天' },
      { value: 'Dynamic', label_en: 'Dynamic', label_zh: '动态天气' },
      { value: 'Night', label_en: 'Night', label_zh: '夜间' },
      { value: 'NightRain', label_en: 'Night Rain', label_zh: '夜间雨天' },
    ],
  },
  {
    key: 'carClass',
    name_en: 'Car Class',
    name_zh: '车型组',
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
]
