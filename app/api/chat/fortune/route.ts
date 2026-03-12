
interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}
/**
 * 从用户消息中提取QQ号码
 */
export function extractQQNumber(message: string): string | null {
    // QQ号码格式：5-11位数字，不能以0开头
    const patterns = [
        // 匹配"QQ123456789"、"QQ号123456"等
        /[Qq][Qq](?:号码?)?[:：]?\s*([1-9][0-9]{4,10})/,
        // 匹配纯数字（5-11位），可能是QQ号
        /\b([1-9][0-9]{4,10})\b/,
        // 匹配"我的QQ是123456"
        /[Qq][Qq](?:号码?)?(?:是|为)?\s*([1-9][0-9]{4,10})/,
        // 匹配"测一下123456这个QQ"
        /([1-9][0-9]{4,10}).*?(?:QQ|号码|吉凶|测试)/
    ];

    for (const pattern of patterns) {
        const match = message.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    return null;
}

/**
 * 检查是否是QQ吉凶查询
 */
export function isQQFortuneQuery(message: string): boolean {
    const keywords = [
        'QQ', 'qq', 'Qq', 'qQ',  // QQ的各种写法
        'QQ号', 'qq号', 'QQ号码', 'qq号码',
        '测吉凶', '吉凶测试', '运势', '打分',
        '好不好', '怎么样'  // 结合QQ出现的语境
    ];

    // 必须包含QQ相关词，或者包含数字+吉凶相关词
    const hasQQKeyword = keywords.some(keyword => message.includes(keyword));
    const hasNumberAndFortune = /\b[1-9][0-9]{4,10}\b/.test(message) &&
        (message.includes('吉凶') || message.includes('运势') || message.includes('测'));

    return hasQQKeyword || hasNumberAndFortune;
}