import React, { useState, useMemo, useRef, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { 
  PlusCircle, Trash2, Download, Upload, TrendingUp, TrendingDown, 
  Wallet, PieChart, Calendar as CalendarIcon, Tag, FileText, 
  CreditCard, ChevronLeft, ChevronRight, Filter, PiggyBank, 
  AlertCircle, Zap, LayoutDashboard, List, CheckCircle2, XCircle,
  ArrowRightLeft, Pencil, Check, X, Search
} from 'lucide-react'

// 로컬 백엔드 서버 주소
const API_URL = 'http://localhost:5000/api/transactions';

const App = () => {
  // --- 상태 관리 ---
  const [transactions, setTransactions] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
  const [activeTab, setActiveTab] = useState('dashboard');
  const [importStatus, setImportStatus] = useState(null);
  const fileInputRef = useRef(null);

  // 수정 관련 상태
  const [editingId, setEditingId] = useState(null);
  const [editDate, setEditDate] = useState('');

  // 카테고리 정의
  const categories = useMemo(() => ({
    income: ['월급', '부수입', '보너스', '기타'],
    expense: ['식비(집밥)', '외식/배달', '생활비', '교통비', '쇼핑', '주거/통신', '의료/건강', '문화/여가', '대출', '보험', '저축', '기타'],
    transfer: ['카드대금 납부', '계좌이체', '현금인출', '기타']
  }), []);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'expense',
    category: '식비(집밥)',
    paymentMethod: '신용카드',
    memo: '',
    amount: ''
  });

  const paymentMethods = ['신용카드', '체크카드', '현금'];

  // --- 데이터 불러오기 ---
  const fetchTransactions = () => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => setTransactions(data))
      .catch(() => setImportStatus({ type: 'error', message: '서버 연결 실패!' }));
  };

  useEffect(() => { fetchTransactions(); }, []);

  useEffect(() => {
    if (importStatus) {
      const timer = setTimeout(() => setImportStatus(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [importStatus]);

  // --- 데이터 계산 로직 ---
  const filteredData = useMemo(() => {
    const curr = transactions.filter(t => t.date && t.date.startsWith(currentMonth));
    const prevMonthStr = (() => {
      const d = new Date(currentMonth + '-01');
      d.setMonth(d.getMonth() - 1);
      return d.toISOString().slice(0, 7);
    })();
    const prev = transactions.filter(t => t.date && t.date.startsWith(prevMonthStr));
    return { curr, prev };
  }, [transactions, currentMonth]);

  const stats = useMemo(() => {
    const getS = (list) => {
      const income = list.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expense = list.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const cardDue = list.filter(t => t.type === 'expense' && t.paymentMethod === '신용카드').reduce((s, t) => s + t.amount, 0);
      const cats = {};
      list.filter(t => t.type === 'expense').forEach(t => { cats[t.category] = (cats[t.category] || 0) + t.amount; });
      return { income, expense, balance: income - expense, cardDue, cats };
    };
    return { curr: getS(filteredData.curr), prev: getS(filteredData.prev) };
  }, [filteredData]);

  // 냉정한 분석 (팩폭) 로직
  const insights = useMemo(() => {
    const list = [];
    if (filteredData.curr.length === 0) return [{ type: 'info', title: '분석 대기 중', text: '기록을 해야 내가 잔소리를 하지.' }];

    const diff = stats.curr.expense - stats.prev.expense;
    if (diff > 0 && stats.prev.expense > 0) {
      list.push({ type: 'warning', title: '너 이번 달 왜 이럼? 💸', text: `지난달보다 ${diff.toLocaleString()}원 더 썼어! 정신 안 차려?` });
    }

    const deliverySpend = stats.curr.cats['외식/배달'] || 0;
    if (deliverySpend > 200000) {
      list.push({ type: 'danger', title: '배달 어플 VIP세요? 🍔', text: `외식/배달로만 ${deliverySpend.toLocaleString()}원.. 그 돈이면 집을 샀겠다.` });
    }

    if (stats.curr.cardDue > stats.curr.income * 0.5 && stats.curr.income > 0) {
      list.push({ type: 'danger', title: '카드 값은 빚이야! 💳', text: '수입 절반을 카드로 긁었네? 다음 달의 네가 울고 있어.' });
    }

    if (list.length === 0) list.push({ type: 'success', title: '오.. 꽤 선방하는데? 👍', text: '현재까지는 아주 건전해. 이대로만 가자.' });
    return list;
  }, [stats, filteredData]);

  // 캘린더 날짜별 합계 계산
  const calendarDays = useMemo(() => {
    const [year, month] = currentMonth.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1).getDay();
    const lastDate = new Date(year, month, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= lastDate; d++) {
      const dateStr = `${currentMonth}-${String(d).padStart(2, '0')}`;
      const dayT = filteredData.curr.filter(t => t.date === dateStr);
      days.push({ 
        day: d, 
        income: dayT.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        expense: dayT.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
        transactions: dayT 
      });
    }
    return days;
  }, [currentMonth, filteredData.curr]);

  // 선택된 날짜의 상세 내역 필터링
  const selectedDayTransactions = useMemo(() => {
    return filteredData.curr.filter(t => t.date === formData.date);
  }, [filteredData.curr, formData.date]);

  // --- 핸들러 함수 ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newState = { ...prev, [name]: value };
      if (name === 'type') newState.category = categories[value][0];
      return newState;
    });
  };

  const handleDateSelect = (day) => {
    if (!day) return;
    const formattedDate = `${currentMonth}-${String(day).padStart(2, '0')}`;
    setFormData(prev => ({ ...prev, date: formattedDate }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.memo) return;
    const newT = { ...formData, id: crypto.randomUUID(), amount: Number(formData.amount) };
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newT)
      });
      if (res.ok) {
        setTransactions([newT, ...transactions]);
        setFormData(prev => ({ ...prev, memo: '', amount: '' }));
        setImportStatus({ type: 'success', message: '엑셀에 저장 완료!' });
      }
    } catch { setImportStatus({ type: 'error', message: '저장 실패!' }); }
  };

  const saveEdit = async (id) => {
    const originalT = transactions.find(t => t.id === id);
    if (!originalT || originalT.date === editDate) { setEditingId(null); return; }
    const updatedT = { ...originalT, date: editDate };
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedT)
      });
      if (res.ok) {
        setTransactions(transactions.map(t => t.id === id ? updatedT : t));
        setEditingId(null);
        setImportStatus({ type: 'success', message: '수정 완료!' });
      }
    } catch { setImportStatus({ type: 'error', message: '수정 실패!' }); }
  };

  const deleteT = async (id) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (res.ok) setTransactions(transactions.filter(t => t.id !== id));
    } catch { setImportStatus({ type: 'error', message: '삭제 실패!' }); }
  };

  // CSV 내보내기
  const exportToCSV = () => {
    if (transactions.length === 0) return;
    const headers = ['날짜', '구분', '카테고리', '결제수단', '내용', '금액'];
    const rows = transactions.map(t => [`"${t.date}"`, `"${t.type === 'income' ? '수입' : t.type === 'transfer' ? '이체' : '지출'}"`, `"${t.category}"`, `"${t.paymentMethod}"`, `"${t.memo.replace(/"/g, '""')}"`, t.amount]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `가계부_백업_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // --- CSV 불러오기 (중복 체크 로직 포함) ---
  const handleImportCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const lines = ev.target.result.split(/\r?\n/).filter(l => l.trim() !== '');
      let addedCount = 0;
      let skipCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.replace(/^["']|["']$/g, '').trim());
        if (parts.length < 6) continue;

        const date = parts[0];
        const typeStr = parts[1];
        const type = typeStr.includes('수입') ? 'income' : typeStr.includes('이체') ? 'transfer' : 'expense';
        const category = parts[2];
        const paymentMethod = parts[3];
        const memo = parts[4];
        const amount = parseInt(parts[5]);

        // [중복 체크 핵심 로직]
        // 현재 가지고 있는 모든 내역(transactions) 중에 동일한 데이터가 있는지 검사
        const isDuplicate = transactions.some(existing => 
          existing.date === date &&
          existing.type === type &&
          existing.category === category &&
          existing.memo === memo &&
          existing.amount === amount
        );

        if (isDuplicate) {
          skipCount++;
          continue; // 중복이면 다음 행으로 건너뜀
        }

        const entry = { id: crypto.randomUUID(), date, type, category, paymentMethod, memo, amount };
        
        await fetch(API_URL, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify(entry) 
        });
        addedCount++;
      }
      
      fetchTransactions();
      if (addedCount > 0) {
        setImportStatus({ 
          type: 'success', 
          message: `${addedCount}건을 불러왔습니다.${skipCount > 0 ? ` (중복 ${skipCount}건 제외)` : ''}` 
        });
      } else if (skipCount > 0) {
        setImportStatus({ type: 'error', message: `새로운 내역이 없습니다. (중복 ${skipCount}건 발견)` });
      }
    };
    reader.readAsText(file, 'UTF-8');
    e.target.value = null; // 파일 입력 초기화
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {importStatus && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
            <div className={`${importStatus.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'} text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold border-2 border-white/20 animate-bounce`}>
              {importStatus.type === 'success' ? <CheckCircle2 /> : <XCircle />}
              {importStatus.message}
            </div>
          </div>
        )}

        {/* 헤더 섹션 */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
          <div>
            <h1 className="text-3xl font-black text-indigo-600 flex items-center gap-2 tracking-tighter"><Zap className="fill-indigo-600" /> Savage Budget</h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Excel Data Persistence Mode</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-white border p-1 rounded-xl shadow-sm mr-2">
              <button onClick={() => fileInputRef.current.click()} className="p-2 hover:bg-slate-50 rounded-lg text-slate-600" title="가져오기 (중복 체크 적용)"><Upload className="w-5 h-5" /></button>
              <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleImportCSV} />
              <button onClick={exportToCSV} className="p-2 hover:bg-slate-50 rounded-lg text-slate-600" title="백업"><Download className="w-5 h-5" /></button>
            </div>
            <div className="flex bg-white border p-1 rounded-xl shadow-sm overflow-hidden text-sm font-bold">
              <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2 rounded-lg ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>대시보드</button>
              <button onClick={() => setActiveTab('calendar')} className={`px-4 py-2 rounded-lg ${activeTab === 'calendar' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>캘린더</button>
              <button onClick={() => setActiveTab('list')} className={`px-4 py-2 rounded-lg ${activeTab === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>상세내역</button>
            </div>
          </div>
        </header>

        {/* 월 선택 UI */}
        <div className="flex items-center justify-between bg-white p-6 rounded-3xl mb-8 shadow-sm border font-black">
          <button onClick={() => setCurrentMonth(p => { const d = new Date(p + '-01'); d.setMonth(d.getMonth()-1); return d.toISOString().slice(0, 7); })} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><ChevronLeft className="w-6 h-6" /></button>
          <div className="text-center">
            <div className="text-xs text-indigo-500 uppercase tracking-widest">{currentMonth.split('-')[0]}년</div>
            <div className="text-2xl">{currentMonth.split('-')[1]}월 현황</div>
          </div>
          <button onClick={() => setCurrentMonth(p => { const d = new Date(p + '-01'); d.setMonth(d.getMonth()+1); return d.toISOString().slice(0, 7); })} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><ChevronRight className="w-6 h-6" /></button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            {/* 1. 대시보드 탭 */}
            {activeTab === 'dashboard' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm font-bold">
                  <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-xl">
                    <div className="text-indigo-100 text-xs mb-1 uppercase tracking-wider">이달의 잔액</div>
                    <div className="text-2xl font-black">{stats.curr.balance.toLocaleString()}원</div>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border shadow-sm">
                    <div className="text-slate-400 text-xs mb-1 uppercase tracking-wider">총 수입</div>
                    <div className="text-2xl font-black text-emerald-500">+{stats.curr.income.toLocaleString()}원</div>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border shadow-sm">
                    <div className="text-slate-400 text-xs mb-1 uppercase tracking-wider">총 지출</div>
                    <div className="text-2xl font-black text-rose-500">-{stats.curr.expense.toLocaleString()}원</div>
                  </div>
                  <div className="bg-slate-800 p-6 rounded-3xl text-white shadow-lg border-b-4 border-indigo-500">
                    <div className="text-indigo-300 text-xs mb-1 uppercase tracking-wider">카드 미결제</div>
                    <div className="text-2xl font-black">{stats.curr.cardDue.toLocaleString()}원</div>
                  </div>
                </div>

                <div className="bg-slate-900 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10"><AlertCircle className="w-24 h-24" /></div>
                  <h3 className="font-bold mb-6 flex items-center gap-2 text-lg"><Zap className="text-yellow-400 fill-yellow-400" /> 냉정한 분석 보고서</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {insights.map((ins, i) => (
                      <div key={i} className="bg-white/5 border border-white/10 p-5 rounded-2xl transition-all hover:bg-white/10">
                        <div className={`font-black mb-1 ${ins.type === 'danger' ? 'text-rose-400' : ins.type === 'warning' ? 'text-yellow-400' : 'text-indigo-300'}`}>{ins.title}</div>
                        <p className="text-sm text-slate-300 leading-relaxed">{ins.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-8 rounded-3xl border shadow-sm">
                  <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><PieChart className="text-indigo-600" /> 지출 비중</h3>
                  <div className="space-y-4">
                    {Object.entries(stats.curr.cats).sort((a,b) => b[1]-a[1]).map(([cat, val]) => {
                      const pct = stats.curr.expense > 0 ? ((val / stats.curr.expense) * 100).toFixed(1) : 0;
                      return (
                        <div key={cat}>
                          <div className="flex justify-between text-sm font-bold text-slate-600 mb-1">
                            <span>{cat}</span><span>{val.toLocaleString()}원 ({pct}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            )}

            {/* 2. 캘린더 탭 */}
            {activeTab === 'calendar' && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-3xl border shadow-sm">
                  <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-xl overflow-hidden">
                    {['일','월','화','수','목','금','토'].map(d => <div key={d} className="bg-slate-50 py-3 text-center text-xs font-black text-slate-400 uppercase">{d}</div>)}
                    {calendarDays.map((d, i) => (
                      <div 
                        key={i} 
                        onClick={() => d && handleDateSelect(d.day)}
                        className={`min-h-[110px] bg-white p-2 transition-all group ${d ? 'hover:bg-indigo-50/50 cursor-pointer relative' : 'bg-slate-50/50'}`}
                      >
                        {d && (
                          <>
                            <div className={`text-xs font-bold mb-1 transition-colors ${formData.date === `${currentMonth}-${String(d.day).padStart(2, '0')}` ? 'text-indigo-600 underline decoration-2 underline-offset-4' : 'text-slate-400'}`}>
                              {d.day}
                            </div>
                            <div className="space-y-1">
                              {d.income > 0 && <div className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md leading-tight">+{d.income.toLocaleString()}</div>}
                              {d.expense > 0 && <div className="text-[9px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md leading-tight">-{d.expense.toLocaleString()}</div>}
                            </div>
                            {formData.date === `${currentMonth}-${String(d.day).padStart(2, '0')}` && (
                              <div className="absolute inset-0 border-2 border-indigo-400 rounded-lg pointer-events-none"></div>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-black text-lg flex items-center gap-2"><Search className="w-5 h-5 text-indigo-600" />{formData.date} 상세 내역</h3>
                    <div className="text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full uppercase">Daily Activity</div>
                  </div>
                  
                  {selectedDayTransactions.length > 0 ? (
                    <div className="space-y-3">
                      {selectedDayTransactions.map(t => (
                        <div key={t.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-all">
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-xl ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600' : t.type === 'transfer' ? 'bg-indigo-100 text-indigo-600' : 'bg-rose-100 text-rose-600'}`}>
                              {t.type === 'income' ? <TrendingUp className="w-4 h-4" /> : t.type === 'transfer' ? <ArrowRightLeft className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            </div>
                            <div>
                              <div className="text-sm font-black text-slate-700">{t.memo}</div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase">{t.category} • {t.paymentMethod}</div>
                            </div>
                          </div>
                          <div className={`text-sm font-black ${t.type === 'income' ? 'text-emerald-500' : t.type === 'transfer' ? 'text-indigo-500' : 'text-slate-900'}`}>
                            {t.type === 'income' ? '+' : t.type === 'transfer' ? '' : '-'}{t.amount.toLocaleString()}원
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-300 italic text-sm">기록된 내역이 없습니다.</div>
                  )}
                </div>
              </div>
            )}

            {/* 3. 상세내역 탭 */}
            {activeTab === 'list' && (
              <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold">
                    <tr><th className="px-6 py-4">날짜</th><th className="px-6 py-4">내용</th><th className="px-6 py-4 text-right">금액</th><th className="px-6 py-4 text-center">작업</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-sm">
                    {filteredData.curr.sort((a,b) => new Date(b.date) - new Date(a.date)).map(t => (
                      <tr key={t.id} className="hover:bg-slate-50 group">
                        <td className="px-6 py-4 text-xs font-bold whitespace-nowrap">
                          {editingId === t.id ? (
                            <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="border rounded px-1 py-0.5 outline-none focus:ring-1 focus:ring-indigo-500" />
                          ) : (
                            <div className="flex items-center gap-2">{t.date} <button onClick={() => {setEditingId(t.id); setEditDate(t.date);}} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-indigo-500"><Pencil className="w-3 h-3" /></button></div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-black text-slate-700 flex items-center gap-2">{t.type === 'transfer' && <ArrowRightLeft className="w-3 h-3 text-indigo-400" />}{t.memo}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{t.category} • {t.paymentMethod}</div>
                        </td>
                        <td className={`px-6 py-4 font-black text-right ${t.type === 'income' ? 'text-emerald-500' : t.type === 'transfer' ? 'text-indigo-400' : 'text-slate-900'}`}>
                          {t.type === 'income' ? '+' : t.type === 'transfer' ? '' : '-'}{t.amount.toLocaleString()}원
                        </td>
                        <td className="px-6 py-4 text-center">
                          {editingId === t.id ? (
                            <div className="flex justify-center gap-1"><button onClick={() => saveEdit(t.id)} className="text-emerald-500 p-1"><Check className="w-4 h-4" /></button><button onClick={() => setEditingId(null)} className="text-rose-500 p-1"><X className="w-4 h-4" /></button></div>
                          ) : (
                            <button onClick={() => deleteT(t.id)} className="text-slate-200 hover:text-rose-500 p-2"><Trash2 className="w-4 h-4" /></button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 내역 등록 섹션 */}
          <div className="lg:col-span-4">
            <div className="bg-white p-8 rounded-3xl border shadow-xl sticky top-8">
              <h2 className="text-xl font-black mb-8 flex items-center gap-2"><PlusCircle className="text-indigo-600" /> 내역 등록</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">날짜</label>
                  <input type="date" name="date" value={formData.date} onChange={handleInputChange} className={`w-full border-none rounded-xl p-4 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-colors ${formData.date !== new Date().toISOString().split('T')[0] ? 'bg-indigo-50' : 'bg-slate-50'}`} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <select name="type" value={formData.type} onChange={handleInputChange} className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold outline-none">
                    <option value="expense">지출 💸</option><option value="income">수입 💰</option><option value="transfer">이체 🔄</option>
                  </select>
                  <select name="category" value={formData.category} onChange={handleInputChange} className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold outline-none">
                    {categories[formData.type].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  {paymentMethods.map(m => (
                    <button key={m} type="button" onClick={() => setFormData(p => ({...p, paymentMethod: m}))} className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${formData.paymentMethod === m ? 'bg-slate-800 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>{m}</button>
                  ))}
                </div>
                <input type="text" name="memo" placeholder="내용" value={formData.memo} onChange={handleInputChange} className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold outline-none" />
                <div className="relative">
                  <input type="number" name="amount" placeholder="0" value={formData.amount} onChange={handleInputChange} className="w-full bg-slate-50 border-none rounded-xl p-4 pl-12 font-black text-2xl outline-none" />
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-300">₩</span>
                </div>
                <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-indigo-100 transition-all active:scale-[0.98]">기록하기</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>)
