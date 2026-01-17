
import React, { useState, useEffect } from 'react';
import { AppStatus, Chapter, CourseAnalysis, AnalysisStyle, ChatMessage } from './types';
import { detectChapters, analyzeCourseContent } from './services/geminiService';
import { auth, loginWithGoogle, logout } from './services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import AnalysisResult from './components/AnalysisResult';
import { Book, Settings, Sparkles, LogIn, LogOut, ChevronRight, GraduationCap, Cpu } from 'lucide-react';

/**
 * Main App component that orchestrates the TuProfeAI experience.
 * Handles user authentication, content parsing, configuration, and analysis display.
 */
const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [user, setUser] = useState<User | null>(null);
  const [text, setText] = useState('');
  const [language, setLanguage] = useState('español');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [style, setStyle] = useState<AnalysisStyle>('medium');
  const [analysis, setAnalysis] = useState<CourseAnalysis | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Monitor authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  // Phase 1: Detect modules or chapters from the provided text
  const handleDetectChapters = async () => {
    if (!text.trim()) return;
    setStatus(AppStatus.PARSING);
    setError(null);
    try {
      const detected = await detectChapters(text, language);
      setChapters(detected);
      setStatus(AppStatus.CONFIGURING);
    } catch (err) {
      console.error(err);
      setError('Error detecting chapters. Please try again.');
      setStatus(AppStatus.ERROR);
    }
  };

  // Phase 2: Perform deep analysis on a specific selected chapter
  const handleStartAnalysis = async () => {
    if (!selectedChapter) return;
    setStatus(AppStatus.LOADING);
    setError(null);
    try {
      const result = await analyzeCourseContent(text, style, selectedChapter.title, language);
      setAnalysis(result);
      setChatHistory([]);
      setStatus(AppStatus.SUCCESS);
    } catch (err) {
      console.error(err);
      setError('Error analyzing content. Please try again.');
      setStatus(AppStatus.ERROR);
    }
  };

  // Reset the application state
  const handleReset = () => {
    setAnalysis(null);
    setChapters([]);
    setSelectedChapter(null);
    setStatus(AppStatus.IDLE);
    setText('');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Navigation Bar */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={handleReset}>
            <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-200">
              <GraduationCap className="text-white" size={24} />
            </div>
            <h1 className="text-2xl font-black tracking-tighter text-slate-900">TuProfe<span className="text-blue-600">AI</span></h1>
          </div>

          <div className="flex items-center gap-8">
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-slate-100 border-none rounded-xl px-4 py-2 font-bold text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
            >
              <option value="español">Español</option>
              <option value="english">English</option>
              <option value="português">Português</option>
              <option value="français">Français</option>
            </select>

            {user ? (
              <div className="flex items-center gap-4">
                <img src={user.photoURL || ''} alt="" className="w-10 h-10 rounded-full border-2 border-white shadow-md" />
                <button onClick={logout} className="text-slate-500 hover:text-red-600 transition-colors" title="Logout">
                  <LogOut size={20}/>
                </button>
              </div>
            ) : (
              <button onClick={loginWithGoogle} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-black text-sm hover:bg-slate-800 transition-all flex items-center gap-2">
                <LogIn size={18}/> Login
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Landing/Input Screen */}
        {status === AppStatus.IDLE && (
          <div className="max-w-4xl mx-auto text-center space-y-12 py-20">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">
                <Sparkles size={14}/> Intelligent Knowledge Architect
              </div>
              <h2 className="text-6xl md:text-7xl font-black text-slate-900 tracking-tight leading-[1.05]">
                Turn your material into <span className="text-blue-600">Mastery.</span>
              </h2>
              <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
                Paste your textbooks, notes, or lecture transcripts. TuProfeAI analyzes the depth and constructs a perfect learning path.
              </p>
            </div>

            <div className="bg-white p-4 rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your content here (supports huge contexts)..."
                className="w-full h-80 p-8 rounded-[2rem] bg-slate-50 border-none focus:ring-0 text-lg font-medium placeholder:text-slate-300 resize-none"
              />
              <div className="p-4 flex justify-end">
                <button 
                  onClick={handleDetectChapters}
                  disabled={!text.trim()}
                  className="bg-blue-600 text-white px-12 py-5 rounded-3xl font-black text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 disabled:opacity-50 flex items-center gap-3 active:scale-95"
                >
                  Process Course Material <ChevronRight size={24}/>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Parsing state */}
        {status === AppStatus.PARSING && (
          <div className="flex flex-col items-center justify-center py-40 gap-8">
            <div className="w-24 h-24 border-8 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="text-center">
              <h3 className="text-2xl font-black">Scanning Modules...</h3>
              <p className="text-slate-500 font-bold">Identifying chapters and core learning blocks.</p>
            </div>
          </div>
        )}

        {/* Configuration step */}
        {status === AppStatus.CONFIGURING && (
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="flex items-center justify-between">
              <h3 className="text-3xl font-black tracking-tight">Select a Learning Block</h3>
              <button onClick={() => setStatus(AppStatus.IDLE)} className="text-slate-400 font-bold hover:text-slate-600 transition-colors">Go Back</button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {chapters.map((chapter) => (
                <button
                  key={chapter.id}
                  onClick={() => setSelectedChapter(chapter)}
                  className={`p-8 rounded-[2.5rem] text-left transition-all border-4 ${
                    selectedChapter?.id === chapter.id 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-2xl shadow-blue-200' 
                      : 'bg-white border-white hover:border-blue-100 text-slate-900 shadow-xl shadow-slate-100'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${
                    selectedChapter?.id === chapter.id ? 'bg-white/20' : 'bg-blue-50 text-blue-600'
                  }`}>
                    <Book size={24} />
                  </div>
                  <h4 className="text-xl font-black mb-2">{chapter.title}</h4>
                  <p className={`text-sm font-medium ${selectedChapter?.id === chapter.id ? 'text-blue-100' : 'text-slate-400'}`}>
                    {chapter.content.substring(0, 120)}...
                  </p>
                </button>
              ))}
            </div>

            {selectedChapter && (
              <div className="bg-slate-900 p-12 rounded-[3.5rem] text-white shadow-2xl animate-in slide-in-from-bottom-12">
                <h4 className="text-2xl font-black mb-10 flex items-center gap-4">
                  <div className="bg-blue-500 p-2 rounded-lg"><Settings size={20}/></div>
                  Analysis Depth
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {(['internet', 'basic', 'medium', 'hard'] as AnalysisStyle[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStyle(s)}
                      className={`px-6 py-4 rounded-2xl font-black text-sm capitalize transition-all border-2 ${
                        style === s 
                          ? 'bg-white text-slate-900 border-white' 
                          : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={handleStartAnalysis}
                  className="w-full mt-12 bg-blue-600 hover:bg-blue-500 text-white py-6 rounded-3xl font-black text-xl transition-all shadow-xl shadow-blue-900/50 flex items-center justify-center gap-4 active:scale-[0.98]"
                >
                  Synthesize Knowledge <Sparkles size={24}/>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Loading the full analysis */}
        {status === AppStatus.LOADING && (
          <div className="flex flex-col items-center justify-center py-40 gap-10">
            <div className="relative">
              <div className="w-32 h-32 border-[12px] border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center text-blue-600">
                <Cpu size={40} className="animate-pulse" />
              </div>
            </div>
            <div className="text-center space-y-4">
              <h3 className="text-3xl font-black">TuProfe is Deep Thinking...</h3>
              <p className="text-slate-500 font-bold max-w-sm mx-auto">Creating conceptual hierarchies, analogies, and the final synthesis.</p>
            </div>
          </div>
        )}

        {/* Displaying final results */}
        {status === AppStatus.SUCCESS && analysis && (
          <AnalysisResult 
            data={analysis} 
            documentContext={text} 
            onReset={handleReset}
            history={chatHistory}
            onChatUpdate={setChatHistory}
            currentUser={user}
            language={language}
          />
        )}

        {/* Error state */}
        {status === AppStatus.ERROR && (
          <div className="max-w-md mx-auto text-center space-y-8 py-20">
            <div className="bg-red-50 text-red-600 p-8 rounded-[2.5rem] font-bold border border-red-100 shadow-xl shadow-red-50">
              <h3 className="text-2xl font-black mb-2">Analysis Failed</h3>
              <p>{error}</p>
            </div>
            <button onClick={handleReset} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black hover:bg-slate-800 transition-all">Try Again</button>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
