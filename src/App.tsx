/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";
import { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, signInWithGoogle, logout, syncUserProfile, UserProfile, db } from './firebase';
import { collection, query, orderBy, limit, onSnapshot, addDoc, updateDoc, doc, increment, where, deleteDoc, setDoc, getDoc, getDocs, writeBatch } from 'firebase/firestore';
import { Sword, Loader2, LogOut, Timer, MessageSquare, User as UserIcon, Trophy, Flame, Play, Square, FastForward, CheckCircle2, XCircle, Heart, Share2, Users, Gift, Award, Palette, Edit3, Settings, ScrollText, Shield, Crown, Gem, Backpack, Calculator, Scale, Coins, Maximize2, Minimize2, ListTodo, Search, Lock, Unlock, BookOpen, Brain, Clock, Baby, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { QUESTIONS, QuizQuestion, TimelinePost, TimelineComment } from './types';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'quest' | 'timeline' | 'profile' | 'friends' | 'gacha' | 'achievements' | 'quiz'>('quest');
  const [following, setFollowing] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      try {
        setError(null);
        setUser(u);
        if (u) {
          const p = await syncUserProfile(u);
          setProfile(p);
          // Apply background color to body
          if (p.currentColor) {
             const bgColor = p.currentColor || '#F0F4F8';
             document.documentElement.style.setProperty('--color-app-bg', bgColor);
             
             // Better luminance check for contrast
              let isDark = false;
              try {
                const hex = bgColor.replace('#', '');
                if (hex.length === 6) {
                  const r = parseInt(hex.substring(0, 2), 16);
                  const g = parseInt(hex.substring(2, 4), 16);
                  const b = parseInt(hex.substring(4, 6), 16);
                  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                  isDark = brightness > 128;
                }
              } catch (e) {
                console.error("Color calc error", e);
              }
              document.documentElement.style.setProperty('--color-app-text', isDark ? '#1e293b' : '#ffffff');
          }
        }
      } catch (err: any) {
        console.error("Profile sync failed:", err);
        setError(`プロフィールの同期に失敗しました: ${err.message || '不明なエラー'}`);
      } finally {
        setLoading(false);
      }
    }, (err: any) => {
      console.error("Auth error:", err);
      setError(`認証エラーが発生しました: ${err.message || '不明なエラー'}`);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'follows'), where('followerId', '==', user.uid));
      const unsubFollows = onSnapshot(q, (snapshot) => {
        setFollowing(snapshot.docs.map(doc => doc.data().followingId));
      });
      return unsubFollows;
    }
  }, [user]);

  const handleLogin = async () => {
    try {
      setError(null);
      await signInWithGoogle();
    } catch (err: any) {
      console.error("Login component error:", err);
      if (err.code === 'auth/internal-error') {
        setError("Firebase認証の内部エラーが発生しました。しばらく待ってから再度お試しいただくか、ページを更新してください。");
      } else {
        setError(`ログインに失敗しました: ${err.message || '不明なエラー'}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto" />
          <p className="text-white/40 text-sm font-bold animate-pulse">データを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-app-bg flex flex-col items-center justify-center p-4 text-app-text">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md bg-white p-12 rounded-[48px] shadow-2xl border-4 border-red-50"
        >
          <div className="mb-6 flex justify-center">
            <div className="p-5 bg-red-500 rounded-3xl shadow-[0_6px_0_#991b1b]">
              <XCircle className="w-12 h-12 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-black mb-4 text-red-600">エラーが発生しました</h2>
          <p className="text-app-text/60 mb-8 font-medium bg-red-50 p-4 rounded-2xl border border-red-100">{error}</p>
          <div className="space-y-4">
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-primary text-white rounded-2xl font-black text-lg shadow-tactile hover:brightness-105 active:translate-y-1 transition-all"
            >
              ページを再読み込み
            </button>
            <button
              onClick={() => { setError(null); logout(); }}
              className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-lg hover:bg-slate-200 transition-all"
            >
              ログアウトしてやり直す
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-app-bg flex flex-col items-center justify-center p-4 text-app-text">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md bg-white p-12 rounded-[48px] shadow-2xl shadow-primary/10 border-4 border-white"
        >
          <div className="mb-6 flex justify-center">
            <div className="p-5 bg-primary rounded-3xl shadow-tactile">
              <Sword className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-black mb-4 tracking-tighter text-app-text">BOKI QUEST</h1>
          <p className="text-app-text/60 mb-10 text-lg font-medium">簿記2級攻略の旅へ。<br/>集中力を高め、仲間と共に成長しよう。</p>
          <button
            onClick={handleLogin}
            className="w-full py-5 bg-primary text-white rounded-2xl font-black text-xl flex items-center justify-center gap-3 shadow-tactile hover:brightness-105 active:shadow-none active:translate-y-1 transition-all"
          >
            冒険を始める
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-bg text-app-text pb-24 lg:pb-0 lg:pl-24">
      {/* Sidebar */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-primary z-50 flex items-center justify-around px-4 lg:top-0 lg:left-0 lg:bottom-0 lg:w-24 lg:h-full lg:flex-col lg:py-8 shadow-2xl shadow-black/10">
        <div className="hidden lg:flex w-12 h-12 bg-white rounded-2xl items-center justify-center font-black text-primary text-2xl shadow-tactile mb-8 cursor-default ring-4 ring-primary-dark/20 relative">
          <Shield className="w-8 h-8 absolute opacity-10" />
          <span className="relative z-10">B</span>
        </div>
        
        <button 
          onClick={() => setView('quest')}
          className={`p-3 rounded-2xl transition-all ${view === 'quest' ? 'bg-white text-primary shadow-lg scale-110' : 'text-white/70 hover:bg-white/10'}`}
          title="修行 (タイマー)"
        >
          <Timer className="w-8 h-8" />
        </button>
        <button 
          onClick={() => setView('quiz')}
          className={`p-3 rounded-2xl transition-all ${view === 'quiz' ? 'bg-white text-primary shadow-lg scale-110' : 'text-white/70 hover:bg-white/10'}`}
          title="試練 (クイズ)"
        >
          <Brain className="w-8 h-8" />
        </button>
        <button 
          onClick={() => setView('timeline')}
          className={`p-3 rounded-2xl transition-all ${view === 'timeline' ? 'bg-white text-primary shadow-lg scale-110' : 'text-white/70 hover:bg-white/10'}`}
          title="冒険日誌 (タイムライン)"
        >
          <ScrollText className="w-8 h-8" />
        </button>
        <button 
          onClick={() => setView('friends')}
          className={`p-3 rounded-2xl transition-all ${view === 'friends' ? 'bg-white text-primary shadow-lg scale-110' : 'text-white/70 hover:bg-white/10'}`}
          title="パーティ (ギルド)"
        >
          <Shield className="w-8 h-8" />
        </button>
        <button 
          onClick={() => setView('achievements')}
          className={`p-3 rounded-2xl transition-all ${view === 'achievements' ? 'bg-white text-primary shadow-lg scale-110' : 'text-white/70 hover:bg-white/10'}`}
          title="称号 (実績)"
        >
          <Crown className="w-8 h-8" />
        </button>
        <button 
          onClick={() => setView('gacha')}
          className={`p-3 rounded-2xl transition-all ${view === 'gacha' ? 'bg-white text-primary shadow-lg scale-110' : 'text-white/70 hover:bg-white/10'}`}
          title="宝箱 (ガチャ)"
        >
          <Gem className="w-8 h-8" />
        </button>
        <button 
          onClick={() => setView('profile')}
          className={`p-3 rounded-2xl transition-all ${view === 'profile' ? 'bg-white text-primary shadow-lg scale-110' : 'text-white/70 hover:bg-white/10'}`}
          title="ステータス (プロフィール)"
        >
          <Backpack className="w-8 h-8" />
        </button>
        <button 
          onClick={logout}
          className="lg:mt-auto p-3 text-white/50 hover:text-white transition-colors"
          title="ログアウト"
        >
          <LogOut className="w-8 h-8" />
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto p-4 pt-8 lg:p-12 lg:grid lg:grid-cols-[1fr_380px] lg:gap-12">
        <div className="space-y-12">
          <AnimatePresence mode="wait" initial={false}>
            {view === 'quest' && <QuestView profile={profile!} setProfile={setProfile} />}
            {view === 'quiz' && <BokiQuizView profile={profile!} setProfile={setProfile} />}
            {view === 'timeline' && <TimelineView following={following} />}
            {view === 'profile' && <ProfileView profile={profile!} setProfile={setProfile} />}
            {view === 'friends' && <FriendsView following={following} />}
            {view === 'gacha' && <GachaView profile={profile!} setProfile={setProfile} />}
            {view === 'achievements' && <AchievementsView profile={profile!} />}
          </AnimatePresence>
        </div>
        
        {/* Persistent Timeline Side view for Desktop */}
        <div className="hidden lg:block">
           <div className="sticky top-12 h-[calc(100vh-6rem)]">
              <TimelineView following={following} compact />
           </div>
        </div>
      </main>
    </div>
  );
}

function QuestView({ profile, setProfile }: { profile: UserProfile, setProfile: any }) {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [sessionTasks, setSessionTasks] = useState(0);
  const [manualHours, setManualHours] = useState<string>('');
  const [manualMinutes, setManualMinutes] = useState<string>('');
  const [manualTasks, setManualTasks] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedTaskPreset, setSelectedTaskPreset] = useState<string | null>(null);

  const TASK_PRESETS = [
    '仕訳30問',
    '問題集1章',
    '過去問演習',
    'テキスト通読',
    '工簿計算演習'
  ];

  useEffect(() => {
    let interval: any;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleSessionComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'work' ? 25 * 60 : 5 * 60);
  };

  const handleManualLog = async () => {
    const h = parseInt(manualHours) || 0;
    const m = parseInt(manualMinutes) || 0;
    const mins = h * 60 + m;
    const tasks = parseInt(manualTasks) || 0;
    if (mins <= 0) return;
    
    await logStudySession(mins * 60, 0, tasks, selectedTaskPreset);
    setManualHours('');
    setManualMinutes('');
    setManualTasks('');
    setSelectedTaskPreset(null);
    alert('修行の成果を記録しました！');
  };

  const logStudySession = async (duration: number, quizzes: number, tasks: number = 0, taskName: string | null = null) => {
    if (auth.currentUser) {
      await addDoc(collection(db, 'studyLogs'), {
        userId: auth.currentUser.uid,
        duration: duration,
        quizzesSolved: quizzes,
        tasksCompleted: tasks,
        taskName: taskName,
        type: mode,
        timestamp: new Date().toISOString()
      });

      const timeStr = formatHMin(Math.floor(duration / 60));
      const content = `簿記の修行を完了した！ (${timeStr}集中 ${taskName ? `/ ${taskName}` : ''} ${tasks > 0 ? `(${tasks}件)` : ''} ${quizzes > 0 ? `/ ${quizzes}問正解` : ''})`;

      await addDoc(collection(db, 'timeline'), {
        userId: auth.currentUser.uid,
        userName: profile.displayName,
        userPhoto: profile.photoURL,
        userIcon: profile.currentIcon || 'Sword',
        userTitle: profile.title || '',
        content: content,
        stats: { duration: duration, quizzes: quizzes, tasks: tasks },
        reactions: 0,
        timestamp: new Date().toISOString()
      });

      const xpGain = quizzes * 50 + Math.floor(duration / 60) * 4 + (taskName ? 100 : tasks * 30);
      const userRef = doc(db, 'users', auth.currentUser.uid);
      
      const today = format(new Date(), 'yyyy/M/d');
      const yesterday = format(new Date(Date.now() - 86400000), 'yyyy/M/d');
      
      let newStreak = profile.streak || 0;
      if (profile.lastDate !== today) {
        newStreak = (profile.lastDate === yesterday) ? newStreak + 1 : 1;
      }

      await updateDoc(userRef, {
        xp: increment(xpGain),
        totalFocusTime: increment(duration),
        totalQuizzesSolved: increment(quizzes),
        lastDate: today,
        streak: newStreak
      });
      
      const newXp = (profile.xp || 0) + xpGain;
      const newLevel = Math.floor(newXp / 200) + 1; // Corrected scaling to be a bit slower/meaningful
      
      const updates: Partial<UserProfile> = { 
        xp: newXp, 
        streak: newStreak, 
        lastDate: today 
      };
      const newTitles = [...(profile.titles || [])];

      // Automatic Job Title Progression based on HTML reference
      const JOBS = [
        { lv: 1,  n: "簿記の赤ちゃん" },
        { lv: 3,  n: "簿記の初心者" },
        { lv: 7,  n: "簿記学徒" },
        { lv: 15, n: "見習い経理" },
        { lv: 30, n: "敏腕経理マン" },
        { lv: 50, n: "決算の勇者" },
        { lv: 80, n: "経理の賢者" },
        { lv: 120,n: "伝説の会計王" }
      ];

      const currentJob = [...JOBS].reverse().find(j => newLevel >= j.lv);
      if (currentJob && !newTitles.includes(currentJob.n)) {
        newTitles.push(currentJob.n);
        updates.titles = newTitles;
        updates.title = currentJob.n;
      }

      if (newLevel > profile.level) {
        updates.level = newLevel;
      }
      
      const newAchievements = [...(profile.achievements || [])];
      // More Achievements
      if (profile.totalFocusTime + duration >= 3600 && !newAchievements.includes('集中モード')) {
        newAchievements.push('集中モード');
      }
      if (profile.totalQuizzesSolved + quizzes >= 10 && !newAchievements.includes('クイズ王')) {
        newAchievements.push('クイズ王');
      }
      if (newLevel >= 10 && !newAchievements.includes('冒険の始まり')) {
        newAchievements.push('冒険の始まり');
      }

      if (newAchievements.length > (profile.achievements?.length || 0)) {
        updates.achievements = newAchievements;
      }

      await updateDoc(userRef, updates);
      setProfile({ ...profile, ...updates });
    }
  };

  const handleSessionComplete = async () => {
    setIsActive(false);
    const duration = mode === 'work' ? 25 * 60 : 5 * 60;
    await logStudySession(duration, 0, sessionTasks, selectedTaskPreset);
    
    setMode(mode === 'work' ? 'break' : 'work');
    setTimeLeft(mode === 'work' ? 5 * 60 : 25 * 60);
    setSessionTasks(0);
    setSelectedTaskPreset(null);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`space-y-8 ${isFullscreen ? 'fixed inset-0 z-[100] bg-app-bg p-8 overflow-y-auto lg:p-12' : ''}`}
      style={{ backgroundColor: profile.currentColor || undefined, borderRadius: isFullscreen ? '0' : '24px' }}
    >
      <header className="flex items-center justify-between bg-white/50 p-6 rounded-3xl border-2 border-primary/10">
        <div>
          <h2 className="text-xl font-black tracking-tight text-primary uppercase italic">修行中</h2>
          <p className="text-app-text font-bold text-sm opacity-60 uppercase tracking-widest">{mode === 'work' ? '集中タイム' : '休憩タイム'}</p>
          {profile.title && <span className="text-xs font-black text-secondary uppercase bg-white/80 px-2 py-0.5 rounded-full mt-1 inline-block">称号: {profile.title}</span>}
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-secondary font-black text-sm tracking-widest uppercase italic">Lv.{profile?.level || 1} 探求者</div>
            <div className="w-32 h-2.5 bg-app-bg rounded-full mt-2 overflow-hidden border border-primary/5">
              <div 
                className="h-full bg-primary transition-all duration-500" 
                style={{ width: `${(profile?.xp || 0) % 100}%` }}
              />
            </div>
          </div>
          <button 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-3 bg-white/80 rounded-2xl border border-primary/10 hover:bg-white transition-all shadow-sm"
          >
            {isFullscreen ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
          </button>
        </div>
      </header>

      <div className="bg-white p-12 rounded-[48px] border-4 border-primary/20 shadow-2xl shadow-primary/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
          <Timer className="w-48 h-48 rotate-12" />
        </div>
        <div className="flex flex-col items-center relative z-10">
          <div className="text-9xl font-black font-mono tracking-tighter text-app-text mb-10 drop-shadow-sm leading-none text-center">
            {String(minutes).padStart(2, '0')}<span className="text-primary animate-pulse">:</span>{String(seconds).padStart(2, '0')}
          </div>
          <div className="flex flex-col gap-6 w-full max-w-sm">
            <div className="flex gap-4">
              <button 
                onClick={toggleTimer}
                className={`flex-1 py-5 rounded-2xl flex items-center justify-center gap-3 font-black text-xl transition-all shadow-tactile ${isActive ? 'bg-app-bg text-app-text' : 'bg-primary text-white hover:brightness-105 active:shadow-none active:translate-y-1'}`}
              >
                {isActive ? <Square className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
                {isActive ? '一時停止' : '修行開始'}
              </button>
              <button 
                onClick={resetTimer}
                className="px-6 bg-white text-primary border-2 border-primary rounded-2xl hover:bg-app-bg transition-colors font-bold"
              >
                <FastForward className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 pt-4 border-t-2 border-app-bg">
               <span className="text-[10px] font-black uppercase text-primary/40 tracking-widest block text-center">修行内容を選択</span>
               <div className="flex flex-wrap gap-2 justify-center">
                {TASK_PRESETS.map(t => (
                  <button 
                    key={t}
                    onClick={() => setSelectedTaskPreset(selectedTaskPreset === t ? null : t)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border-2 ${selectedTaskPreset === t ? 'bg-primary text-white border-primary shadow-lg' : 'bg-app-bg border-transparent hover:border-primary/10'}`}
                  >
                    {t}
                  </button>
                ))}
               </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="flex items-center gap-2 bg-app-bg/50 p-2 rounded-2xl border border-primary/10">
                <input 
                  type="number" 
                  placeholder="時" 
                  value={manualHours}
                  onChange={(e) => setManualHours(e.target.value)}
                  className="bg-transparent flex-1 px-2 py-2 font-bold outline-none text-sm text-center"
                />
              </div>
              <div className="flex items-center gap-2 bg-app-bg/50 p-2 rounded-2xl border border-primary/10">
                <input 
                  type="number" 
                  placeholder="分" 
                  value={manualMinutes}
                  onChange={(e) => setManualMinutes(e.target.value)}
                  className="bg-transparent flex-1 px-2 py-2 font-bold outline-none text-sm text-center"
                />
              </div>
              <div className="flex items-center gap-2 bg-app-bg/50 p-2 rounded-2xl border border-primary/10">
                <input 
                  type="number" 
                  placeholder="回数" 
                  value={manualTasks}
                  onChange={(e) => setManualTasks(e.target.value)}
                  className="bg-transparent flex-1 px-2 py-2 font-bold outline-none text-sm text-center"
                />
              </div>
            </div>
            <button 
              onClick={handleManualLog}
              className="w-full py-4 bg-secondary text-white rounded-2xl font-black shadow-tactile hover:brightness-105 flex items-center justify-center gap-3"
            >
              <Edit3 className="w-5 h-5" /> 成果を記録してXPを獲得！
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function BokiQuizView({ profile, setProfile }: { profile: UserProfile, setProfile: any }) {
  const [currentQuestion, setCurrentQuestion] = useState<any | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedField, setSelectedField] = useState('ランダム');
  
  const QUIZ_FIELDS = ['ランダム', '仕訳', '決算', '試算表', '工業簿記', '連結会計'];
  const aiRef = useRef<any>(null);

  const generateAIQuestion = async (fieldOverride?: string) => {
    if (!aiRef.current) {
      const apiKey = (window as any).process?.env?.GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : '');
      if (!apiKey) {
        console.error("Gemini API Key missing");
        setCurrentQuestion(QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)]);
        return;
      }
      aiRef.current = new GoogleGenAI({ apiKey });
    }
    setIsLoading(true);
    const field = fieldOverride || selectedField;
    try {
      const response = await aiRef.current.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `簿記の問題を1問。分野:「${field === 'ランダム' ? 'ランダム' : field}」。詳細な指示は不要、簡潔にJSONで。`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              answer: { type: Type.INTEGER },
              explanation: { type: Type.STRING }
            },
            required: ["question", "options", "answer", "explanation"]
          }
        }
      });
      
      const data = JSON.parse(response.text);
      setCurrentQuestion(data);
      setSelectedOption(null);
      setIsAnswered(false);
    } catch (err) {
      console.error("AI Question Error:", err);
      setCurrentQuestion(QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    generateAIQuestion();
  }, []);

  const handleAnswer = async (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);
    if (index === currentQuestion?.answer) {
      const userRef = doc(db, 'users', profile.uid);
      await updateDoc(userRef, { xp: increment(50) });
      setProfile({ ...profile, xp: profile.xp + 50 });
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/success-fanfare-trumpet-610.wav');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } else {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2019/interface-failed-error-2059.wav');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8 max-w-2xl mx-auto">
      <div className="bg-white p-8 rounded-[40px] border border-primary/10 shadow-xl overflow-x-auto">
        <div className="flex gap-2 min-w-max pb-2">
          {QUIZ_FIELDS.map(f => (
            <button 
              key={f} 
              onClick={() => { setSelectedField(f); generateAIQuestion(f); }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all border-2 ${selectedField === f ? 'bg-secondary text-white border-secondary' : 'bg-app-bg border-transparent text-app-text/40 hover:border-secondary/20'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white p-10 rounded-[40px] border-4 border-primary/20 shadow-2xl relative overflow-hidden min-h-[450px] flex flex-col justify-center">
        {isLoading ? (
          <div className="flex flex-col items-center gap-4 py-20">
            <Loader2 className="w-16 h-16 text-primary animate-spin" />
            <p className="font-black italic animate-pulse text-primary tracking-widest uppercase">AIが試練を錬成中...</p>
          </div>
        ) : currentQuestion ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-900 p-10 rounded-[48px] text-white shadow-2xl border-2 border-white/10">
            <div className="flex items-center justify-between mb-8">
              <span className="px-4 py-1 bg-white/10 text-white rounded-full text-[10px] font-black tracking-widest uppercase italic border border-white/20">AI Generated Trial</span>
              <span className="text-secondary font-black text-xs">報酬: 50 XP獲得</span>
            </div>
            <h3 className="text-2xl font-black mb-10 leading-relaxed underline decoration-secondary decoration-4 underline-offset-8">{currentQuestion.question}</h3>
            <div className="grid grid-cols-1 gap-4">
              {currentQuestion.options.map((opt: string, i: number) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  disabled={isAnswered}
                  className={`p-6 rounded-2xl text-left font-bold transition-all border-2 flex items-center justify-between ${
                    isAnswered 
                      ? i === currentQuestion.answer 
                        ? 'bg-emerald-500 border-white' 
                        : i === selectedOption 
                          ? 'bg-red-500 border-white' 
                          : 'bg-white/10 opacity-50'
                      : 'bg-white/10 border-white/10 hover:bg-white/20 hover:border-secondary'
                  }`}
                >
                  <span className="flex-1">{opt}</span>
                  {isAnswered && i === currentQuestion.answer && <CheckCircle2 className="w-6 h-6 shrink-0 ml-4" />}
                </button>
              ))}
            </div>
            {isAnswered && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-10 pt-10 border-t border-white/20">
                <div className="bg-white/5 p-6 rounded-2xl mb-8 border border-white/10 italic leading-loose text-sm opacity-90">{currentQuestion.explanation}</div>
                <button onClick={generateAIQuestion} className="w-full py-5 bg-white text-slate-900 rounded-2xl font-black text-xl shadow-xl hover:brightness-110 active:scale-[0.98] transition-all">新しき試練へ挑む</button>
              </motion.div>
            )}
          </motion.div>
        ) : null}
      </div>
    </motion.div>
  );
}

function TimelineView({ following = [], compact = false }: { following?: string[], compact?: boolean }) {
  const [posts, setPosts] = useState<TimelinePost[]>([]);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);

  useEffect(() => {
    // Show only followed users and self. Posts from private accounts are only shown if followed.
    // However, for the user themselves, their own posts are always visible on their own TL.
    const uids = [...following, auth.currentUser?.uid].filter(Boolean).slice(0, 30) as string[];
    
    if (uids.length === 0) {
      setPosts([]);
      return;
    }
    
    const q = query(
      collection(db, 'timeline'), 
      where('userId', 'in', uids),
      orderBy('timestamp', 'desc'), 
      limit(30)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TimelinePost)));
    });
    return unsubscribe;
  }, [following]);

  const reactToPost = (id: string, current: number) => {
    updateDoc(doc(db, 'timeline', id), { reactions: current + 1 });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`bg-white rounded-[40px] border border-primary/10 shadow-xl overflow-hidden ${compact ? 'h-full' : ''}`}
    >
      <div className="p-8 border-b-2 border-app-bg flex items-center justify-between">
        <h2 className="text-2xl font-black italic tracking-tight text-app-text flex items-center gap-3 text-secondary uppercase">
          <ScrollText className="w-7 h-7 text-primary" />
          {compact ? '仲間の冒険日誌' : '冒険日誌 (TL)'}
        </h2>
      </div>
      
      <div className={`p-8 space-y-8 overflow-y-auto ${compact ? 'max-h-[calc(100%-80px)]' : 'max-h-[800px]'}`}>
        {posts.length === 0 ? (
          <div className="text-center py-10 opacity-40 font-bold italic">
            まだ記録がありません。<br/>仲間を探してみましょう！
          </div>
        ) : (
          posts.map((post: any) => (
            <div key={post.id} className="space-y-4">
              <div className="flex gap-6 group hover:bg-app-bg/50 p-4 -m-4 rounded-3xl transition-colors">
                <div className="w-14 h-14 rounded-2xl bg-primary text-white border-2 border-white shadow-lg flex-shrink-0 flex items-center justify-center">
                  <IconRenderer name={post.userIcon || 'Sword'} className="w-8 h-8" level={post.stats?.level || 1} />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-black text-lg block leading-none mb-1">{post.userName}</span>
                      {post.userTitle && <span className="text-[8px] font-black uppercase text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">{post.userTitle}</span>}
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary opacity-50 block mt-1">{safeFormat(post.timestamp, 'HH:mm • MM月dd日')}</span>
                    </div>
                    {post.stats && (
                      <div className="flex gap-2">
                        <span className="bg-emerald-500 text-white font-black text-[10px] px-3 py-1 rounded-lg uppercase flex items-center gap-1">
                          <Coins className="w-3 h-3" /> +{post.stats.quizzes * 10} XP
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="font-bold text-app-text/80 leading-relaxed underline decoration-primary/20 decoration-2 underline-offset-4">{post.content}</p>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => reactToPost(post.id!, post.reactions)}
                      className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-primary rounded-xl font-black text-sm hover:brightness-95 transition-all shadow-sm active:scale-110"
                    >
                       👏 {post.reactions}
                    </button>
                    <button 
                      onClick={() => setSelectedPost(selectedPost === post.id ? null : post.id!)}
                      className="flex items-center gap-2 px-4 py-2 bg-secondary/10 text-secondary rounded-xl font-black text-sm hover:bg-secondary/20 transition-all"
                    >
                       <MessageSquare className="w-4 h-4" /> コメント
                    </button>
                  </div>
                </div>
              </div>
              
              {selectedPost === post.id && (
                <div className="ml-20">
                   <CommentSection postId={post.id!} />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}

function CommentSection({ postId }: { postId: string }) {
  const [comments, setComments] = useState<TimelineComment[]>([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    const q = query(
      collection(db, 'timeline', postId, 'comments'),
      orderBy('timestamp', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TimelineComment)));
    });
    return unsubscribe;
  }, [postId]);

  const addComment = async () => {
    if (!newComment.trim() || !auth.currentUser) return;
    await addDoc(collection(db, 'timeline', postId, 'comments'), {
      userId: auth.currentUser.uid,
      userName: auth.currentUser.displayName || '名もなき勇者',
      userPhoto: auth.currentUser.photoURL || '',
      content: newComment,
      timestamp: new Date().toISOString()
    });
    setNewComment('');
  };

  return (
    <div className="space-y-4 bg-app-bg/30 p-6 rounded-[32px] border border-primary/5">
      <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
        {comments.map(c => {
          const dateStr = safeFormat(c.timestamp, 'HH:mm');
          return (
            <div key={c.id} className="flex gap-3">
              <img src={c.userPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.userId}`} className="w-8 h-8 rounded-lg border border-primary/10" alt="" />
              <div className="flex-1 bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-primary/5">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-black text-xs text-primary">{c.userName}</span>
                  <span className="text-[8px] opacity-40 font-bold">{dateStr}</span>
                </div>
                <p className="text-xs font-bold text-app-text/90 italic">「{c.content}」</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-2">
        <input 
          type="text" 
          placeholder="返信を送る..." 
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="flex-1 bg-white/80 px-4 py-2 rounded-xl text-xs font-bold outline-none border border-primary/10 focus:border-primary"
        />
        <button 
          onClick={addComment}
          className="p-2 bg-primary text-white rounded-xl shadow-tactile active:translate-y-0.5 transition-all"
        >
          <Play className="w-4 h-4 fill-current" />
        </button>
      </div>
    </div>
  );
}

function GachaView({ profile, setProfile }: { profile: UserProfile, setProfile: any }) {
  const GACHA_COST = 50;
  const [isSpinning, setIsSpinning] = useState(false);
  const [gachaResult, setGachaResult] = useState<{ value: string, type: string, rarity: 'normal' | 'ssr' } | null>(null);
  
  const TITLES = ['簿記の騎士', '仕訳の達人', '試算表の守護者', '連結の魔法使い', '工業の星', '勘定奉行', '電卓の魔術師', '不倒の会計士', '貸借の覇者', '黄金の決算者', '天衣無縫の計理', '八百万の勘定'];
  const ICONS = ['Sword', 'ScrollText', 'Shield', 'Crown', 'Gem', 'Backpack', 'Calculator', 'Scale', 'Coins', 'Trophy', 'Flame', 'Palette', 'Settings'];
  const COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6', '#000000', '#FFFFFF'];

  const pullGacha = async () => {
    if (profile.xp < GACHA_COST) {
      alert('XPが足りません！ (必要: 50 XP)');
      return;
    }

    setIsSpinning(true);
    setGachaResult(null);

    const isSSR = Math.random() < 0.15; // 15% SSR chance
    
    // Play anticipation sound
    const audioRoll = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/magic-twinkle-glissando-fast-2568.wav');
    audioRoll.play().catch(() => {});

    await new Promise(resolve => setTimeout(resolve, 2500));

    try {
      const type = Math.random() < 0.4 ? 'title' : Math.random() < 0.7 ? 'icon' : 'color';
      let newValue = '';
      let updateKey = '';
      let listKey = '';

      if (type === 'title') {
        newValue = TITLES[Math.floor(Math.random() * TITLES.length)];
        updateKey = 'title';
        listKey = 'titles';
      } else if (type === 'icon') {
        newValue = ICONS[Math.floor(Math.random() * ICONS.length)];
        updateKey = 'currentIcon';
        listKey = 'purchasedIcons';
      } else {
        newValue = COLORS[Math.floor(Math.random() * COLORS.length)];
        updateKey = 'currentColor';
        listKey = 'purchasedColors';
      }

      if (isSSR && type === 'title') {
        newValue = '伝説の開拓者';
      }

      const userRef = doc(db, 'users', profile.uid);
      const existingList = (profile as any)[listKey] || [];
      const newUpdates: any = {
        xp: increment(-GACHA_COST),
        [updateKey]: newValue
      };
      
      if (!existingList.includes(newValue)) {
        newUpdates[listKey] = [...existingList, newValue];
      }

      await updateDoc(userRef, newUpdates);
      
      if (isSSR) {
        const audioSSR = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/gamelan-bell-hit-high-g-1435.wav');
        audioSSR.play().catch(() => {});
      } else {
        const audioNorm = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/success-fanfare-trumpet-610.wav');
        audioNorm.play().catch(() => {});
      }

      setGachaResult({ value: newValue, type, rarity: isSSR ? 'ssr' : 'normal' });
      
      setProfile({ 
        ...profile, 
        xp: profile.xp - GACHA_COST,
        [updateKey]: newValue,
        [listKey]: newUpdates[listKey] || existingList
      });
    } catch (err) {
      console.error("Gacha Error:", err);
      alert('ガチャの召喚に失敗しました。XPは消費されていません。');
    } finally {
      setIsSpinning(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
      <div className="bg-white p-10 rounded-[48px] border-4 border-secondary/20 shadow-2xl text-center space-y-6 relative overflow-hidden">
        <AnimatePresence>
          {isSpinning && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center">
              <motion.div animate={{ scale: [1, 1.5, 1], rotate: [0, 360], filter: ['hue-rotate(0deg)', 'hue-rotate(360deg)'] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-32 h-32 text-secondary flex items-center justify-center mb-8">
                <Loader2 className="w-full h-full" />
              </motion.div>
              <div className="space-y-2">
                <p className="text-white font-black text-3xl animate-pulse tracking-[0.2em] italic">召喚中...</p>
                <div className="w-48 h-1 bg-white/20 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 2.5 }} className="h-full bg-secondary" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {gachaResult && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.5, y: 50 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 1.5 }} 
              className={`absolute inset-0 z-50 flex flex-col items-center justify-center p-8 text-center space-y-8 ${gachaResult.rarity === 'ssr' ? 'bg-slate-900 border-[16px] border-yellow-400 font-bold' : 'bg-white'}`}
            >
              {gachaResult.rarity === 'ssr' && (
                <motion.div animate={{ opacity: [0.1, 0.3, 0.1] }} transition={{ repeat: Infinity, duration: 0.5 }} className="absolute inset-0 bg-yellow-400" />
              )}
              <div className="relative">
                 <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 20, ease: 'linear' }} className={`absolute inset-0 blur-2xl opacity-50 ${gachaResult.rarity === 'ssr' ? 'bg-yellow-400' : 'bg-secondary'}`} />
                 <div className={`text-8xl relative z-10 ${gachaResult.rarity === 'ssr' ? 'animate-bounce' : ''}`}>
                   {gachaResult.rarity === 'ssr' ? '🏆' : '🎁'}
                 </div>
              </div>
              <div className="relative z-10 space-y-4">
                {gachaResult.rarity === 'ssr' && <div className="inline-block px-8 py-2 bg-yellow-400 text-slate-900 rounded-full font-black text-2xl animate-pulse shadow-[0_0_20px_rgba(250,204,21,0.5)] italic tracking-widest mb-4">SSR 確定!!</div>}
                <h3 className={`text-5xl font-black italic leading-tight tracking-tighter ${gachaResult.rarity === 'ssr' ? 'text-white' : 'text-secondary'}`}>{gachaResult.value}</h3>
                <p className={`font-bold uppercase tracking-widest text-xs opacity-60 ${gachaResult.rarity === 'ssr' ? 'text-white' : 'text-app-text'}`}>新しき「{gachaResult.type === 'title' ? '称号' : gachaResult.type === 'icon' ? 'アイコン' : '背景色'}」が刻印された</p>
                <button onClick={() => setGachaResult(null)} className={`mt-10 px-12 py-4 rounded-2xl font-black text-xl shadow-tactile transition-all active:translate-y-1 active:shadow-none hover:scale-105 ${gachaResult.rarity === 'ssr' ? 'bg-yellow-400 text-slate-900' : 'bg-secondary text-white'}`}>冒険を続ける</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mx-auto w-24 h-24 bg-secondary/10 rounded-full flex items-center justify-center text-secondary relative">
          <Gift className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-black italic tracking-tight">冒険者の秘宝ガチャ</h2>
        <p className="text-app-text/60 font-bold">50 XP を消費して、新しい称号やカスタムアイテムをゲットしよう！<br/>SSRを引けば、伝説の称号が手出しされる...</p>
        <button onClick={pullGacha} disabled={isSpinning} className="w-full py-6 bg-secondary text-white rounded-3xl font-black text-2xl shadow-tactile hover:brightness-105 active:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed">ガチャを引く (50 XP)</button>
        <div className="text-sm font-black text-secondary">現在の所持XP: {profile.xp} XP</div>
      </div>

      <div className="bg-white p-8 rounded-[40px] border border-primary/10 shadow-lg">
        <h3 className="text-xl font-black mb-6 flex items-center gap-3 italic">
          <Palette className="w-6 h-6 text-primary" />
          コレクション
        </h3>
        
        <div className="grid grid-cols-2 gap-8 text-sm font-bold">
          <div className="space-y-4">
            <span className="opacity-40 block mb-3 uppercase tracking-widest text-[10px]">所持称号</span>
            <div className="flex flex-wrap gap-2">
              {profile.titles?.map(t => (
                <button 
                  key={t} 
                  onClick={() => updateDoc(doc(db, 'users', profile.uid), { title: t }).then(() => setProfile({...profile, title: t}))}
                  className={`px-3 py-1 rounded-full border-2 transition-all ${profile.title === t ? 'bg-primary text-white border-primary' : 'bg-app-bg border-primary/10 hover:border-primary/40'}`}
                >
                  {t}
                </button>
              ))}
            </div>
            
            <span className="opacity-40 block mb-3 uppercase tracking-widest text-[10px] mt-6">所持アイコン</span>
            <div className="flex flex-wrap gap-3">
              {profile.purchasedIcons?.map(ico => (
                <button 
                  key={ico} 
                  onClick={() => updateDoc(doc(db, 'users', profile.uid), { currentIcon: ico }).then(() => setProfile({...profile, currentIcon: ico}))}
                  className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all ${profile.currentIcon === ico ? 'bg-primary text-white border-primary' : 'bg-app-bg border-primary/10 hover:border-primary/40 text-primary'}`}
                >
                  <IconRenderer name={ico} className="w-5 h-5" />
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="opacity-40 block mb-3 uppercase tracking-widest text-[10px]">所持背景色</span>
            <div className="flex flex-wrap gap-3">
              {profile.purchasedColors?.map(col => (
                <button 
                  key={col} 
                  onClick={() => updateDoc(doc(db, 'users', profile.uid), { currentColor: col }).then(() => setProfile({...profile, currentColor: col}))}
                  className={`w-10 h-10 rounded-xl border-2 transition-all ${profile.currentColor === col ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-primary/10 hover:border-primary/40'}`}
                  style={{ backgroundColor: col }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function AchievementsView({ profile }: { profile: UserProfile }) {
  const ALL_ACHIEVEMENTS = [
    { id: '初学者', title: '初学者', desc: '初回の修行を完了', icon: <Flame className="w-6 h-6" /> },
    { id: '集中モード', title: '集中モード', desc: '累計 1時間以上の修行を達成', icon: <Timer className="w-6 h-6" /> },
    { id: '努力家', title: '努力家', desc: '累計 100分以上の修行を達成', icon: <Play className="w-6 h-6" /> },
    { id: 'クイズ王', title: 'クイズ王', desc: 'クイズ10問正解を達成', icon: <Brain className="w-6 h-6" /> },
    { id: '冒険の始まり', title: '冒険の始まり', desc: '冒険者レベル 10に到達', icon: <Trophy className="w-6 h-6" /> },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between px-4">
        <h2 className="text-3xl font-black italic tracking-tight text-app-text flex items-center gap-4">
          <Award className="w-8 h-8 text-primary" />
          獲得実績
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ALL_ACHIEVEMENTS.map((a) => {
          const unlocked = profile.achievements?.includes(a.id);
          return (
            <div 
              key={a.id} 
              className={`p-8 rounded-[40px] border-2 transition-all flex items-center gap-6 ${unlocked ? 'bg-white border-primary shadow-xl' : 'bg-white opacity-40 border-transparent grayscale'}`}
            >
              <div className={`p-4 rounded-3xl ${unlocked ? 'bg-primary text-white' : 'bg-app-bg text-app-text'}`}>
                {a.icon}
              </div>
              <div>
                <h3 className="font-black text-xl">{a.title}</h3>
                <p className="text-sm font-bold opacity-60">{a.desc}</p>
                {unlocked && <span className="text-[10px] font-black text-emerald-500 uppercase mt-2 block tracking-widest italic">UNLOCKED!</span>}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

const IconRenderer = ({ name, className, level = 1 }: { name?: string, className?: string, level?: number }) => {
  const icons: Record<string, any> = { Sword, ScrollText, Shield, Crown, Gem, Backpack, Calculator, Scale, Coins, Trophy, Flame, Palette, Settings, Timer, MessageSquare, User: UserIcon, Users, BookOpen, Brain, Clock, Baby, Briefcase };
  
  // Custom Evolution Logic
  if (name === 'Legendary') {
    if (level < 5) return <Baby className={`${className} text-orange-300`} />;
    if (level < 15) return <UserIcon className={`${className} text-blue-400`} />;
    if (level < 30) return <BookOpen className={`${className} text-emerald-400`} />;
    if (level < 60) return <Calculator className={`${className} text-indigo-400`} />;
    if (level < 100) return <Sword className={`${className} text-primary shadow-tactile animate-pulse`} />;
    return <Crown className={`${className} text-yellow-500 animate-bounce`} />;
  }

  const IconComponent = icons[name || 'Sword'] || Sword;
  return <IconComponent className={className} />;
};

const formatHMin = (totalMinutes: number) => {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}分`;
  return `${h}時間${m}分`;
};

const safeFormat = (dateStr: any, fmt: string) => {
  try {
    if (!dateStr) return '---';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '---';
    return format(d, fmt);
  } catch {
    return '---';
  }
};

function ProfileView({ profile, setProfile }: { profile: UserProfile, setProfile: any }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [range, setRange] = useState<'day' | 'week' | 'month' | 'all'>('week');

  useEffect(() => {
    if (auth.currentUser) {
      let q;
      if (range === 'day') {
        q = query(collection(db, 'studyLogs'), where('userId', '==', auth.currentUser.uid), orderBy('timestamp', 'desc'), limit(1));
      } else if (range === 'week') {
        q = query(collection(db, 'studyLogs'), where('userId', '==', auth.currentUser.uid), orderBy('timestamp', 'desc'), limit(7));
      } else if (range === 'month') {
        q = query(collection(db, 'studyLogs'), where('userId', '==', auth.currentUser.uid), orderBy('timestamp', 'desc'), limit(30));
      } else {
        q = query(collection(db, 'studyLogs'), where('userId', '==', auth.currentUser.uid), orderBy('timestamp', 'desc'), limit(100));
      }
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setLogs(snapshot.docs.map(doc => doc.data()));
      });
      return unsubscribe;
    }
  }, [profile.uid, range]);

  const chartData = {
    labels: logs.map(l => safeFormat(l.timestamp, range === 'day' ? 'HH:mm' : 'MM/dd')).reverse(),
    datasets: [{
      label: '修行時間 (分)',
      data: logs.map(l => Math.floor(l.duration / 60)).reverse(),
      borderColor: '#F59E0B',
      backgroundColor: (context: any) => {
        const ctx = context.chart?.ctx;
        if (!ctx) return 'rgba(245, 158, 11, 0.1)';
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(245, 158, 11, 0.4)');
        gradient.addColorStop(1, 'rgba(245, 158, 11, 0)');
        return gradient;
      },
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#F59E0B',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
    }]
  };

  const wipeAllData = async () => {
    if (!auth.currentUser || !window.confirm('これまでの全ての修行記録、タイムライン投稿、フォロー関係を完全に削除します。この操作は取り消せません。よろしいですか？（レベルと経験値は保持されます）')) return;
    
    try {
      const collectionsToWipe = ['studyLogs', 'timeline', 'follows'];
      let count = 0;

      for (const collName of collectionsToWipe) {
        const q = query(
          collection(db, collName), 
          where(collName === 'follows' ? 'followerId' : 'userId', '==', auth.currentUser.uid)
        );
        const snapshot = await getDocs(q);
        const batchPromises = snapshot.docs.map(d => deleteDoc(d.ref));
        await Promise.all(batchPromises);
        count += snapshot.size;
      }

      alert(`${count}件のデータを浄化しました。ページをリフレッシュします。`);
      window.location.reload();
    } catch (err) {
      console.error("Wipe failed:", err);
      alert('削除に失敗しました。');
    }
  };

  const resetAccount = async () => {
    if (!auth.currentUser || !window.confirm('レベル、経験値、称号も全て初期化し、最初から冒険をやり直しますか？この操作は戻せません。')) return;
    
    try {
      await wipeAllData();
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        xp: 0,
        level: 1,
        totalFocusTime: 0,
        totalQuizzesSolved: 0,
        titles: ['新人'],
        title: '新人',
        achievements: [],
        currentIcon: 'Sword',
        currentColor: '#F59E0B'
      });
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8"
    >
      <div className="bg-white/90 backdrop-blur-md p-10 rounded-[48px] border-4 border-white shadow-2xl flex flex-col md:flex-row items-center gap-10">
        <div className="relative group">
          <div className="absolute -inset-4 bg-gradient-to-r from-primary to-secondary rounded-[40px] opacity-20 blur-xl group-hover:opacity-40 transition-all duration-500"></div>
          <div className="bg-app-bg w-32 h-32 rounded-[36px] flex items-center justify-center border-4 border-white shadow-tactile relative z-10 overflow-hidden">
             {profile.photoURL ? (
               <img src={profile.photoURL} referrerPolicy="no-referrer" alt="" className="w-full h-full object-cover" />
             ) : (
               <IconRenderer name="Legendary" level={profile.level} className="w-16 h-16" />
             )}
          </div>
          <div className="absolute -bottom-2 -right-2 bg-primary text-white px-3 py-1 rounded-full font-black text-xs shadow-tactile z-20">Lv.{profile.level}</div>
        </div>
        
        <div className="flex-1 text-center md:text-left space-y-4">
          <div className="space-y-1">
            <h2 className="text-4xl font-black italic tracking-tighter text-app-text">{profile.displayName}</h2>
            <div className="flex items-center justify-center md:justify-start gap-4">
              <span className="text-primary font-black uppercase text-xs tracking-widest bg-primary/10 px-4 py-1 rounded-full">{profile.title || '見習い開拓者'}</span>
              <span className="text-orange-500 font-black text-xs px-4 py-1 bg-orange-50 rounded-full border border-orange-100 flex items-center gap-1">
                <Flame className="w-3 h-3" /> {profile.streak || 0}日連続！
              </span>
              <button 
                onClick={() => {
                  const newPrivate = !profile.isPrivate;
                  updateDoc(doc(db, 'users', profile.uid), { isPrivate: newPrivate });
                  setProfile({...profile, isPrivate: newPrivate});
                }}
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black transition-all ${profile.isPrivate ? 'bg-slate-900 text-white' : 'bg-emerald-100 text-emerald-800'}`}
              >
                {profile.isPrivate ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                {profile.isPrivate ? '隠密モード' : '公開モード'}
              </button>
            </div>
          </div>
          <div className="flex justify-center md:justify-start gap-4">
            <div className="bg-primary/5 px-6 py-3 rounded-2xl border-2 border-primary/10">
              <span className="text-[10px] font-black opacity-40 uppercase block mb-1">冒険者ID</span>
              <span className="font-mono font-bold text-lg text-primary">@{profile.accountId}</span>
            </div>
          </div>
          <div className="flex gap-4 mt-2 justify-center md:justify-start">
            <span className="px-6 py-2 bg-primary text-white rounded-2xl font-black text-sm shadow-tactile">Lv.{profile?.level}</span>
            <span className="px-6 py-2 bg-secondary text-white rounded-2xl font-black text-sm shadow-[0_4px_0_#2563EB]">{profile?.xp} XP</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[40px] border border-primary/10 shadow-lg text-center">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-app-text/40 block mb-2">累計集中時間</span>
          <div className="text-4xl font-black text-app-text tracking-tighter">{formatHMin(Math.floor(profile.totalFocusTime / 60))}</div>
        </div>
        <div className="bg-white p-10 rounded-[40px] border border-primary/10 shadow-lg text-center">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-app-text/40 block mb-2">クイズ突破数</span>
          <div className="text-5xl font-black text-app-text">{profile.totalQuizzesSolved} <span className="text-xl opacity-30">回</span></div>
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur-md p-10 rounded-[48px] border-4 border-white shadow-2xl">
        <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6">
          <div className="flex items-center gap-3">
             <div className="p-3 bg-primary rounded-2xl shadow-tactile"><Flame className="w-6 h-6 text-white" /></div>
             <h3 className="text-2xl font-black italic tracking-tight">修行記録の可視化</h3>
          </div>
          <div className="flex bg-app-bg rounded-2xl p-1.5 gap-1.5 border-2 border-primary/5">
            {(['day', 'week', 'month', 'all'] as const).map(r => (
              <button 
                key={r}
                onClick={() => setRange(r)}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${range === r ? 'bg-primary text-white shadow-tactile-active translate-y-0.5' : 'text-app-text/40 hover:text-primary hover:bg-white'}`}
              >
                {r === 'day' ? '1日' : r === 'week' ? '1週間' : r === 'month' ? '1カ月' : '累計'}
              </button>
            ))}
          </div>
        </div>
        <div className="h-80 w-full">
           {logs.length > 0 ? (
             <Line 
               data={chartData} 
               options={{ 
                 maintainAspectRatio: false, 
                 scales: { 
                   y: { 
                     beginAtZero: true,
                     grid: { color: 'rgba(0,0,0,0.05)' },
                     ticks: { font: { weight: 'bold', size: 10 } }
                   }, 
                   x: { 
                     grid: { display : false }, 
                     ticks: { font: { weight: 'bold', size: 10 } } 
                   } 
                 }, 
                 plugins: { 
                   legend: { display : false },
                   tooltip: {
                     backgroundColor: '#1E293B',
                     padding: 16,
                     titleFont: { size: 14, weight: 'bold' },
                     bodyFont: { size: 12 },
                     cornerRadius: 12,
                   }
                 } 
               }} 
             />
           ) : (
             <div className="h-full flex items-center justify-center text-app-text/20 font-black italic border-4 border-dashed border-app-bg rounded-[40px]">修行データがまだ未生成です</div>
           )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1 p-8 bg-red-50 rounded-[40px] border-4 border-red-100 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h4 className="font-black text-red-900 text-lg">修行記録の浄化</h4>
            <p className="text-red-700/60 text-sm font-bold">修行ログのみを消去します。</p>
          </div>
          <button onClick={wipeAllData} className="px-8 py-4 bg-red-600 text-white rounded-2xl font-black text-sm shadow-[0_6px_0_#991b1b] hover:brightness-110 active:shadow-none active:translate-y-1 transition-all">ログ全抹消</button>
        </div>
        <div className="flex-1 p-8 bg-slate-900 rounded-[40px] border-4 border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h4 className="font-black text-white text-lg">転生（リセット）</h4>
            <p className="text-white/40 text-sm font-bold">レベルも含め全初期化します。</p>
          </div>
          <button onClick={resetAccount} className="px-8 py-4 bg-slate-100 text-slate-900 rounded-2xl font-black text-sm shadow-[0_6px_0_#cbd5e1] hover:brightness-110 active:shadow-none active:translate-y-1 transition-all">全リフレッシュ</button>
        </div>
      </div>
    </motion.div>
  );
}
function FriendsView({ following }: { following: string[] }) {
  const [users, setUsers] = useState<any[]>([]);
  const [searchId, setSearchId] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('xp', 'desc'), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(doc => doc.data()));
    });
    return unsubscribe;
  }, []);

  const handleSearch = async () => {
    if (!searchId.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const q = query(collection(db, 'users'), where('accountId', '==', searchId.trim()));
      const snapshot = await getDocs(q);
      setSearchResults(snapshot.docs.map(d => d.data()));
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleFollow = async (targetId: string) => {
    if (!auth.currentUser) return;
    const followId = `${auth.currentUser.uid}_${targetId}`;
    if (following.includes(targetId)) {
      await deleteDoc(doc(db, 'follows', followId));
    } else {
      await setDoc(doc(db, 'follows', followId), {
        followerId: auth.currentUser.uid,
        followingId: targetId,
        timestamp: new Date().toISOString()
      });
    }
  };

  const renderUserCard = (u: any, i?: number) => {
    const isFollowing = following.includes(u.uid);
    const isMe = u.uid === auth.currentUser?.uid;
    const rank = i !== undefined ? i + 1 : null;
    
    return (
      <div key={u.uid} className={`p-6 rounded-[28px] flex items-center justify-between transition-all border-2 ${rank === 1 ? 'bg-amber-50 border-primary' : 'bg-white border-transparent hover:bg-app-bg shadow-sm'}`}>
        <div className="flex items-center gap-6">
          {rank && <span className={`w-8 text-center font-black italic text-2xl ${rank === 1 ? 'text-primary' : 'text-app-text/20'}`}>{rank}</span>}
          <div className={`w-14 h-14 rounded-2xl border-2 border-white shadow-lg flex items-center justify-center ${rank === 1 ? 'bg-primary text-white' : 'bg-app-bg text-primary'}`}>
            <IconRenderer name={u.currentIcon || 'Sword'} className="w-8 h-8" level={u.level} />
          </div>
          <div>
            <div className="font-black text-xl text-app-text flex items-center gap-2">
              {u.displayName}
              {u.isPrivate && <Lock className="w-4 h-4 opacity-40" />}
            </div>
            <div className="text-[10px] font-black text-primary/60 tracking-tighter">@{u.accountId} • Lv.{u.level} {u.title || '見習い'}</div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-2xl font-black text-secondary leading-none mb-1">{u.xp}</div>
            <div className="text-[10px] font-black uppercase opacity-30 italic">XP</div>
          </div>
          {!isMe && (
            <button 
              onClick={() => toggleFollow(u.uid)}
              className={`px-4 py-2 rounded-xl font-black text-xs transition-all shadow-sm ${isFollowing ? 'bg-app-bg text-app-text/40' : 'bg-primary text-white shadow-tactile'}`}
            >
              {isFollowing ? 'フォロー中' : 'フォロー'}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="space-y-8"
    >
      <div className="bg-white rounded-[40px] border border-primary/10 shadow-2xl overflow-hidden">
        <div className="p-10 border-b-4 border-app-bg space-y-6">
          <h2 className="text-3xl font-black italic tracking-tight text-app-text flex items-center gap-4">
            <Search className="w-8 h-8 text-secondary" />
            冒険者を探す (ID検索)
          </h2>
          <div className="flex gap-4">
            <div className="flex-1 bg-app-bg rounded-2xl flex items-center px-6 border-2 border-transparent focus-within:border-primary transition-all">
              <input 
                type="text" 
                placeholder="冒険者ID (6桁) を入力..." 
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="bg-transparent flex-1 py-4 font-bold outline-none"
              />
            </div>
            <button 
              onClick={handleSearch}
              disabled={isSearching}
              className="px-8 bg-primary text-white rounded-2xl font-black shadow-tactile hover:brightness-105 active:translate-y-1 transition-all disabled:opacity-50"
            >
              {isSearching ? <Loader2 className="w-6 h-6 animate-spin" /> : '探索'}
            </button>
          </div>
        </div>

        {searchResults.length > 0 && (
          <div className="p-8 border-b-4 border-app-bg space-y-4">
            <h3 className="font-black text-xs uppercase tracking-[0.2em] opacity-40 ml-2">検索結果</h3>
            {searchResults.map(u => renderUserCard(u))}
          </div>
        )}
        
        <div className="p-8 space-y-4">
          <h3 className="font-black text-xs uppercase tracking-[0.2em] opacity-40 ml-2">伝説の冒険者 (ランキング)</h3>
          {users.map((u, i) => renderUserCard(u, i))}
        </div>
      </div>
    </motion.div>
  );
}
