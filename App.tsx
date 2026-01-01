
import React, { useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { processVcf } from './vcfProcessor';
import { ProcessingStatus, ConversionStats } from './types';

type Language = 'ru' | 'en' | 'fr' | 'es' | 'it' | 'zh';

const translations: Record<Language, any> = {
  ru: {
    title: "Конвертер Genotek в GEDmatch: VCF в TXT онлайн (бесплатно)",
    desc: "Не можете загрузить данные из Генотек на GEDmatch? Простой онлайн-конвертер преобразует файл сырых данных Genotek (VCF) в формат TXT, совместимый с GEDmatch, MyHeritage и FTDNA.",
    header_sub: "DNA Raw Data Converter",
    privacy_badge: "Безопасная конвертация",
    h1: "Конвертер Genotek в GEDmatch: преобразование VCF в TXT",
    uploader_p: "Если ваш GEDmatch не принимает файл Genotek, используйте этот инструмент. Мы преобразуем ваши сырые данные в стандартный формат 23andMe (Build 37).",
    drop_zone_init: "Выберите файл Genotek (.vcf)",
    drop_zone_sub: "Нажмите здесь, чтобы загрузить файл",
    btn_convert: "Конвертировать в формат GEDmatch",
    local_notice: "Обработка происходит локально, данные не покидают ваш браузер.",
    status_success: "Файл успешно подготовлен!",
    status_ready: "Готов к загрузке на GEDmatch как '23andMe format'.",
    stat_total: "Найдено SNP",
    stat_processed: "Сконвертировано",
    stat_build: "Сборка ДНК (Build)",
    btn_download: "Скачать TXT файл",
    btn_reset: "Конвертировать другой файл",
    ai_help_btn: "Помощь AI",
    ai_title: "Советы по конвертации",
    faq_1_q: "Почему GEDmatch не принимает VCF от Genotek?",
    faq_1_a: "Прямая загрузка часто вызывает ошибки из-за технических метаданных в VCF. Наш инструмент извлекает только нужные SNP.",
    faq_2_q: "Как загрузить ДНК на GEDmatch?",
    faq_2_a: "Экспортируйте VCF из Genotek, конвертируйте здесь, скачайте TXT и выберите 'Generic Upload' на GEDmatch.",
    footer_text: "Инструмент для конвертации Генотек в GEDmatch. Конфиденциальность гарантирована.",
    lang_name: "Русский"
  },
  en: {
    title: "Genotek to GEDmatch Converter: VCF to TXT online (Free)",
    desc: "Cannot upload Genotek DNA data to GEDmatch? This free online converter transforms Genotek (VCF) raw data files into a GEDmatch-compatible TXT format.",
    header_sub: "DNA Raw Data Converter",
    privacy_badge: "Safe conversion",
    h1: "Genotek to GEDmatch Converter: VCF to TXT",
    uploader_p: "If your GEDmatch doesn't accept Genotek files, use this tool. We transform raw data into standard 23andMe (Build 37) format.",
    drop_zone_init: "Select Genotek file (.vcf)",
    drop_zone_sub: "Click here to upload file for processing",
    btn_convert: "Convert to GEDmatch format",
    local_notice: "Processing is local, data never leaves your browser.",
    status_success: "File prepared successfully!",
    status_ready: "Ready for GEDmatch upload as '23andMe format'.",
    stat_total: "SNP Found",
    stat_processed: "Converted",
    stat_build: "DNA Build",
    btn_download: "Download TXT",
    btn_reset: "Convert another file",
    ai_help_btn: "AI Help",
    ai_title: "Conversion Tips",
    faq_1_q: "Why doesn't GEDmatch accept Genotek VCF?",
    faq_1_a: "Direct upload often fails due to technical metadata in VCF. Our tool extracts only necessary SNPs.",
    faq_2_q: "How to upload DNA to GEDmatch?",
    faq_2_a: "Export VCF from Genotek, convert here, download TXT, and use 'Generic Upload' on GEDmatch.",
    footer_text: "Genotek to GEDmatch conversion tool. Privacy guaranteed.",
    lang_name: "English"
  },
  fr: {
    title: "Convertisseur Genotek vers GEDmatch : VCF en TXT (Gratuit)",
    desc: "Impossible de charger les données Genotek sur GEDmatch ? Ce convertisseur transforme les fichiers VCF en format TXT compatible GEDmatch.",
    header_sub: "Convertisseur de données ADN",
    privacy_badge: "Conversion sécurisée",
    h1: "Convertisseur Genotek vers GEDmatch",
    uploader_p: "Si GEDmatch n'accepte pas votre fichier Genotek, utilisez cet outil pour le convertir au format 23andMe (Build 37).",
    drop_zone_init: "Choisir un fichier Genotek (.vcf)",
    drop_zone_sub: "Cliquez ici pour charger le fichier",
    btn_convert: "Convertir pour GEDmatch",
    local_notice: "Traitement local, les données ne quittent pas votre navigateur.",
    status_success: "Fichier prêt !",
    status_ready: "Prêt pour GEDmatch (format 23andMe).",
    stat_total: "SNP trouvés",
    stat_processed: "Convertis",
    stat_build: "Version (Build)",
    btn_download: "Télécharger le TXT",
    btn_reset: "Autre conversion",
    ai_help_btn: "Aide IA",
    ai_title: "Conseils de l'IA",
    faq_1_q: "Pourquoi GEDmatch refuse le VCF Genotek ?",
    faq_1_a: "Le format VCF contient des métadonnées incompatibles. Nous extrayons uniquement les SNP utiles.",
    faq_2_q: "Comment charger l'ADN ?",
    faq_2_a: "Exportez le VCF, convertissez-le ici, puis utilisez 'Generic Upload' sur GEDmatch.",
    footer_text: "Outil Genotek vers GEDmatch. Confidentialité garantie.",
    lang_name: "Français"
  },
  es: {
    title: "Convertidor Genotek a GEDmatch: VCF a TXT (Gratis)",
    desc: "¿No puedes subir datos de Genotek a GEDmatch? Este convertidor transforma archivos VCF en formato TXT compatible con GEDmatch.",
    header_sub: "Convertidor de datos de ADN",
    privacy_badge: "Conversión segura",
    h1: "Convertidor Genotek a GEDmatch",
    uploader_p: "Si GEDmatch no acepta el archivo de Genotek, usa esta herramienta para convertirlo al formato 23andMe (Build 37).",
    drop_zone_init: "Seleccionar archivo Genotek (.vcf)",
    drop_zone_sub: "Haz clic aquí para subir el archivo",
    btn_convert: "Convertir a formato GEDmatch",
    local_notice: "Procesamiento local, los datos no salen de tu navegador.",
    status_success: "¡Archivo listo!",
    status_ready: "Listo para GEDmatch (formato 23andMe).",
    stat_total: "SNP encontrados",
    stat_processed: "Convertidos",
    stat_build: "Versión (Build)",
    btn_download: "Descargar TXT",
    btn_reset: "Otra conversión",
    ai_help_btn: "Ayuda IA",
    ai_title: "Consejos de IA",
    faq_1_q: "¿Por qué GEDmatch no acepta VCF de Genotek?",
    faq_1_a: "El VCF incluye metadatos técnicos que causan errores. Extraemos solo los SNP necesarios.",
    faq_2_q: "¿Cómo subir el ADN?",
    faq_2_a: "Exporta VCF de Genotek, convierte aquí y usa 'Generic Upload' en GEDmatch.",
    footer_text: "Herramienta Genotek a GEDmatch. Privacidad garantizada.",
    lang_name: "Español"
  },
  it: {
    title: "Convertitore Genotek a GEDmatch: da VCF a TXT (Gratis)",
    desc: "Non riesci a caricare i dati Genotek su GEDmatch? Questo convertitore trasforma i file VCF in formato TXT compatibile con GEDmatch.",
    header_sub: "Convertitore dati DNA",
    privacy_badge: "Conversione sicura",
    h1: "Convertitore Genotek a GEDmatch",
    uploader_p: "Se GEDmatch non accetta il file Genotek, usa questo strumento per convertirlo nel formato 23andMe (Build 37).",
    drop_zone_init: "Seleziona file Genotek (.vcf)",
    drop_zone_sub: "Clicca qui per caricare il file",
    btn_convert: "Converti per GEDmatch",
    local_notice: "Elaborazione locale, i dati non lasciano il browser.",
    status_success: "File pronto!",
    status_ready: "Pronto per GEDmatch (formato 23andMe).",
    stat_total: "SNP trovati",
    stat_processed: "Convertiti",
    stat_build: "Versione (Build)",
    btn_download: "Scarica TXT",
    btn_reset: "Nuova conversione",
    ai_help_btn: "Aiuto IA",
    ai_title: "Consigli IA",
    faq_1_q: "Perché GEDmatch non accetta VCF Genotek?",
    faq_1_a: "Il formato VCF contiene metadati tecnici incompatibili. Estraiamo solo i SNP necessari.",
    faq_2_q: "Come caricare il DNA?",
    faq_2_a: "Esporta VCF, converti qui e usa 'Generic Upload' su GEDmatch.",
    footer_text: "Strumento Genotek a GEDmatch. Privacy garantita.",
    lang_name: "Italiano"
  },
  zh: {
    title: "Genotek至GEDmatch转换器：VCF转TXT（免费）",
    desc: "无法将Genotek数据上传到GEDmatch？此转换器可将VCF文件转换为兼容GEDmatch的TXT格式。",
    header_sub: "DNA原始数据转换器",
    privacy_badge: "安全转换",
    h1: "Genotek至GEDmatch转换器",
    uploader_p: "如果GEDmatch不接受Genotek文件，请使用此工具将其转换为23andMe（Build 37）格式。",
    drop_zone_init: "选择Genotek文件 (.vcf)",
    drop_zone_sub: "点击此处上传文件",
    btn_convert: "转换为GEDmatch格式",
    local_notice: "本地处理，数据不会离开您的浏览器。",
    status_success: "文件准备就绪！",
    status_ready: "已准备好以23andMe格式上传到GEDmatch。",
    stat_total: "找到的SNP",
    stat_processed: "已转换",
    stat_build: "基因组版本 (Build)",
    btn_download: "下载TXT文件",
    btn_reset: "重新转换",
    ai_help_btn: "AI帮助",
    ai_title: "AI 转换建议",
    faq_1_q: "为什么GEDmatch不接受Genotek VCF？",
    faq_1_a: "VCF格式包含不兼容的技术元数据。我们的工具仅提取必要的SNP。",
    faq_2_q: "如何上传DNA？",
    faq_2_a: "从Genotek导出VCF，在此转换，下载TXT，然后在GEDmatch上使用'Generic Upload'。",
    footer_text: "Genotek至GEDmatch转换工具。隐私保障。",
    lang_name: "简体中文"
  }
};

const MODEL_NAME = 'gemini-3-flash-preview';

export default function App() {
  const [lang, setLang] = useState<Language>('ru');
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>({ step: 'idle', progress: 0, message: '' });
  const [stats, setStats] = useState<ConversionStats | null>(null);
  const [convertedContent, setConvertedContent] = useState<string | null>(null);
  const [showAiHelp, setShowAiHelp] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = (key: string) => translations[lang][key] || key;

  // SEO Sync
  useLayoutEffect(() => {
    document.title = t('title');
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', t('desc'));
    document.documentElement.lang = lang;
  }, [lang]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.toLowerCase().endsWith('.vcf')) {
        alert(lang === 'ru' ? 'Пожалуйста, выберите файл .vcf' : 'Please select a .vcf file');
        return;
      }
      setFile(selectedFile);
      setStatus({ step: 'idle', progress: 0, message: t('drop_zone_init') });
      setStats(null);
      setConvertedContent(null);
    }
  };

  const runConversion = async () => {
    if (!file) return;
    setStatus({ step: 'reading', progress: 0, message: 'Processing...' });
    try {
      const result = await processVcf(file, (progress, message) => {
        setStatus(prev => ({ ...prev, progress, message }));
      });
      setConvertedContent(result.content);
      setStats(result.stats);
      setStatus({ step: 'completed', progress: 100, message: 'Done' });
    } catch (error) {
      console.error(error);
      setStatus({ step: 'error', progress: 0, message: 'Error' });
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
    setAiResponse('...');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const currentLangName = translations[lang].lang_name;
      const prompt = `The user is using a Genotek to GEDmatch DNA converter.
      The current UI language is ${currentLangName}.
      PLEASE RESPOND IN ${currentLangName}.
      Explain why Build 37 is crucial for GEDmatch and why Genotek's raw VCF might fail.
      Current stats: ${stats ? `${stats.totalVariants} SNPs found` : 'No file processed yet'}.`;
      
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
      });
      setAiResponse(response.text || 'Error');
    } catch (err) {
      setAiResponse('AI service unavailable.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <i className="fas fa-dna text-xl"></i>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-slate-800 leading-none">Genotek to GEDmatch</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{t('header_sub')}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 md:gap-6">
             {/* Language Switcher */}
             <div className="relative group">
               <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors">
                 <i className="fas fa-globe"></i>
                 <span>{translations[lang].lang_name}</span>
               </button>
               <div className="absolute right-0 top-full mt-2 bg-white border border-slate-100 shadow-xl rounded-xl py-2 w-32 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                 {(Object.keys(translations) as Language[]).map(l => (
                   <button 
                     key={l}
                     onClick={() => setLang(l)}
                     className={`w-full text-left px-4 py-1.5 text-xs hover:bg-blue-50 transition-colors ${lang === l ? 'text-blue-600 font-bold' : 'text-slate-600'}`}
                   >
                     {translations[l].lang_name}
                   </button>
                 ))}
               </div>
             </div>

             <button 
                onClick={askAi}
                className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
             >
               <i className="fas fa-magic"></i> <span className="hidden sm:inline">{t('ai_help_btn')}</span>
             </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          
          {/* Uploader Section */}
          <div className={`p-8 md:p-12 ${status.step !== 'idle' && status.step !== 'error' ? 'opacity-50 pointer-events-none' : ''}`}>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-4">{t('h1')}</h1>
            <p className="text-slate-600 mb-8 text-lg leading-relaxed">{t('uploader_p')}</p>

            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-blue-100 rounded-2xl p-16 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all group"
            >
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".vcf" />
              <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <i className="fas fa-file-export text-3xl text-blue-500"></i>
              </div>
              <div className="text-xl font-bold text-slate-700 mb-2">
                {file ? file.name : t('drop_zone_init')}
              </div>
              <p className="text-slate-400">{t('drop_zone_sub')}</p>
            </div>

            {file && status.step === 'idle' && (
              <div className="mt-10 flex flex-col items-center">
                <button 
                  onClick={runConversion}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-12 rounded-full shadow-xl shadow-blue-200 hover:shadow-blue-300 transition-all flex items-center gap-3 text-lg"
                >
                  <i className="fas fa-bolt"></i> {t('btn_convert')}
                </button>
                <p className="text-xs text-slate-400 mt-4 italic">{t('local_notice')}</p>
              </div>
            )}
          </div>

          {/* Progress Section */}
          {(status.step !== 'idle' && status.step !== 'completed') && (
            <div className="bg-slate-50 p-10 border-t border-slate-100 text-center">
               <div className="text-blue-600 font-black text-4xl mb-4">{status.progress}%</div>
               <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden shadow-inner max-w-md mx-auto">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-300 rounded-full" style={{ width: `${status.progress}%` }}></div>
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
                  <h3 className="text-2xl font-black text-slate-800 leading-tight">{t('status_success')}</h3>
                  <p className="text-slate-600">{t('status_ready')}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2">{t('stat_total')}</p>
                  <p className="text-2xl font-black text-slate-800">{stats.totalVariants.toLocaleString()}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm border-l-4 border-l-green-500">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2">{t('stat_processed')}</p>
                  <p className="text-2xl font-black text-green-600">{stats.processedVariants.toLocaleString()}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2">{t('stat_build')}</p>
                  <p className="text-2xl font-black text-blue-600">{stats.referenceBuild || 'GRCh37 / hg19'}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                <button 
                  onClick={downloadFile}
                  className="w-full sm:w-auto bg-slate-900 hover:bg-black text-white font-bold py-4 px-12 rounded-full shadow-xl transition-all flex items-center justify-center gap-3 text-lg"
                >
                  <i className="fas fa-cloud-download-alt"></i> {t('btn_download')}
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
                  {t('btn_reset')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* AI Help Panel */}
        {showAiHelp && (
          <div className="mt-8 bg-white border-2 border-blue-100 rounded-2xl p-8 relative shadow-xl shadow-blue-50">
            <button onClick={() => setShowAiHelp(false)} className="absolute top-4 right-4 text-slate-300 hover:text-slate-500"><i className="fas fa-times-circle text-xl"></i></button>
            <div className="flex gap-6">
              <div className="shrink-0 bg-blue-600 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                <i className="fas fa-robot text-white text-xl"></i>
              </div>
              <div className="prose prose-slate max-w-none">
                <h4 className="font-black text-slate-900 text-xl mb-4">{t('ai_title')}</h4>
                <div className="text-slate-700 whitespace-pre-line leading-relaxed text-sm">{aiResponse}</div>
              </div>
            </div>
          </div>
        )}

        {/* FAQ Section */}
        <section className="mt-16 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-5 flex items-center gap-3">
                <i className="fas fa-question-circle text-blue-500"></i> {t('faq_1_q')}
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed">{t('faq_1_a')}</p>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-5 flex items-center gap-3">
                <i className="fas fa-info-circle text-blue-500"></i> {t('faq_2_q')}
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed">{t('faq_2_a')}</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 px-6 text-center border-t border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto">
          <p className="text-slate-500 text-sm mb-2 font-bold">Genotek to GEDmatch v2.1</p>
          <p className="text-slate-400 text-xs leading-relaxed max-w-2xl mx-auto">{t('footer_text')}</p>
        </div>
      </footer>
    </div>
  );
}
