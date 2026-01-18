
import React, { useState, useRef, useEffect } from 'react';
import { detectChapters, analyzeCourseContent } from './services/geminiService';
import { auth, loginWithGoogle, logout } from './services/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { CourseAnalysis, AppStatus, ChatMessage, Chapter, AnalysisStyle } from './types';
import AnalysisResult from './components/AnalysisResult';
import { BrainCircuit, FileUp, RotateCcw, LogIn, LogOut, ChevronRight, Globe, Layers, Zap, CheckCircle, Gauge, AlertTriangle, XCircle, ArrowLeft, ShieldCheck, CloudIcon } from 'lucide-react';
import { openDrivePicker, initGoogleDrive } from './services/googleDriveService';

// Expanded and randomized content structure
const TRANSLATIONS: Record<string, any> = {
  español: {
    slogans: [
      { prefix: "Tus", suffix: ", simplificados." },
      { prefix: "Domina tus", suffix: " con IA." },
      { prefix: "Tus mejores", suffix: " empiezan aquí." },
      { prefix: "Transforma tus", suffix: " en éxito." }
    ],
    words: ["PDFs", "conocimientos", "clases", "temas", "estudios", "notas"],
    placeholder: "Pega el contenido del curso aquí...",
    upload: "Subir PDF o Word",
    drive: "Abrir de Drive",
    start: "EMPEZAR AHORA",
    detecting: "Analizando Material...",
    loadingMsg: "TuProfe está pensando profundamente...",
    cancel: "Cancelar y volver",
    temario: "Temario Detectado",
    selectChapter: "Selecciona un bloque a la izquierda para configurar tu lección",
    depthTitle: "¿Qué nivel de detalle buscas?",
    basic: "Resumen Básico",
    basicDesc: "Ideal para repasar los pilares fundamentales rápidamente.",
    medium: "Resumen Estándar",
    mediumDesc: "Equilibrio perfecto entre teoría y ejemplos prácticos.",
    hard: "Análisis Profundo",
    hardDesc: "Máximo detalle técnico y explicaciones exhaustivas.",
    internet: "Añadir Datos de Internet",
    internetDesc: "Incluye lo que la gente está preguntando en Google.",
    backToTemario: "Volver al Temario",
    entrar: "Entrar",
    salir: "Salir",
    secure: "Conexión segura SSL. Tus datos no se utilizan para entrenar modelos públicos."
  },
  english: {
    slogans: [
      { prefix: "Your", suffix: ", simplified." },
      { prefix: "Master your", suffix: " with AI." },
      { prefix: "Great", suffix: " start right here." },
      { prefix: "Turn your", suffix: " into expertise." }
    ],
    words: ["PDFs", "knowledge", "courses", "topics", "studies", "notes"],
    placeholder: "Paste your course content here...",
    upload: "Upload PDF or Word",
    drive: "Open from Drive",
    start: "START NOW",
    detecting: "Analyzing Material...",
    loadingMsg: "TuProfe is thinking deeply...",
    cancel: "Cancel and back",
    temario: "Detected Chapters",
    selectChapter: "Select a block on the left to configure your lesson",
    depthTitle: "What level of detail do you need?",
    basic: "Basic Summary",
    basicDesc: "Perfect for a quick review of core pillars.",
    medium: "Standard Summary",
    mediumDesc: "Balanced mix of theory and practical examples.",
    hard: "Deep Analysis",
    hardDesc: "Maximum technical detail and exhaustive explanations.",
    internet: "Add Internet Data",
    internetDesc: "Include what people are currently asking on Google.",
    backToTemario: "Back to Chapters",
    entrar: "Log In",
    salir: "Log Out",
    secure: "SSL Secure Connection. Your data is not used for public model training."
  },
  portugues: {
    slogans: [
      { prefix: "Seus", suffix: ", simplificados." },
      { prefix: "Domine seus", suffix: " com IA." },
      { prefix: "Seu melhor", suffix: " começa aqui." },
      { prefix: "Transforme seus", suffix: " em sucesso." }
    ],
    words: ["arquivos", "conhecimentos", "cursos", "temas", "estudos", "notas"],
    placeholder: "Cole o conteúdo do curso aqui...",
    upload: "Subir PDF ou Word",
    drive: "Abrir do Drive",
    start: "COMEÇAR AGORA",
    detecting: "Analisando Material...",
    loadingMsg: "TuProfe está pensando profundamente...",
    cancel: "Cancelar e voltar",
    temario: "Temário Detectado",
    selectChapter: "Selecione um bloco à esquerda para configurar sua lição",
    depthTitle: "Qual nível de detalhe você procura?",
    basic: "Resumo Básico",
    basicDesc: "Ideal para revisar os pilares fundamentais rapidamente.",
    medium: "Resumo Padrão",
    mediumDesc: "Equilíbrio perfeito entre teoria e exemplos práticos.",
    hard: "Análise Profunda",
    hardDesc: "Máximo detalhe técnico e explicações exaustivas.",
    internet: "Adicionar Dados da Internet",
    internetDesc: "Inclui o que as pessoas estão perguntando no Google.",
    backToTemario: "Voltar ao Temário",
    entrar: "Entrar",
    salir: "Sair",
    secure: "Conexão segura SSL. Seus dados não são usados para treinar modelos públicos."
  },
  french: {
    slogans: [
      { prefix: "Tes", suffix: ", simplifiés." },
      { prefix: "Maîtrise tes", suffix: " avec l'IA." },
      { prefix: "Ton", suffix: " commence ici." },
      { prefix: "Transforme tes", suffix: " en réussite." }
    ],
    words: ["PDFs", "connaissances", "cours", "sujets", "études", "notes"],
    placeholder: "Collez le contenu du cours ici...",
    upload: "Télécharger PDF ou Word",
    drive: "Ouvrir depuis Drive",
    start: "COMMENCER MAINTENANT",
    detecting: "Analyse du matériel...",
    loadingMsg: "TuProfe réfléchit intensément...",
    cancel: "Annuler et retour",
    temario: "Sujets Détectés",
    selectChapter: "Sélectionnez un bloc à gauche pour configurer votre leçon",
    depthTitle: "Quel niveau de détail recherchez-vous ?",
    basic: "Résumé Basique",
    basicDesc: "Idéal pour réviser rapidement les piliers fondamentaux.",
    medium: "Résumé Standard",
    mediumDesc: "Équilibre parfait entre théorie et exemples pratiques.",
    hard: "Analyse Approfondie",
    hardDesc: "Détails techniques maximaux et explications exhaustives.",
    internet: "Ajouter des Données Internet",
    internetDesc: "Inclut ce que les gens demandent sur Google.",
    backToTemario: "Retour au Sommaire",
    entrar: "Connexion",
    salir: "Déconnexion",
    secure: "Connexion SSL sécurisée. Vos données ne sont pas utilisées pour l'entraînement."
  },
  german: {
    slogans: [
      { prefix: "Deine", suffix: ", vereinfacht." },
      { prefix: "Meistere deine", suffix: " mit KI." },
      { prefix: "Dein", suffix: " beginnt genau hier." },
      { prefix: "Mache deine", suffix: " zum Erfolg." }
    ],
    words: ["PDFs", "Wissen", "Kurse", "Themen", "Studien", "Notizen"],
    placeholder: "Kursinhalt hier einfügen...",
    upload: "PDF oder Word hochladen",
    drive: "Von Drive öffnen",
    start: "JETZT STARTEN",
    detecting: "Material wird analysiert...",
    loadingMsg: "TuProfe denkt tief nach...",
    cancel: "Abbrechen und zurück",
    temario: "Erkannte Kapitel",
    selectChapter: "Wählen Sie links einen Block aus, um Ihre Lektion zu konfigurieren",
    depthTitle: "Wie detailliert soll es sein?",
    basic: "Basis-Zusammenfassung",
    basicDesc: "Ideal für eine schnelle Wiederholung der Grundlagen.",
    medium: "Standard-Zusammenfassung",
    mediumDesc: "Perfekte Balance zwischen Theorie und Praxisbeispielen.",
    hard: "Tiefenanalyse",
    hardDesc: "Maximale technische Details und umfassende Erklärungen.",
    internet: "Internetdaten hinzufügen",
    internetDesc: "Bezieht Google-Suchanfragen mit ein.",
    backToTemario: "Zurück zur Übersicht",
    entrar: "Anmelden",
    salir: "Abmelden",
    secure: "Sichere SSL-Verbindung. Ihre Daten werden nicht für KI-Training verwendet."
  }
};

const LANG_CODES = ['español', 'english', 'portugues', 'french', 'german'];

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<CourseAnalysis | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isParsingFiles, setIsParsingFiles] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [selectedLang, setSelectedLang] = useState('español');
  
  // Animation States
  const [heroLangIndex, setHeroLangIndex] = useState(0);
  const [sloganIndex, setSloganIndex] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = TRANSLATIONS[selectedLang] || TRANSLATIONS.español;

  // Unified 15-second rotation timer
  useEffect(() => {
    const mainRotationTimer = setInterval(() => {
      setIsAnimating(true);
      
      // Allow fade out animation to finish before swapping content
      setTimeout(() => {
        const nextLangIndex = (heroLangIndex + 1) % LANG_CODES.length;
        const nextLang = LANG_CODES[nextLangIndex];
        const nextLangT = TRANSLATIONS[nextLang];
        
        setHeroLangIndex(nextLangIndex);
        // Randomly pick slogan and word from the next language pool
        setSloganIndex(Math.floor(Math.random() * nextLangT.slogans.length));
        setWordIndex(Math.floor(Math.random() * nextLangT.words.length));
        
        setIsAnimating(false);
      }, 800);
    }, 15000); // 15 seconds stay

    return () => clearInterval(mainRotationTimer);
  }, [heroLangIndex]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    initGoogleDrive();
    return () => unsubscribe();
  }, []);

  const handleStartProcess = async () => {
    if (!inputText.trim()) return;
    setStatus(AppStatus.PARSING);
    setError(null);
    try {
      const detected = await detectChapters(inputText, selectedLang);
      setChapters(detected);
      setStatus(AppStatus.CONFIGURING);
    } catch (err) {
      setError("Error processing material.");
      setStatus(AppStatus.ERROR);
    }
  };

  const handleAnalyzeChapter = async (style: AnalysisStyle) => {
    const chapter = chapters.find(c => c.id === selectedChapterId);
    if (!chapter) return;
    setStatus(AppStatus.LOADING);
    try {
      const result = await analyzeCourseContent(chapter.content, style, chapter.title, selectedLang);
      setAnalysisData(result);
      setChapters(prev => prev.map(c => c.id === selectedChapterId ? { ...c, studied: true } : c));
      setStatus(AppStatus.SUCCESS);
    } catch (err) {
      setError("Analysis failed. Please try again.");
      setStatus(AppStatus.CONFIGURING);
    }
  };

  const handleDrivePicker = async () => {
    setIsParsingFiles(true);
    try {
      const driveText = await openDrivePicker();
      if (driveText) {
        setInputText(prev => prev + "\n" + driveText);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsParsingFiles(false);
    }
  };

  const handleCancel = () => setStatus(AppStatus.CONFIGURING);
  const handleReset = () => {
    if (confirm("Reset everything?")) {
      setInputText('');
      setChapters([]);
      setAnalysisData(null);
      setStatus(AppStatus.IDLE);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsParsingFiles(true);
    try {
      let text = "";
      if (file.type === 'application/pdf') {
        const pdf = await (window as any).pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((it: any) => it.str).join(' ') + '\n';
        }
      } else if (file.type.includes('word')) {
        const result = await (window as any).mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
        text = result.value;
      }
      setInputText(prev => prev + "\n" + text);
    } catch (err) { setError("Error reading file."); }
    finally { setIsParsingFiles(false); }
  };

  // Content for the current rotation
  const currentLang = LANG_CODES[heroLangIndex];
  const currentHeroT = TRANSLATIONS[currentLang];
  const currentSlogan = currentHeroT.slogans[sloganIndex];
  const currentWord = currentHeroT.words[wordIndex];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-jakarta overflow-x-hidden">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setStatus(AppStatus.IDLE)}>
            <div className="bg-blue-600 p-2.5 rounded-2xl text-white shadow-lg shadow-blue-100">
              <BrainCircuit size={24} />
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">TuProfe</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              {LANG_CODES.map(code => (
                <button key={code} onClick={() => setSelectedLang(code)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${selectedLang === code ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                  {code.substring(0, 2).toUpperCase()}
                </button>
              ))}
            </div>

            {user ? (
              <button onClick={logout} className="text-xs font-bold text-slate-500 hover:text-red-500 flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl transition-all">
                <LogOut size={14}/> {user.displayName?.split(' ')[0]}
              </button>
            ) : (
              <button onClick={loginWithGoogle} className="text-xs font-black text-blue-600 bg-blue-50 px-5 py-2.5 rounded-xl border border-blue-100 hover:bg-blue-100 transition-all uppercase tracking-wider">{t.entrar}</button>
            )}
            {status !== AppStatus.IDLE && (
              <button onClick={handleReset} className="p-2.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition-all"><RotateCcw size={18} /></button>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-6xl w-full mx-auto p-6 flex flex-col">
        {status === AppStatus.IDLE && (
          <div className="flex-1 flex flex-col justify-center py-20 animate-in fade-in slide-in-from-bottom-8 text-center space-y-12">
            <div className={`transition-all duration-1000 ease-in-out transform ${isAnimating ? 'opacity-0 scale-95 -translate-y-6 blur-md' : 'opacity-100 scale-100 translate-y-0 blur-0'}`}>
              <h2 className="text-6xl md:text-7xl font-black text-slate-900 leading-[1.1] tracking-tighter max-w-5xl mx-auto min-h-[180px] flex flex-wrap justify-center items-center gap-x-4">
                <span>{currentSlogan.prefix}</span>
                <span className="text-blue-600 italic underline decoration-blue-200 decoration-8 underline-offset-8 transition-all duration-1000 transform hover:scale-105 inline-block min-w-[150px]">
                  {currentWord}
                </span>
                <span>{currentSlogan.suffix}</span>
              </h2>
            </div>
            
            <div className="bg-white p-8 rounded-[3.5rem] shadow-2xl shadow-slate-200 border border-slate-200 relative group">
              <textarea 
                className="w-full h-80 p-8 text-xl border-none focus:ring-0 resize-none rounded-[2.5rem] bg-slate-50/50 font-semibold placeholder:text-slate-300 custom-scrollbar transition-all focus:bg-white"
                placeholder={t.placeholder}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
              />
              <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-6 mt-4">
                <div className="flex gap-2 w-full md:w-auto">
                  <button onClick={() => fileInputRef.current?.click()} className="flex-1 md:flex-none flex items-center justify-center gap-3 text-sm font-black text-slate-600 hover:text-blue-600 bg-slate-100 px-8 py-4 rounded-2xl transition-all border border-slate-200 hover:bg-blue-50">
                    <FileUp size={20} /> {isParsingFiles ? "..." : t.upload}
                  </button>
                  {user && (
                    <button onClick={handleDrivePicker} className="flex-1 md:flex-none flex items-center justify-center gap-3 text-sm font-black text-blue-600 hover:text-white hover:bg-blue-600 bg-blue-50 px-8 py-4 rounded-2xl transition-all border border-blue-100 shadow-sm">
                      <CloudIcon size={20} /> {t.drive}
                    </button>
                  )}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.docx" />
                <button onClick={handleStartProcess} disabled={!inputText.trim()} className="w-full md:w-auto bg-blue-600 text-white px-16 py-5 rounded-[1.8rem] font-black shadow-2xl shadow-blue-200 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all disabled:opacity-30 uppercase tracking-widest">{t.start}</button>
              </div>
            </div>
          </div>
        )}

        {(status === AppStatus.PARSING || status === AppStatus.LOADING) && (
          <div className="flex-1 flex flex-col items-center justify-center py-40 animate-in fade-in">
             <div className="relative flex items-center justify-center mb-12">
                <div className="w-44 h-44 border-[14px] border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
                <BrainCircuit className="absolute text-blue-600 animate-pulse" size={64} />
             </div>
             <div className="text-center space-y-10 flex flex-col items-center w-full max-w-xl">
                <div className="flex flex-col items-center">
                  <span className="text-[12px] font-black text-blue-600 uppercase tracking-[0.5em] mb-4">AI Processing Engine</span>
                  <h3 className="text-4xl font-black text-slate-900 tracking-tight leading-tight px-4">
                    {selectedChapterId ? chapters.find(c=>c.id===selectedChapterId)?.title : t.detecting}
                  </h3>
                </div>
                <p className="text-slate-400 text-2xl font-bold italic opacity-60 px-8">"{t.loadingMsg}"</p>
                <button onClick={handleCancel} className="flex items-center gap-4 px-14 py-6 bg-white text-red-500 rounded-[2rem] font-black hover:bg-red-50 transition-all border-2 border-slate-100 shadow-xl active:scale-95">
                  <XCircle size={26} /> {t.cancel}
                </button>
             </div>
          </div>
        )}

        {status === AppStatus.CONFIGURING && (
          <div className="grid lg:grid-cols-12 gap-10 py-10 animate-in fade-in zoom-in-95">
            <div className="lg:col-span-4 space-y-6">
              <h3 className="text-xl font-black text-slate-900 px-2 flex items-center gap-3"><Layers className="text-blue-600" size={24}/> {t.temario}</h3>
              <div className="space-y-4">
                {chapters.map(chap => (
                  <button key={chap.id} onClick={() => setSelectedChapterId(chap.id)} className={`w-full text-left p-6 rounded-[2rem] border-2 transition-all flex items-center justify-between ${selectedChapterId === chap.id ? 'bg-blue-600 border-blue-600 text-white shadow-2xl shadow-blue-200 translate-x-2' : chap.studied ? 'opacity-40 grayscale bg-slate-50 border-slate-100' : 'bg-white border-slate-100 hover:border-blue-400 hover:shadow-lg'}`}>
                    <span className="font-black truncate pr-4 text-base">{chap.title}</span>
                    {chap.studied && <CheckCircle size={20} className="text-emerald-500" />}
                  </button>
                ))}
              </div>
            </div>
            <div className="lg:col-span-8">
              {!selectedChapterId ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 bg-white border-4 border-dashed border-slate-100 rounded-[4rem] min-h-[550px] p-12 text-center">
                  <Layers size={100} className="opacity-[0.05] mb-8" />
                  <p className="font-black text-2xl tracking-tighter leading-tight">{t.selectChapter}</p>
                </div>
              ) : (
                <div className="bg-white p-12 rounded-[4.5rem] border border-slate-200 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] space-y-12">
                  <h2 className="text-5xl font-black text-slate-900 leading-none tracking-tighter">{t.depthTitle}</h2>
                  <div className="grid gap-6">
                    <button onClick={() => handleAnalyzeChapter('basic')} className="flex items-center gap-8 p-8 rounded-[2.5rem] border-2 border-slate-50 bg-slate-50/50 hover:border-emerald-500 hover:bg-emerald-50 transition-all group shadow-sm">
                      <div className="p-4 bg-emerald-100 rounded-3xl text-emerald-600 group-hover:scale-110 transition-transform"><Zap size={40} /></div>
                      <div className="text-left"><h4 className="font-black text-2xl text-slate-900">{t.basic}</h4><p className="text-base text-slate-500 font-bold opacity-60">{t.basicDesc}</p></div>
                    </button>
                    <button onClick={() => handleAnalyzeChapter('medium')} className="flex items-center gap-8 p-8 rounded-[2.5rem] border-2 border-slate-50 bg-slate-50/50 hover:border-blue-500 hover:bg-blue-50 transition-all group shadow-sm">
                      <div className="p-4 bg-blue-100 rounded-3xl text-blue-600 group-hover:scale-110 transition-transform"><Gauge size={40} /></div>
                      <div className="text-left"><h4 className="font-black text-2xl text-slate-900">{t.medium}</h4><p className="text-base text-slate-500 font-bold opacity-60">{t.mediumDesc}</p></div>
                    </button>
                    <button onClick={() => handleAnalyzeChapter('hard')} className="flex items-center gap-8 p-8 rounded-[2.5rem] border-2 border-slate-50 bg-slate-50/50 hover:border-amber-500 hover:bg-amber-50 transition-all group shadow-sm">
                      <div className="p-4 bg-amber-100 rounded-3xl text-amber-600 group-hover:scale-110 transition-transform"><AlertTriangle size={40} /></div>
                      <div className="text-left"><h4 className="font-black text-2xl text-slate-900">{t.hard}</h4><p className="text-base text-slate-500 font-bold opacity-60">{t.hardDesc}</p></div>
                    </button>
                    <button onClick={() => handleAnalyzeChapter('internet')} className="mt-6 flex items-center justify-center gap-8 p-8 rounded-[2.5rem] bg-indigo-600 text-white shadow-2xl shadow-indigo-200 hover:scale-[1.03] transition-all">
                      <Globe size={40} />
                      <div className="text-left"><h4 className="font-black text-2xl">{t.internet}</h4><p className="text-base opacity-70 font-bold">{t.internetDesc}</p></div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {status === AppStatus.SUCCESS && analysisData && (
          <div className="py-6 animate-in fade-in slide-in-from-bottom-12">
            <button onClick={() => setStatus(AppStatus.CONFIGURING)} className="mb-10 flex items-center gap-3 text-blue-600 font-black text-base hover:bg-blue-50 px-6 py-3 rounded-2xl transition-all w-fit"><ArrowLeft size={20}/> {t.backToTemario}</button>
            <AnalysisResult data={analysisData} documentContext={chapters.find(c=>c.id===selectedChapterId)?.content || ""} onReset={handleReset} history={chatHistory} onChatUpdate={setChatHistory} currentUser={user} language={selectedLang} />
          </div>
        )}
      </main>

      <footer className="py-8 bg-white border-t border-slate-200 mt-20 no-print">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 opacity-60">
          <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
             <ShieldCheck size={18} className="text-emerald-500" />
             {t.secure}
          </div>
          <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">Github</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-blue-600 transition-colors">MIT License</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
