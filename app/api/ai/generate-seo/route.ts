import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt parametresi gereklidir' },
        { status: 400 }
      );
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Sen profesyonel bir SEO uzmanısın. Villa kiralama sektöründe Türkçe SEO içeriği konusunda uzmansın. Sadece pure JSON formatında yanıt ver, markdown veya ek açıklama ekleme.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      return NextResponse.json(
        { error: 'OpenAI yanıt oluşturamadı' },
        { status: 500 }
      );
    }

    try {
      // Markdown JSON formatını temizle (```json ve ``` kısımlarını kaldır)
      let cleanedContent = content.trim();
      
      // ```json ile başlıyorsa kaldır
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.replace(/^```json\s*/, '');
      }
      
      // ``` ile başlıyorsa kaldır (sadece ``` ile sarılmış olabilir)
      if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.replace(/^```\s*/, '');
      }
      
      // Sonunda ``` varsa kaldır
      if (cleanedContent.endsWith('```')) {
        cleanedContent = cleanedContent.replace(/\s*```$/, '');
      }
      
      // JSON yanıtını parse et
      const seoData = JSON.parse(cleanedContent);
      
      return NextResponse.json(seoData);
    } catch (parseError) {
      console.error('JSON parse hatası:', parseError);
      console.error('Orijinal content:', content);
      console.error('Temizlenmiş content:', content.trim().replace(/^```json\s*/, '').replace(/\s*```$/, ''));
      
      return NextResponse.json(
        { error: 'OpenAI yanıtı JSON formatında parse edilemedi' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('OpenAI API hatası:', error);
    return NextResponse.json(
      { error: 'SEO içeriği oluşturulurken hata oluştu' },
      { status: 500 }
    );
  }
} 