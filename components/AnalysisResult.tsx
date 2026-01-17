
import React, { useState, useRef, useEffect } from 'react';
import { CourseAnalysis, QuizQuestion, ChatMessage, TimelineItem, MindMapNode } from '../types';
import { BookOpen, HelpCircle, Zap, Send, FileText, Download, Cloud, Globe, GraduationCap, Info, PlusCircle, Search, Clock, GitBranch, Code, ChevronRight } from 'lucide-react';
import { askDocumentQuestion, generateMoreQuestions } from '../services/geminiService';
import { saveAnalysisToCloud } from '../services/firebase';
import { User as FirebaseUser } from 'firebase/auth';

interface AnalysisResultProps {
  data: CourseAnalysis;
  documentContext: string;
  onReset: () => void;
  history: ChatMessage[];
  onChatUpdate: (history: ChatMessage[]) => void;
  currentUser: FirebaseUser | null;
  language?: string;
}

const renderMarkdown = (text: string) => {
  if (!text) return "";
  let cleanText = text.replace(/\\n/g, '\n');
  const codeBlocks: string[] = [];
  cleanText = cleanText.replace(/```([\s\S]*?)```/g, (_, code) => {
    const id = `__CODE_BLOCK_${codeBlocks.length}__`;
    codeBlocks.push(`<div class="bg-[#0f172a] text-[#38bdf8] p-6 rounded-[1.8rem] my-8 font-mono text-sm overflow-x-auto border border-white/10 shadow-2xl relative group/code">
      <div class="absolute top-4 right-6 text-[10px] font-black text-white/20 uppercase tracking-widest group-hover/code:text-white/40 transition-colors">Fragmento de Código</div>
      <code class="whitespace-pre">${code.trim()}</code>
    </div>`);
    return id;
  });
  cleanText = cleanText.replace(/^### (.*$)/gm, '<h3 class="text-2xl font-black mb-6 mt-10 text-slate-900 tracking-tight">$1</h3>');
  cleanText = cleanText.replace(/^## (.*$)/gm, '<h2 class="text-4xl font-black mb-8 mt-14 text-slate-900 border-b-8 border-blue-500/20 w-fit pb-4">$1</h2>');
  cleanText = cleanText.replace(/`(.*?)`/g, '<code class="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-lg font-mono text-sm border border-indigo-100">$1</code>');
  cleanText = cleanText.replace(/\*\*(.*?)\*\*/g, '<strong class="text-blue-700 font-black">$1</strong>');
  cleanText = cleanText.replace(/\n/g, '<br/>');
  codeBlocks.forEach((block, i) => { cleanText = cleanText.replace(`__CODE_BLOCK_${i}__`, block); });
  return cleanText;
};

const AnalysisResult: React.FC<AnalysisResultProps> = ({ data, documentContext, history, onChatUpdate, currentUser, language = 'español' }) => {
  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>(data.quiz);
  const [isLoadingMoreQuiz, setIsLoadingMoreQuiz] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  const pages = data.summary.split('---PAGE---');

  const handleLoadMoreQuestions = async () => {
    setIsLoadingMoreQuiz(true);
    try {
      const more = await generateMoreQuestions(documentContext, quizQuestions.length, language);
      setQuizQuestions(prev => [...prev, ...more]);
    } finally { setIsLoadingMoreQuiz(false); }
  };

  const handleExportPDF = async () => {
    if (!pdfRef.current) return;
    setIsExporting(true);
    try {
      const { jsPDF } = (window as any).jspdf;
      const canvas = await (window as any).html2canvas(pdfRef.current, { scale: 1.5, useCORS: true });
      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      const doc = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = doc.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      doc.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      doc.save(`TuProfe_${data.topicTitle}.pdf`);
    } finally { setIsExporting(false); }
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isAsking) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: question };
    onChatUpdate([...history, userMsg]);
    setQuestion('');
    setIsAsking(true);
    try {
      const answer = await askDocumentQuestion(documentContext, userMsg.text, language);
      onChatUpdate([...history, userMsg, { id: (Date.now()+1).toString(), role: 'bot', text: answer }]);
    } finally { setIsAsking(false); }
  };

  return (
    <div className="space-y-16 max-w-5xl mx-auto">
      <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-2xl shadow-slate-100 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
          <div className="flex-1 min-w-0">
            <span className="text-blue-600 font-black text-[12px] uppercase tracking-[0.5em] mb-4 block">Analysis Success</span>
            <h2 className="text-4xl lg:text-5xl font-black text-slate-900 leading-[1.1] tracking-tighter truncate">{data.topicTitle}</h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-5 shrink-0">
            <button 
              onClick={handleExportPDF} 
              className="flex items-center justify-center gap-4 px-10 py-6 bg-slate-950 text-white rounded-[2rem] font-black hover:bg-slate-800 transition-all shadow-2xl shadow-slate-300 text-sm active:scale-95"
            >
              {isExporting ? '...' : <><Download size={22}/> Export PDF</>}
            </button>
            <button 
              onClick={() => saveAnalysisToCloud(currentUser?.uid || 'anon', data, documentContext)} 
              className="flex items-center justify-center gap-4 px-10 py-6 bg-blue-600 text-white rounded-[2rem] font-black hover:bg-blue-700 transition-all shadow-2xl shadow-blue-200 text-sm active:scale-95"
            >
              Cloud Save
            </button>
          </div>
        </div>
      </div>

      <div ref={pdfRef} className="space-y-24">
        {data.groundingUrls && data.groundingUrls.length > 0 && (
          <div className="bg-white p-12 md:p-16 rounded-[4.5rem] border border-slate-100 shadow-xl animate-in fade-in">
            <h4 className="flex items-center gap-6 text-blue-600 text-3xl font-black mb-10">
              <div className="bg-blue-100 p-4 rounded-[2rem]"><Globe size={32}/></div>
              Grounded References
            </h4>
            <div className="flex flex-wrap gap-5">
              {data.groundingUrls.map((url, i) => (
                <a 
                  key={i} 
                  href={url.uri} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="bg-slate-50 px-8 py-4 rounded-[1.8rem] border border-slate-200 text-blue-600 font-black hover:bg-blue-50 transition-all flex items-center gap-3 text-base shadow-sm"
                >
                  <Globe size={20}/> {url.title}
                </a>
              ))}
            </div>
          </div>
        )}

        {data.mindMap && data.mindMap.length > 0 && (
          <div className="bg-white p-14 md:p-24 rounded-[5rem] shadow-2xl border border-slate-100 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-16 opacity-[0.03] pointer-events-none transform translate-x-1/4 -translate-y-1/4 scale-150">
              <GitBranch size={400} />
            </div>
            <h4 className="text-4xl font-black flex items-center gap-6 mb-20 text-indigo-700 relative z-10">
              <div className="bg-indigo-100 p-5 rounded-[2rem]"><GitBranch size={40}/></div>
              Conceptual Architecture
            </h4>
            <div className="grid md:grid-cols-2 gap-12 relative z-10">
              {data.mindMap.map((node, i) => (
                <div key={i} className="bg-slate-50 p-12 rounded-[3.5rem] border-2 border-slate-100 hover:border-indigo-200 hover:bg-white transition-all shadow-inner">
                  <h5 className="font-black text-indigo-900 mb-8 text-3xl tracking-tight flex items-center gap-5">
                    <span className="w-14 h-14 rounded-[1.8rem] bg-indigo-600 text-white text-xl flex items-center justify-center font-black shadow-lg">{i+1}</span>
                    {node.concept}
                  </h5>
                  <ul className="space-y-6">
                    {node.details.map((detail, di) => (
                      <li key={di} className="text-lg text-slate-600 font-bold flex gap-5 leading-tight">
                        <ChevronRight size={24} className="text-indigo-400 mt-1 flex-shrink-0" /> {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {pages.map((page, idx) => (
          <div key={idx} className="bg-white p-14 md:p-28 rounded-[6rem] shadow-[0_60px_120px_-30px_rgba(0,0,0,0.1)] border border-slate-100 relative overflow-hidden min-h-[1000px] flex flex-col">
             <div className="flex justify-between items-center mb-24 border-b-4 border-slate-50 pb-12">
               <div className="flex items-center gap-5">
                 <div className="bg-blue-600 w-5 h-14 rounded-full"></div>
                 <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">TuProfe Master Lesson</h3>
               </div>
               <div className="text-[14px] font-black text-slate-300 uppercase tracking-[0.6em]">Page {idx + 1} / {pages.length}</div>
             </div>
             <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-2xl font-medium flex-1" 
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(page) }} />
             <div className="mt-20 pt-10 border-t border-slate-50 text-center opacity-20">
              <span className="text-[10px] font-black uppercase tracking-[0.8em]">Generated by TuProfe Intelligent Engine</span>
             </div>
          </div>
        ))}

        {data.timeline && data.timeline.length > 0 && (
          <div className="bg-[#020617] p-16 md:p-32 rounded-[6rem] text-white shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 blur-[150px] -translate-y-1/2 translate-x-1/2 rounded-full"></div>
            <h4 className="text-6xl font-black flex items-center gap-8 mb-24 text-blue-400 tracking-tighter">
              <div className="bg-blue-500/20 p-6 rounded-[2.5rem]"><Clock size={48}/></div>
              Chronological Milestones
            </h4>
            <div className="space-y-12 relative">
              <div className="absolute left-14 top-14 bottom-14 w-1.5 bg-white/5 hidden md:block"></div>
              {data.timeline.map((item, i) => (
                <div key={i} className="relative md:pl-40 pb-20 last:pb-0 group">
                  <div className="absolute left-0 top-3 w-28 h-28 bg-blue-600 rounded-[3rem] border-[12px] border-[#020617] flex items-center justify-center z-10 hidden md:flex font-black text-2xl group-hover:scale-110 transition-transform shadow-2xl shadow-blue-900/40">
                    {i+1}
                  </div>
                  <div className="bg-white/5 p-16 rounded-[4.5rem] border border-white/10 hover:bg-white/10 transition-all shadow-2xl">
                    <span className="text-blue-400 font-black text-base uppercase tracking-[0.5em] mb-6 block">{item.date}</span>
                    <h5 className="text-4xl font-black mb-8 tracking-tight">{item.event}</h5>
                    <p className="text-slate-400 font-bold leading-relaxed text-xl">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-14">
          <div className="bg-white p-20 rounded-[5rem] border border-slate-100 shadow-2xl">
             <h4 className="flex items-center gap-6 text-amber-600 text-4xl font-black mb-16">
               <div className="bg-amber-100 p-5 rounded-[2rem]"><Zap size={40}/></div>
               Golden Keynotes
             </h4>
             <ul className="space-y-12">
               {data.keyPoints.map((p, i) => (
                 <li key={i} className="flex gap-10 text-slate-800 font-black group">
                   <div className="flex-shrink-0 w-16 h-16 rounded-[1.8rem] bg-amber-50 text-amber-600 flex items-center justify-center text-xl font-black group-hover:bg-amber-600 group-hover:text-white transition-all shadow-xl shadow-amber-100">{i+1}</div>
                   <p className="pt-4 leading-tight text-2xl tracking-tight">{p}</p>
                 </li>
               ))}
             </ul>
          </div>
          <div className="bg-white p-20 rounded-[5rem] border border-slate-100 shadow-2xl">
             <h4 className="flex items-center gap-6 text-emerald-600 text-4xl font-black mb-16">
               <div className="bg-emerald-100 p-5 rounded-[2rem]"><BookOpen size={40}/></div>
               Study Cases
             </h4>
             <div className="space-y-12">
               {data.examples.map((ex, i) => (
                 <div key={i} className="bg-slate-50 p-14 rounded-[3.5rem] border border-slate-100 hover:bg-white hover:shadow-2xl transition-all">
                    <h5 className="font-black text-slate-900 mb-6 text-3xl tracking-tight leading-tight">{ex.title}</h5>
                    <p className="text-xl text-slate-500 mb-10 font-bold leading-relaxed">{ex.description}</p>
                    <div className="text-lg bg-emerald-50 text-emerald-900 p-10 rounded-[2.5rem] italic font-black border border-emerald-100 shadow-inner">
                      💡 Master Analogy: {ex.analogy}
                    </div>
                 </div>
               ))}
             </div>
          </div>
        </div>

        <div className="bg-white p-16 md:p-32 rounded-[7rem] border border-slate-100 shadow-[0_80px_150px_-40px_rgba(0,0,0,0.1)]">
           <div className="text-center mb-32 space-y-8">
              <div className="inline-block bg-blue-100 text-blue-700 px-10 py-4 rounded-full font-black text-sm uppercase tracking-[0.4em]">Knowledge Checkpoint</div>
              <h4 className="text-7xl font-black text-slate-900 tracking-tighter">Did you get it?</h4>
              <p className="text-slate-400 font-bold text-2xl">Master this lesson by completing the dynamic challenge below.</p>
           </div>
           <div className="space-y-40">
             {quizQuestions.map((q, i) => <QuizItem key={i} question={q} index={i} />)}
           </div>
           <div className="mt-40 flex justify-center no-print">
              <button onClick={handleLoadMoreQuestions} disabled={isLoadingMoreQuiz} className="flex items-center gap-6 bg-slate-950 text-white px-20 py-10 rounded-[3rem] font-black hover:scale-105 transition-all disabled:opacity-50 shadow-2xl text-2xl active:scale-95">
                {isLoadingMoreQuiz ? "..." : <><PlusCircle size={40}/> Generate 10 Extra Questions</>}
              </button>
           </div>
        </div>
      </div>

      <div className="bg-slate-950 rounded-[6rem] overflow-hidden shadow-[0_60px_150px_-30px_rgba(0,0,0,0.6)] no-print border border-white/5 mt-32">
         <div className="p-20 border-b border-white/5 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex items-center gap-8 text-center md:text-left">
              <div className="bg-blue-600 p-6 rounded-[2.5rem] text-white shadow-[0_20px_40px_-10px_rgba(37,99,235,0.6)]">
                <Search size={44} />
              </div>
              <div>
                <h4 className="text-white text-4xl font-black tracking-tight">Direct Support</h4>
                <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-xs">Intelligent Consult in {language}</p>
              </div>
            </div>
            <button onClick={() => onChatUpdate([])} className="px-10 py-5 rounded-[1.8rem] bg-white/5 text-[12px] font-black text-slate-400 hover:text-red-400 transition-all uppercase tracking-[0.4em] border border-white/10 active:scale-95">Reset Chat</button>
         </div>
         <div className="h-[800px] overflow-y-auto p-20 space-y-16 custom-scrollbar bg-white/[0.01] flex flex-col">
            {history.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-10 text-center space-y-10">
                <Search size={150} className="text-white" />
                <h3 className="text-white font-black text-5xl tracking-tighter max-w-lg">Any doubts left? I'm here to help.</h3>
              </div>
            ) : (
              history.map(m => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-8`}>
                   <div className={`max-w-[85%] p-14 rounded-[4rem] text-xl font-bold leading-relaxed shadow-2xl ${
                     m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white/5 text-slate-200 border border-white/10 rounded-tl-none'
                   }`} dangerouslySetInnerHTML={{ __html: renderMarkdown(m.text) }} />
                </div>
              ))
            )}
            {isAsking && <div className="text-blue-400 font-black animate-pulse text-[10px] uppercase tracking-[0.6em] text-center py-6">TuProfe is writing an explanation for you...</div>}
         </div>
         <form onSubmit={handleAskQuestion} className="p-20 bg-slate-950 flex gap-8">
            <input 
              value={question} 
              onChange={e => setQuestion(e.target.value)} 
              placeholder="Ask anything..." 
              className="flex-1 bg-white/5 border border-white/10 rounded-[2.8rem] px-14 py-10 text-white placeholder:text-slate-800 outline-none focus:ring-[12px] focus:ring-blue-600/10 transition-all font-black text-3xl" 
            />
            <button type="submit" disabled={isAsking || !question.trim()} className="bg-blue-600 text-white p-10 rounded-[2.8rem] hover:bg-blue-700 shadow-[0_30px_60px_-15px_rgba(37,99,235,0.5)] active:scale-90 transition-all flex items-center justify-center shrink-0">
              <Send size={50}/>
            </button>
         </form>
      </div>
    </div>
  );
};

const QuizItem: React.FC<{ question: QuizQuestion; index: number }> = ({ question, index }) => {
  const [selected, setSelected] = useState<number | null>(null);
  const hasAnswered = selected !== null;
  return (
    <div className="space-y-16">
      <div className="flex gap-12">
        <span className="flex-shrink-0 w-24 h-24 rounded-[3rem] bg-slate-50 border-8 border-slate-100 flex items-center justify-center font-black text-slate-400 text-4xl shadow-xl">{index + 1}</span>
        <p className="text-5xl font-black text-slate-900 pt-6 leading-tight tracking-tighter">{question.question}</p>
      </div>
      <div className="grid gap-8 md:ml-40">
        {question.options.map((opt, i) => (
          <button 
            key={i} 
            onClick={() => !hasAnswered && setSelected(i)} 
            disabled={hasAnswered}
            className={`p-12 text-left text-3xl rounded-[3.5rem] border-[12px] font-black transition-all relative group/opt ${
              hasAnswered 
                ? i === question.correctIndex 
                  ? 'bg-green-50 border-green-500 text-green-900 shadow-3xl scale-[1.05] z-10' 
                  : i === selected 
                    ? 'bg-red-50 border-red-200 text-red-900 opacity-60' 
                    : 'opacity-10 border-transparent bg-slate-50' 
                : 'bg-white border-slate-50 hover:border-blue-500 hover:shadow-3xl hover:-translate-y-3'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      {hasAnswered && (
        <div className="md:ml-40 mt-20 p-20 rounded-[5rem] bg-slate-50 border-l-[24px] border-blue-600 text-slate-700 shadow-inner animate-in slide-in-from-top-12">
          <div className="flex items-center gap-6 mb-10 text-[16px] font-black uppercase text-blue-600 tracking-[0.5em]"><Info size={36}/> Outcome Insight</div>
          <p className="text-3xl font-black italic leading-relaxed text-slate-600">{question.explanation}</p>
        </div>
      )}
    </div>
  );
};

export default AnalysisResult;
