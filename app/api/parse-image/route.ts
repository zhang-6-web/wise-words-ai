// app/api/vision/route.ts
import { NextRequest, NextResponse } from 'next/server';
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get('image') as File;
    const userQuestion = formData.get('question') as string || '请描述这张图片的内容';
    
    // 把图片转成base64
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const base64 = buffer.toString('base64');
    const imageDataUrl = `data:${imageFile.type};base64,${base64}`;
    // 调用智谱API
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.ZHIPU_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'glm-4v-flash',  // 免费的视觉模型
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: imageDataUrl  // 直接传base64格式
                }
              },
              {
                type: 'text',
                text: userQuestion
              }
            ]
          }
        ],
        max_tokens: 512,
        temperature: 0.3
      })
    });
    
    const data = await response.json();
    return NextResponse.json({ result: data.choices[0].message.content });
  } catch (error) {
    return NextResponse.json({ error: '处理失败' }, { status: 500 });
  }
}