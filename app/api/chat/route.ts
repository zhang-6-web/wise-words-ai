import { streamText } from 'ai';
import { deepseek } from '@ai-sdk/deepseek';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { extractQQNumber, isQQFortuneQuery } from './fortune/route';
import { extractCity, isWeatherQuery } from './weather/route';

// ============ 类型定义 ============
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  settings?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
  };
}

interface QueryContext {
  userMessage: string;
  env: {
    weatherKey?: string;
    fortuneKey?: string;
  };
}

interface QueryResult {
  success: boolean;
  data?: string;
  error?: string;
  type: string;
}

// ============ 查询处理器（策略模式） ============
type QueryHandler = (ctx: QueryContext) => Promise<QueryResult | null>;

const weatherHandler: QueryHandler = async ({ userMessage, env }) => {
  if (!isWeatherQuery(userMessage)) return null;
  if (!env.weatherKey) {
    return { type: 'weather', success: false, error: '天气服务未配置' };
  }

  const city = extractCity(userMessage);
  
  try {
    // 1. 获取城市ID
    const geoRes = await fetch(
      `https://pp3jpgvnhx.re.qweatherapi.com/geo/v2/city/lookup?location=${city}&key=${env.weatherKey}`
    );
    const geoData = await geoRes.json();
    
    if (geoData.code !== '200' || !geoData.location?.length) {
      return { type: 'weather', success: false, error: `未找到城市"${city}"` };
    }

    const loc = geoData.location[0];
    const fullCityName = `${loc.adm1}${loc.adm2}${loc.name === loc.adm2 ? '' : loc.name}`;

    // 2. 获取实时天气
    const weatherRes = await fetch(
      `https://pp3jpgvnhx.re.qweatherapi.com/v7/weather/now?location=${loc.id}&key=${env.weatherKey}`
    );
    const weatherData = await weatherRes.json();

    if (weatherData.code !== '200') {
      return { type: 'weather', success: false, error: `天气数据错误: ${weatherData.code}` };
    }

    const now = weatherData.now;
    const data = `${fullCityName}实时天气
🌡️ 温度：${now.temp}°C
☁️ 天气：${now.text}
💨 风向：${now.windDir}（${now.windScale}级）
💧 湿度：${now.humidity}%
👀 体感温度：${now.feelsLike}°C
☁️ 云量：${now.cloud}%
💧 降水量：${now.precip}mm
🔆 能见度：${now.vis}km
⏰ 数据时间：${weatherData.updateTime}
📡 数据来源：和风天气`;

    return { type: 'weather', success: true, data };

  } catch (err) {
    return { 
      type: 'weather', 
      success: false, 
      error: err instanceof Error ? err.message : '天气查询失败' 
    };
  }
};

const qqFortuneHandler: QueryHandler = async ({ userMessage, env }) => {
  if (!isQQFortuneQuery(userMessage)) return null;
  if (!env.fortuneKey) {
    return { type: 'qqFortune', success: false, error: 'QQ吉凶服务未配置' };
  }

  const qqNumber = extractQQNumber(userMessage);
  if (!qqNumber) {
    return { type: 'qqFortune', success: false, error: '未识别到有效的QQ号码（需5-11位数字）' };
  }

  try {
    const res = await fetch(
      `http://japi.juhe.cn/qqevaluate/qq?key=${env.fortuneKey}&qq=${qqNumber}`
    );
    const data = await res.json();

    if (data.error_code !== 0 || !data.result?.data) {
      const errorMap: Record<number, string> = {
        10002: 'API权限不足，请先申请QQ吉凶查询API',
        10003: 'API密钥已过期，请重新配置',
        10012: 'QQ号码格式不正确，请输入5-11位数字',
        10013: 'API调用次数已达上限',
      };
      return { 
        type: 'qqFortune', 
        success: false, 
        error: errorMap[data.error_code] || `查询失败: ${data.reason || data.error_code}` 
      };
    }

    const result = data.result.data;
    const info = `QQ号码：${qqNumber}
📊 测试结论：${result.conclusion}
📝 详细分析：${result.analysis}
💡 数据来源：聚合数据
✨ 温馨提示：测试结果仅供娱乐，切勿当真`;

    return { type: 'qqFortune', success: true, data: info };

  } catch (err) {
    return { 
      type: 'qqFortune', 
      success: false, 
      error: err instanceof Error ? err.message : 'QQ吉凶查询失败' 
    };
  }
};

// ============ 提示词构建器 ============
class PromptBuilder {
  private basePrompt: string;
  private sections: string[] = [];

  constructor(basePrompt: string) {
    this.basePrompt = basePrompt;
  }

  addQueryResult(result: QueryResult): this {
    if (result.success && result.data) {
      this.sections.push(this.formatSuccessResult(result));
    } else {
      this.sections.push(this.formatErrorResult(result));
    }
    return this;
  }

  addSpecialNotice(userMessage: string): this {
    // 特殊场景提示
    if (userMessage.includes('昨天') || userMessage.includes('前天')) {
      this.sections.push(`【重要提示】
用户询问的是历史天气，但天气API只提供今天和未来预报。
请说明无法查询历史天气的原因，并提供今天天气作为参考。`);
    }
    
    if (userMessage.includes('多个') || userMessage.includes('批量')) {
      this.sections.push(`【重要提示】
用户似乎想批量查询，但目前API只支持单个查询。
请说明无法批量查询，建议逐个查询。`);
    }
    
    return this;
  }

  build(): string {
    const extraSections = this.sections.length > 0 
      ? '\n\n' + this.sections.join('\n\n') 
      : '';
    return this.basePrompt + extraSections;
  }

  private formatSuccessResult(result: QueryResult): string {
    const headers: Record<string, string> = {
      weather: '实时天气数据（来自和风天气API）',
      qqFortune: 'QQ吉凶测试结果（来自聚合数据API）',
    };

    return `========== ${headers[result.type] || '查询结果'} ==========
${result.data}
========== 数据结束 ==========
【回答要求】
- 直接告诉用户上述数据
- 必须与上述数据完全一致，禁止编造
- 必须提及数据来源${result.type === 'qqFortune' ? '并强调仅供娱乐' : ''}`;
  }

  private formatErrorResult(result: QueryResult): string {
    return `【系统提示】
查询失败：${result.error}
请礼貌地告诉用户暂时无法查询，解释原因，不要编造数据。`;
  }
}

// ============ 主处理流程 ============
export async function POST(req: Request) {
  try {
    // 1. 身份验证
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return jsonResponse({ error: '未登录，请先登录' }, 401);
    }

    // 2. 解析请求
    const { messages, settings }: ChatRequest = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return jsonResponse({ error: 'Messages are required' }, 400);
    }

    // 3. 准备环境
    const lastMessage = messages[messages.length - 1];
    const context: QueryContext = {
      userMessage: lastMessage.content,
      env: {
        weatherKey: process.env.QWEATHER_API_KEY,
        fortuneKey: process.env.JUHE_API_KEY,
      },
    };

    // 4. 执行所有查询处理器（并行）
    const handlers = [weatherHandler, qqFortuneHandler];
    const results = await Promise.all(
      handlers.map(h => h(context))
    );

    // 5. 构建系统提示词
    const builder = new PromptBuilder(
      settings?.systemPrompt || '你是一个智能助手，可以帮助用户解答各种问题。'
    );

    // 添加查询结果
    results.filter((r): r is QueryResult => r !== null)
           .forEach(r => builder.addQueryResult(r));
    
    // 添加特殊场景提示
    builder.addSpecialNotice(lastMessage.content);

    // 6. 调用AI
    const result = streamText({
      model: deepseek(settings?.model || 'deepseek-chat'),
      messages: [
        { role: 'system', content: builder.build() },
        ...messages,
      ],
      temperature: settings?.temperature ?? 0.7,
    });

    return result.toTextStreamResponse();

  } catch (error) {
    console.error('Chat API error:', error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Internal server error' }, 
      500
    );
  }
}

// ============ 工具函数 ============
function jsonResponse(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}