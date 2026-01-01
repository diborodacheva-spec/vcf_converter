
import React, { useState, useCallback, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { processVcf } from './vcfProcessor';
import { ProcessingStatus, ConversionStats } from './types';

// Constants
const MODEL_NAME = 'gemini-3-flash-preview';

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>({ step: 'idle', progress: 0, message: '' });
  const [stats, setStats] = useState<ConversionStats | null>(null);
  const [convertedContent, setConvertedContent] = useState<string | null>(null);
  const [showAiHelp, setShowAiHelp] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.toLowerCase().endsWith('.vcf')) {
        alert('Пожалуйста, выберите файл в формате .vcf');
        return;
      }
      setFile(selectedFile);
      setStatus({ step: 'idle', progress: 0, message: 'Файл готов к конвертации' });
      setStats(null);
      setConvertedContent(null);
    }
  };

  const runConversion = async () => {
    if (!file) return;

    setStatus({ step: 'reading', progress: 0, message: 'Начинаем преобразование...' });

    try {
      const result = await processVcf(file, (progress, message) => {
        setStatus(prev => ({ ...prev, progress, message }));
      });
      
      setConvertedContent(result.content);
      setStats(result.stats);
      setStatus({ step: 'completed', progress: 100, message: 'Успешно сконвертировано!' });
    } catch (error) {
      console.error(error);
      setStatus({ step: 'error', progress: 0, message: 'Ошибка при чтении файла. Проверьте формат.' });
    }
  };

  const downloadFile = () => {
    if (!convertedContent || !file) return;
    const blob = new Blob([convertedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${file.name.replace('.vcf', '')}_GEDmatch_ready.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const askAi = async () => {
    setShowAiHelp(true);
    setAiResponse('Генерация ответа...');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Пользователь использует конвертер Genotek VCF в GEDmatch TXT. 
      GEDmatch требует сборку GRCh37 (Build 37). 
      ${stats ? `Статистика файла: Всего SNP: ${stats.totalVariants}, Обработано: ${stats.processedVariants}, Сборка: ${stats.referenceBuild || 'Не определена'}` : ''}
      Объясни кратко на русском, почему формат 23andMe является стандартом и почему важно использовать Build 37 для GEDmatch. Дай совет по исправлению ошибки "GEDmatch не принимает файл".`;
      
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
      });
      setAiResponse(response.text || 'Не удалось получить ответ от AI.');
    } catch (err) {
      setAiResponse('Ошибка соединения с AI-помощником. Попробуйте позже.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <i className="fas fa-dna text-xl"></i>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-slate-800 leading-none">Genotek to GEDmatch</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">DNA Raw Data Converter</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <span className="hidden lg:inline text-xs text-slate-400">Безопасная конвертация VCF в TXT</span>
             <button 
                onClick={askAi}
                className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
             >
               <i className="fas fa-magic"></i> Помощь AI
             </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          
          {/* Uploader Section */}
          <div className={`p-8 md:p-12 ${status.step !== 'idle' && status.step !== 'error' ? 'opacity-50 pointer-events-none' : ''}`}>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-4">
              Конвертер Genotek в GEDmatch: преобразование VCF в TXT
            </h1>
            <p className="text-slate-600 mb-8 text-lg leading-relaxed">
              Если ваш <b>GEDmatch не принимает файл Genotek</b>, используйте этот инструмент. Мы преобразуем ваши сырые данные (raw data) из формата VCF в стандартный формат <b>23andMe (Build 37)</b>, который также поддерживается MyHeritage и FTDNA.
            </p>

            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-blue-100 rounded-2xl p-16 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all group"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".vcf"
              />
              <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <i className="fas fa-file-export text-3xl text-blue-500"></i>
              </div>
              <div className="text-xl font-bold text-slate-700 mb-2">
                {file ? file.name : 'Выберите файл Genotek (.vcf)'}
              </div>
              <p className="text-slate-400">Нажмите здесь, чтобы загрузить файл для обработки</p>
            </div>

            {file && status.step === 'idle' && (
              <div className="mt-10 flex flex-col items-center">
                <button 
                  onClick={runConversion}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-12 rounded-full shadow-xl shadow-blue-200 hover:shadow-blue-300 transition-all flex items-center gap-3 text-lg"
                >
                  <i className="fas fa-bolt"></i> Конвертировать в формат GEDmatch
                </button>
                <p className="text-xs text-slate-400 mt-4 italic">Обработка происходит локально, данные не покидают ваш браузер.</p>
              </div>
            )}
          </div>

          {/* Progress Section */}
          {(status.step !== 'idle' && status.step !== 'completed') && (
            <div className="bg-slate-50 p-10 border-t border-slate-100">
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-slate-700 flex items-center gap-2">
                  <i className="fas fa-spinner fa-spin text-blue-500"></i> {status.message}
                </span>
                <span className="text-blue-600 font-black text-xl">{status.progress}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden shadow-inner">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-300 rounded-full" 
                  style={{ width: `${status.progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Results Section */}
          {status.step === 'completed' && stats && (
            <div className="p-10 border-t border-green-100 bg-green-50/20">
              <div className="flex items-center gap-5 mb-8">
                <div className="bg-green-500 text-white w-12 h-12 flex items-center justify-center rounded-full shadow-lg shadow-green-200 shrink-0">
                  <i className="fas fa-check text-xl"></i>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800 leading-tight">Файл успешно подготовлен!</h3>
                  <p className="text-slate-600">Готов к загрузке на GEDmatch как "23andMe format".</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2">Найдено SNP</p>
                  <p className="text-2xl font-black text-slate-800">{stats.totalVariants.toLocaleString()}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm border-l-4 border-l-green-500">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2">Успешно сконвертировано</p>
                  <p className="text-2xl font-black text-green-600">{stats.processedVariants.toLocaleString()}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2">Сборка ДНК (Build)</p>
                  <p className="text-2xl font-black text-blue-600">{stats.referenceBuild || 'GRCh37 / hg19'}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                <button 
                  onClick={downloadFile}
                  className="w-full sm:w-auto bg-slate-900 hover:bg-black text-white font-bold py-4 px-12 rounded-full shadow-xl transition-all flex items-center justify-center gap-3 text-lg"
                >
                  <i className="fas fa-cloud-download-alt"></i> Скачать TXT файл
                </button>
                <button 
                  onClick={() => {
                    setFile(null);
                    setStatus({ step: 'idle', progress: 0, message: '' });
                    setStats(null);
                    setConvertedContent(null);
                  }}
                  className="text-slate-400 hover:text-slate-700 text-sm font-bold uppercase tracking-widest py-2 px-4"
                >
                  Конвертировать другой файл
                </button>
              </div>
            </div>
          )}
        </div>

        {/* AI Help Panel */}
        {showAiHelp && (
          <div className="mt-8 bg-white border-2 border-blue-100 rounded-2xl p-8 relative shadow-xl shadow-blue-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button 
              onClick={() => setShowAiHelp(false)}
              className="absolute top-4 right-4 text-slate-300 hover:text-slate-500 transition-colors"
            >
              <i className="fas fa-times-circle text-xl"></i>
            </button>
            <div className="flex gap-6">
              <div className="shrink-0 bg-blue-600 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                <i className="fas fa-robot text-white text-xl"></i>
              </div>
              <div className="prose prose-slate max-w-none">
                <h4 className="font-black text-slate-900 text-xl mb-4">Советы по конвертации Genotek</h4>
                <div className="text-slate-700 whitespace-pre-line leading-relaxed text-sm">
                  {aiResponse}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SEO-Rich Instructions & FAQ */}
        <section className="mt-16 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-5 flex items-center gap-3">
                <i className="fas fa-question-circle text-blue-500"></i> Почему GEDmatch не принимает VCF от Genotek?
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Прямая <b>загрузка данных Генотек на GEDmatch</b> часто вызывает ошибки, так как файлы экспорта VCF содержат техническую информацию, которую сервис сравнения ДНК не умеет парсить. Наш конвертер извлекает только нужные SNP и переводит их в формат <b>Genotek raw data converter</b>, имитирующий стандарт 23andMe.
              </p>
              <ul className="space-y-2 text-sm text-slate-500">
                <li className="flex items-start gap-2">
                  <i className="fas fa-check-circle text-green-500 mt-1"></i> 
                  <span>Автоматическое исправление формата хромосом</span>
                </li>
                <li className="flex items-start gap-2">
                  <i className="fas fa-check-circle text-green-500 mt-1"></i> 
                  <span>Приведение генотипов к стандарту Build 37</span>
                </li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-5 flex items-center gap-3">
                <i className="fas fa-info-circle text-blue-500"></i> Как загрузить ДНК на GEDmatch?
              </h2>
              <ol className="list-decimal list-inside space-y-3 text-sm text-slate-600">
                <li>Экспортируйте файл <b>VCF</b> из личного кабинета Genotek.</li>
                <li>Загрузите его в наш <b>конвертер vcf в 23andme</b>.</li>
                <li>Скачайте итоговый <b>TXT</b> файл.</li>
                <li>На GEDmatch выберите "Generic Upload (Fastest)".</li>
                <li>Укажите производителя "Other" или выберите 23andMe (v3).</li>
              </ol>
            </div>
          </div>

          <div className="bg-blue-600 rounded-3xl p-10 text-white shadow-2xl shadow-blue-200 flex flex-col md:flex-row items-center gap-8">
             <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-bold mb-3">Готовы расширить свои генеалогические поиски?</h3>
                <p className="text-blue-100 opacity-90 leading-relaxed">
                   Преобразование <b>VCF в формат GEDmatch</b> открывает доступ к базам MyHeritage, FamilyTreeDNA (FTDNA) и GEDmatch. Начните поиск родственников по всему миру уже сегодня!
                </p>
             </div>
             <button 
               onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
               className="bg-white text-blue-600 font-black py-4 px-10 rounded-full hover:bg-blue-50 transition-colors shrink-0"
             >
                Начать конвертацию
             </button>
          </div>
        </section>
      </main>

      {/* Footer & Privacy Notice */}
      <footer className="py-12 px-6 text-center border-t border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center gap-6 mb-6 text-slate-400">
             <i className="fab fa-github text-xl hover:text-slate-600 cursor-pointer"></i>
             <i className="fas fa-dna text-xl hover:text-slate-600 cursor-pointer"></i>
             <i className="fas fa-shield-alt text-xl hover:text-slate-600 cursor-pointer"></i>
          </div>
          <p className="text-slate-500 text-sm mb-2 font-bold">Genotek to GEDmatch Raw Data Converter v2.0</p>
          <p className="text-slate-400 text-xs leading-relaxed max-w-2xl mx-auto">
            Инструмент для конвертации <b>Генотек в GEDmatch</b>. Все права защищены. Обработка данных происходит на стороне клиента (Client-side DNA processing), что гарантирует 100% конфиденциальность. Мы не собираем и не храним ваши генетические файлы.
          </p>
        </div>
      </footer>
    </div>
  );
}
