/**
 * 清理城市名称，去掉后缀词
 */
export function cleanCityName(city: string): string {
  // 需要去掉的后缀词（包括时间词）
  const suffixes = ['的', '市', '今天', '明天', '后天', '大后天', '昨天', '前天'];

  let cleaned = city.trim();

  // 去掉末尾的后缀词
  for (const suffix of suffixes) {
    if (cleaned.endsWith(suffix)) {
      cleaned = cleaned.slice(0, -suffix.length);
    }
  }

  // 处理"浙江省杭州市"这种情况，提取最后一个城市名
  // 匹配"省"或"市"后面的城市名
  const provinceCityMatch = cleaned.match(/(?:省|市)([\u4e00-\u9fa5]{2,7})$/);
  if (provinceCityMatch) {
    cleaned = provinceCityMatch[1];
  }

  // 再次清理可能残留的后缀
  for (const suffix of suffixes) {
    if (cleaned.endsWith(suffix)) {
      cleaned = cleaned.slice(0, -suffix.length);
    }
  }

  return cleaned.trim();
}
/**
 * 从用户消息中提取城市名称
 */
export function extractCity(message: string): string | null {
  // 扩展的天气相关问法模式
  const patterns = [
    // "嘉兴天气"、"嘉兴市的天气"、"嘉兴市天气"
    /([\u4e00-\u9fa5]{2,10})(?:市)?(?:的)?(?:今天|明天|后天)?天气/,
    // "天气怎么样"后面跟城市
    /天气.*(?:怎么样|如何).*?([\u4e00-\u9fa5]{2,10})/,
    // "上海今天天气"
    /([\u4e00-\u9fa5]{2,10})(?:今天|明天|后天)?天气/,
    // "北京明天会下雨吗"
    /([\u4e00-\u9fa5]{2,10})(?:今天|明天|后天)?.*?(?:冷|热|下雨|下雪|刮风)/,
    // "查...天气"
    /查.*?([\u4e00-\u9fa5]{2,10}).*?(?:天气|气温|温度)/,
    // "浙江省杭州市天气"
    /([\u4e00-\u9fa5]{2,4}省)?([\u4e00-\u9fa5]{2,10}市)天气/,
  ];
  for (const pattern of patterns) {
    const match = message.match(pattern);
    // 优先使用第二个捕获组（针对"浙江省杭州市"这种情况）
    const rawCity = match?.[2] || match?.[1];
    if (rawCity) {
      return cleanCityName(rawCity);
    }
  }
  return null;
}
/**
 * 检查是否是天气相关查询
 */
export function isWeatherQuery(message: string): boolean {
  const weatherKeywords = ['天气', '气温', '温度', '下雨', '下雪', '刮风', '雾霾', '空气质量'];
  return weatherKeywords.some(keyword => message.includes(keyword));
}