/**
 * توابع مفید برای کار با متن
 */

/**
 * محاسبه تعداد کاراکترهای یک متن
 * @param text متن ورودی
 * @returns تعداد کاراکترها
 */
export const countCharacters = (text: string): number => {
  if (!text) return 0;
  return text.length;
};

/**
 * محاسبه تعداد کلمات یک متن
 * @param text متن ورودی
 * @returns تعداد کلمات
 */
export const countWords = (text: string): number => {
  if (!text) return 0;
  
  // حذف کاراکترهای خط جدید و تبدیل به فاصله
  const cleanText = text.replace(/\n/g, ' ');
  
  // تقسیم متن بر اساس فاصله و حذف آرایه‌های خالی
  const words = cleanText.split(/\s+/).filter(word => word.length > 0);
  
  return words.length;
};

/**
 * محاسبه تخمین زمان خواندن یک متن
 * میانگین سرعت خواندن: 200 کلمه در دقیقه
 * @param text متن ورودی
 * @returns زمان خواندن به صورت رشته (دقیقه:ثانیه)
 */
export const estimateReadingTime = (text: string): string => {
  if (!text) return '0:00';
  
  const wordCount = countWords(text);
  
  // تخمین زمان خواندن (میانگین 200 کلمه در دقیقه)
  const minutes = Math.floor(wordCount / 200);
  const seconds = Math.floor((wordCount % 200) / (200 / 60));
  
  // قالب‌بندی زمان
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * محاسبه آمار متن (تعداد کاراکترها، کلمات و زمان خواندن)
 * @param text متن ورودی
 * @returns آبجکت حاوی آمار متن
 */
export const getTextStats = (text: string) => {
  return {
    charCount: countCharacters(text),
    wordCount: countWords(text),
    readingTime: estimateReadingTime(text)
  };
}; 