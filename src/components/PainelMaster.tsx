import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { Store } from '../types';
import { 
  Crown, Search, Plus, Trash2, Edit2, AlertCircle, CheckCircle2, 
  Globe, Shield, RefreshCw, LogOut, Tag, DollarSign, Eye, 
  Check, X, Ban, Play, Pause, ExternalLink, MessageSquare, Phone, Map, Briefcase
} from 'lucide-react';

export default function PainelMaster() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Stores State
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'paid' | 'unpaid' | 'paused' | 'blocked'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);

  // Form Fields
  const [formOwnerName, setFormOwnerName] = useState('');
  const [formOwnerEmail, setFormOwnerEmail] = useState('');
  const [formOwnerPassword, setFormOwnerPassword] = useState('');
  const [formNiche, setFormNiche] = useState('hamburgueria');
  const [formStoreName, setFormStoreName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formWhatsApp, setFormWhatsApp] = useState('');
  const [formPlan, setFormPlan] = useState<'gratis' | 'normal' | 'indicacao'>('gratis');
  const [formReferrerName, setFormReferrerName] = useState('');
  const [formReferrerWhatsApp, setFormReferrerWhatsApp] = useState('');
  const [formReferrerCommission, setFormReferrerCommission] = useState(0);
  const [formPaid, setFormPaid] = useState(true);
  const [formPaused, setFormPaused] = useState(false);
  const [formBlocked, setFormBlocked] = useState(false);
  const [formTrialDays, setFormTrialDays] = useState(7);

  // Store analytical view state
  const [selectedStoreDetail, setSelectedStoreDetail] = useState<any | null>(null);
  const [storeDetailStats, setStoreDetailStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    recentOrders: [] as any[],
    productCount: 0
  });
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Notifications / Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const isAuth = sessionStorage.getItem('pedifacil_master_logged_in') === 'true';
    if (isAuth) {
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchStores();
    }
  }, [isLoggedIn]);

  // Sync slug helper
  useEffect(() => {
    if (!editingStoreId && formStoreName) {
      const generated = formStoreName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      setFormSlug(generated);
    }
  }, [formStoreName, editingStoreId]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() === 'beleensematheus350@gmail.com' && password === 'camamesa') {
      sessionStorage.setItem('pedifacil_master_logged_in', 'true');
      setIsLoggedIn(true);
      setLoginError('');
      showToast('Bem-vindo, Administrador! 👑', 'success');
    } else {
      setLoginError('E-mail ou senha incorretos para o Painel Master.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('pedifacil_master_logged_in');
    setIsLoggedIn(false);
    showToast('Sessão encerrada.', 'info');
  };

  const getNormalizedSlug = (store: any) => {
    const rawSlug = String(store.slug || '').trim().toLowerCase();
    const rawName = String(store.nome || store.name || '').trim().toLowerCase();
    const sourceSlug = rawSlug && rawSlug !== 'burger-do-gordo' ? rawSlug : rawName || rawSlug;
    return sourceSlug
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Robust helper to map, sanitize, trim and de-duplicate stores
  const sanitizeAndMapStores = (rawList: any[]) => {
    if (!Array.isArray(rawList)) return [];
    
    // De-duplicate by ID first to avoid duplicate key issues in React list rendering
    const seenIds = new Set<string>();
    const uniques = rawList.filter(s => {
      if (!s || !s.id) return false;
      if (seenIds.has(s.id)) return false;
      seenIds.add(s.id);
      return true;
    });

    return uniques.map((s: any) => {
      const nomeVal = String(s.nome || s.name || s.name_store || '').trim();
      const ownerNameVal = String(s.owner_name || s.nome_proprietario || '').trim();
      const ownerEmailVal = String(s.owner_email || s.email || '').trim();
      const ownerPasswordVal = String(s.owner_password || s.senha || '').trim();
      const whatsappVal = String(s.whatsapp || s.telefone || '').replace(/\D/g, '').trim();
      const rawSlugVal = String(s.slug || '').trim().toLowerCase();
      const slugSource = rawSlugVal && rawSlugVal !== 'burger-do-gordo' ? rawSlugVal : nomeVal.toLowerCase() || rawSlugVal;
      const computedSlug = slugSource
        ? slugSource
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-+|-+$/g, '')
        : '';
      
      return {
        ...s,
        slug: computedSlug,
        nome: nomeVal !== '' ? nomeVal : 'Sem Nome',
        owner_name: ownerNameVal !== '' ? ownerNameVal : 'Proprietário',
        owner_email: ownerEmailVal !== '' ? ownerEmailVal : 'admin@burgerdogordo.com',
        owner_password: ownerPasswordVal !== '' ? ownerPasswordVal : 'gordo',
        whatsapp: whatsappVal !== '' ? whatsappVal : 'Não inserido',
        vencimento: s.vencimento || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        nicho: s.nicho || 'hamburgueria',
        plano: s.plano || 'normal',
        pago: s.pago !== false,
        bloqueado: s.bloqueado === true,
        pausado: s.pausado === true
      };
    });
  };

  // Fetch from Supabase with LocalStorage fallback
  const fetchStores = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('lojas')
        .select('*')
        .order('vencimento', { ascending: true }); // Ordenados por data de vencimento por padrão!

      if (error) throw error;

      if (data && data.length > 0) {
        const mapped = sanitizeAndMapStores(data);
        setStores(mapped);
        // Sync to local as backup
        localStorage.setItem('pedifacil_db_stores', JSON.stringify(mapped));
      } else {
        // Fallback local caso novo supabase esteja vazio
        const local = localStorage.getItem('pedifacil_db_stores');
        if (local) {
          try {
            setStores(sanitizeAndMapStores(JSON.parse(local)));
          } catch {
            setStores([]);
          }
        } else {
          // Initialize Burger do gordo local fallback representation
          const fallbackData = [
            {
              id: 'd2e951a5-f6a5-4d50-b6b1-28f1dc19dc28',
              nome: 'Burger do Gordo',
              slug: 'burger-do-gordo',
              slogan: 'Estúpido de tão suculento! 🍔🔥',
              whatsapp: '5586994240872',
              cor_primaria: '#FF3D00',
              cor_secundaria: '#111111',
              aberto: true,
              owner_name: 'Mateus Gordo',
              owner_email: 'admin@burgerdogordo.com',
              owner_password: 'gordo',
              nicho: 'hamburgueria',
              plano: 'normal',
              pago: true,
              bloqueado: false,
              pausado: false,
              vencimento: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
              criado_em: new Date().toISOString()
            }
          ];
          const mapped = sanitizeAndMapStores(fallbackData);
          setStores(mapped);
          localStorage.setItem('pedifacil_db_stores', JSON.stringify(mapped));
        }
      }
    } catch (err: any) {
      console.warn('Erro ao ler do Supabase, usando backup local:', err.message);
      const local = localStorage.getItem('pedifacil_db_stores');
      if (local) {
        try {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed)) {
            setStores(sanitizeAndMapStores(parsed));
          }
        } catch {
          // ignore
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats for a specific store
  const fetchStoreDetails = async (store: any) => {
    setSelectedStoreDetail(store);
    setStoreDetailStats({
      totalOrders: 0,
      totalRevenue: 0,
      recentOrders: [],
      productCount: 0
    });
    setIsDetailModalOpen(true);

    try {
      // 1. Contar produtos daquela loja
      const { data: prods, error: ep } = await supabase
        .from('produtos')
        .select('id')
        .eq('loja_id', store.id);

      // 2. Buscar pedidos
      const { data: ords, error: eo } = await supabase
        .from('pedidos')
        .select('*')
        .eq('loja_id', store.id)
        .order('created_at', { ascending: false });

      const productCount = prods?.length || 0;
      const totalOrders = ords?.length || 0;
      const totalRevenue = ords?.reduce((acc: number, cur: any) => acc + Number(cur.total || 0), 0) || 0;
      const recentOrders = ords?.slice(0, 5) || [];

      setStoreDetailStats({
        totalOrders,
        totalRevenue,
        recentOrders,
        productCount
      });
    } catch (err) {
      console.warn('Erro ao carregar métricas detalhadas no Supabase:', err);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingStoreId(null);
    setFormOwnerName('');
    setFormOwnerEmail('');
    setFormOwnerPassword('');
    setFormNiche('hamburgueria');
    setFormStoreName('');
    setFormSlug('');
    setFormWhatsApp('');
    setFormPlan('gratis');
    setFormReferrerName('');
    setFormReferrerWhatsApp('');
    setFormReferrerCommission(0);
    setFormPaid(true);
    setFormPaused(false);
    setFormBlocked(false);
    setFormTrialDays(7);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (store: any) => {
    setEditingStoreId(store.id);
    setFormOwnerName(store.owner_name || '');
    setFormOwnerEmail(store.owner_email || '');
    setFormOwnerPassword(store.owner_password || '');
    setFormNiche(store.nicho || 'hamburgueria');
    setFormStoreName(store.nome || '');
    setFormSlug(store.slug || '');
    setFormWhatsApp(store.whatsapp || '');
    setFormPlan((store.plano as any) || 'gratis');
    setFormReferrerName(store.quem_indicou || '');
    setFormReferrerWhatsApp(store.whatsapp_indicou || '');
    setFormReferrerCommission(Number(store.quanto_receber_indicacao || 0));
    setFormPaid(store.pago !== false);
    setFormPaused(store.pausado === true);
    setFormBlocked(store.bloqueado === true);
    setIsModalOpen(true);
  };

  const handleDeleteStore = async (storeId: string, slug: string) => {
    if (slug === 'burger-do-gordo') {
      showToast('A loja padrão Burger do Gordo não pode ser removida!', 'error');
      return;
    }

    if (!confirm('Deseja realmente excluir esta loja permanentemente? Todos os produtos e pedidos também serão apagados.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('lojas')
        .delete()
        .eq('id', storeId);

      if (error) throw error;

      showToast('Loja removida permanentemente.', 'success');
      // Update local state
      const updated = stores.filter(s => s.id !== storeId);
      setStores(updated);
      localStorage.setItem('pedifacil_db_stores', JSON.stringify(updated));
    } catch (err: any) {
      // Local fallback edit
      const updated = stores.filter(s => s.id !== storeId);
      setStores(updated);
      localStorage.setItem('pedifacil_db_stores', JSON.stringify(updated));
      showToast('Loja removida localmente (Supabase indisponível).', 'info');
    }
  };

  const handleToggleBlock = async (store: any) => {
    const updatedBlocked = !store.bloqueado;
    try {
      const { error } = await supabase
        .from('lojas')
        .update({ bloqueado: updatedBlocked })
        .eq('id', store.id);

      if (error) throw error;

      showToast(updatedBlocked ? 'Loja bloqueada com sucesso!' : 'Loja desbloqueada!', 'success');
      fetchStores();
    } catch (err) {
      // Local edit
      const updated = stores.map(s => s.id === store.id ? { ...s, bloqueado: updatedBlocked } : s);
      setStores(updated);
      localStorage.setItem('pedifacil_db_stores', JSON.stringify(updated));
      showToast('Atualizado localmente (Sem conexão Supabase).', 'info');
    }
  };

  const handleTogglePause = async (store: any) => {
    const updatedPaused = !store.pausado;
    try {
      const { error } = await supabase
        .from('lojas')
        .update({ pausado: updatedPaused })
        .eq('id', store.id);

      if (error) throw error;

      showToast(updatedPaused ? 'Loja pausada!' : 'Loja reativada!', 'success');
      fetchStores();
    } catch (err) {
      // Local edit
      const updated = stores.map(s => s.id === store.id ? { ...s, pausado: updatedPaused } : s);
      setStores(updated);
      localStorage.setItem('pedifacil_db_stores', JSON.stringify(updated));
      showToast('Atualizado localmente.', 'info');
    }
  };

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formStoreName.trim() || !formSlug.trim() || !formOwnerEmail.trim() || !formOwnerPassword.trim()) {
      showToast('Por favor, preencha todos os campos obrigatórios!', 'error');
      return;
    }

    // Calcula vencimento
    let calculatedVencimento = new Date();
    if (formPlan === 'gratis') {
      calculatedVencimento.setDate(calculatedVencimento.getDate() + Number(formTrialDays));
    } else {
      calculatedVencimento.setDate(calculatedVencimento.getDate() + 30); // 30 dias para normal ou indicação
    }

    const storePayload: any = {
      nome: formStoreName.trim(),
      slug: formSlug.trim(),
      owner_name: formOwnerName.trim() || 'Proprietário',
      owner_email: formOwnerEmail.trim(),
      owner_password: formOwnerPassword,
      whatsapp: formWhatsApp.replace(/\D/g, ''),
      nicho: formNiche,
      plano: formPlan,
      quem_indicou: formPlan === 'indicacao' ? formReferrerName.trim() : null,
      whatsapp_indicou: formPlan === 'indicacao' ? formReferrerWhatsApp.replace(/\D/g, '') : null,
      quanto_receber_indicacao: formPlan === 'indicacao' ? formReferrerCommission : 0,
      pago: formPaid,
      bloqueado: formBlocked,
      pausado: formPaused,
      vencimento: calculatedVencimento.toISOString()
    };

    try {
      if (editingStoreId) {
        const { error } = await supabase
          .from('lojas')
          .update(storePayload)
          .eq('id', editingStoreId);

        if (error) throw error;
        showToast('Loja atualizada com sucesso!', 'success');
      } else {
        // Criar id aleatório para bater com schema
        storePayload.id = crypto.randomUUID();
        storePayload.criado_em = new Date().toISOString();
        
        const { error } = await supabase
          .from('lojas')
          .insert([storePayload]);

        if (error) throw error;
        showToast('Nova loja cadastrada com sucesso! 🚀', 'success');
      }

      setIsModalOpen(false);
      fetchStores();
    } catch (err: any) {
      console.warn('Salvando localmente devido a erro no Supabase:', err);

      // Local fallback
      const storeList = [...stores];
      if (editingStoreId) {
        const index = storeList.findIndex(s => s.id === editingStoreId);
        if (index >= 0) {
          storeList[index] = { ...storeList[index], ...storePayload };
        }
      } else {
        const newStore = {
          id: crypto.randomUUID(),
          criado_em: new Date().toISOString(),
          ...storePayload
        };
        storeList.push(newStore);
      }

      setStores(storeList);
      localStorage.setItem('pedifacil_db_stores', JSON.stringify(storeList));
      setIsModalOpen(false);
      showToast('Salvo em cache local de segurança.', 'success');
    }
  };

  // Helper de cálculo de dias restantes para expirar
  const getDaysRemaining = (vencimentoStr: string) => {
    if (!vencimentoStr) return 0;
    const now = new Date();
    const venc = new Date(vencimentoStr);
    if (isNaN(venc.getTime())) return 0;
    const diffTime = venc.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 0;
  };

  // Filtragem Inteligente dos Planos / Status
  const filteredStores = stores.filter(store => {
    // 1. Filtro busca por texto (nome, slug ou proprietário)
    const matchesSearch = 
      (store.nome || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      (store.slug || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      (store.owner_name && (store.owner_name || '').toLowerCase().includes((searchTerm || '').toLowerCase()));

    if (!matchesSearch) return false;

    // 2. Filtro abas rápidas
    const daysLeft = getDaysRemaining(store.vencimento);
    if (activeTab === 'paid') {
      return store.pago === true && !store.bloqueado;
    }
    if (activeTab === 'unpaid') {
      // Devedor: Não pago OU expirado (dias restantes <= 0)
      return store.pago === false || daysLeft <= 0;
    }
    if (activeTab === 'paused') {
      return store.pausado === true;
    }
    if (activeTab === 'blocked') {
      return store.bloqueado === true;
    }
    return true;
  }).sort((a, b) => {
    // 🔥 INTELIGÊNCIA EXIGIDA: "Quem tá mais perto de vencer aparece por primeiro na listagem!"
    const daysA = getDaysRemaining(a.vencimento);
    const daysB = getDaysRemaining(b.vencimento);
    return daysA - daysB; // Menor quantidade de dias (vence primeiro ou vencido) fica em cima.
  });

  // Cálculos Financeiros Dinâmicos baseados nas lojas ativas
  const totalFinancials = (() => {
    let activePaidCount = 0;
    let trialCount = 0;
    let registeredCount = stores.length;
    let incomingCommissionSum = 0;

    stores.forEach(s => {
      if (s.bloqueado) return;
      if (s.plano === 'gratis') {
        trialCount++;
      } else {
        activePaidCount++;
      }
      if (s.plano === 'indicacao') {
        incomingCommissionSum += Number(s.quanto_receber_indicacao || 0);
      }
    });

    // Faturamento Mensal Recorrente estimado (Normal: R$ 49.90, Indicação: R$ 69.90 como ex)
    const estimativeFaturamento = (activePaidCount * 49.90) - incomingCommissionSum;

    return {
      registeredCount,
      activePaidCount,
      trialCount,
      revenueEst: Math.max(0, estimativeFaturamento),
      commissionPaid: incomingCommissionSum
    };
  })();

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 text-zinc-900 relative overflow-hidden" id="master-login-root">
        {/* Dynamic decorative backdrop grids */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-60 pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-100/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-zinc-100/40 rounded-full blur-3xl pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full max-w-md bg-white border border-zinc-200/85 rounded-[32px] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.03)] space-y-7 relative z-10"
        >
          <div className="flex flex-col items-center space-y-3.5 text-center">
            <div className="bg-zinc-900 text-amber-400 p-3.5 rounded-2xl shadow-sm">
              <Crown className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-black font-sans tracking-tight text-zinc-900">PediFácil Master</h1>
              <p className="text-zinc-550 text-xs">Administrador Central • Central de Tecnologia</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-widest text-zinc-400 mb-1.5">E-mail de Acesso</label>
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Exemplo: joao@gmail.com"
                className="w-full bg-zinc-50 border border-zinc-250 rounded-2xl px-4 py-3.5 text-zinc-800 placeholder-zinc-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-zinc-900/5 focus:border-zinc-905 text-sm transition-all duration-200"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-widest text-zinc-400 mb-1.5">Senha Mestre</label>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-50 border border-zinc-250 rounded-2xl px-4 py-3.5 text-zinc-800 placeholder-zinc-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-zinc-900/5 focus:border-zinc-905 text-sm transition-all duration-200"
                required
              />
            </div>

            {loginError && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-rose-50 border border-rose-100 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-rose-600 font-medium"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </motion.div>
            )}

            <button 
              type="submit"
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-extrabold rounded-2xl py-4 text-sm transition-all active:scale-99 shadow-md shadow-zinc-900/10 cursor-pointer"
            >
              Acessar Painel Central
            </button>
          </form>

          <div className="text-center text-xs text-zinc-400 pt-2 border-t border-zinc-100">
            Acesso reservado. Tentativas de acessos indevidos são logadas.
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans flex flex-col" id="master-dashboard-root">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-zinc-900 text-white px-5 py-4 rounded-2xl shadow-2xl animate-bounce">
          {toast.type === 'success' && <CheckCircle2 className="text-green-555 w-5 h-5 shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="text-red-400 w-5 h-5 shrink-0" />}
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      {/* HEADER MASTER */}
      <header className="border-b border-zinc-200/80 bg-white/90 backdrop-blur px-6 py-4 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-zinc-900 text-amber-500 p-2.5 rounded-xl shadow-xs">
              <Crown className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-zinc-900">PediFácil Master</h1>
              <span className="text-zinc-500 text-xs">Suporte Técnico Central • {activeTab === 'all' ? 'Todas as Lojas' : 'Filtro Ativo'}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-zinc-100 px-4 py-2 border border-zinc-200 rounded-xl text-xs text-zinc-650">
              Logado como: <span className="text-zinc-900 font-bold">beleensematheus350@gmail.com</span>
            </div>
            <button 
              onClick={() => fetchStores()}
              className="bg-zinc-50 hover:bg-zinc-100 p-2.5 rounded-xl border border-zinc-200 text-zinc-650 hover:text-zinc-900 transition-colors shadow-xs cursor-pointer"
              title="Sincronizar"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button 
              onClick={handleLogout}
              className="bg-rose-50 hover:bg-rose-100 p-2.5 rounded-xl border border-rose-100 text-rose-600 hover:text-rose-700 transition-colors flex items-center gap-2 text-xs font-bold cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        
        {/* KEY PERFORMANCE CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6" id="kpi-panel">
          
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 space-y-2 relative overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.015)] hover:shadow-md transition-all group">
            <div className="absolute right-4 top-4 bg-emerald-50 text-emerald-600 p-2.5 rounded-xl group-hover:scale-110 transition-transform">
              <DollarSign className="w-5 h-5" />
            </div>
            <p className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider">Faturamento Estimado</p>
            <p className="text-3xl font-black tracking-tight text-zinc-900">R$ {(totalFinancials.revenueEst).toFixed(2)}</p>
            <p className="text-[10px] text-emerald-600 flex items-center gap-1 font-semibold">
              <Check className="w-3.5 h-3.5" /> Mensal estimado (líquido)
            </p>
          </div>

          <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 space-y-2 relative overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.015)] hover:shadow-md transition-all group">
            <div className="absolute right-4 top-4 bg-sky-50 text-sky-600 p-2.5 rounded-xl group-hover:scale-110 transition-transform">
              <Globe className="w-5 h-5" />
            </div>
            <p className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider">Total de Lojas</p>
            <p className="text-3xl font-black tracking-tight text-zinc-900">{totalFinancials.registeredCount}</p>
            <p className="text-[10px] text-zinc-500 font-semibold flex items-center gap-1">
              {totalFinancials.activePaidCount} Planos ativos cadastrados
            </p>
          </div>

          <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 space-y-2 relative overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.015)] hover:shadow-md transition-all group">
            <div className="absolute right-4 top-4 bg-amber-50 text-amber-600 p-2.5 rounded-xl group-hover:scale-110 transition-transform">
              <Tag className="w-5 h-5" />
            </div>
            <p className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider">Lojas em Teste / Grátis</p>
            <p className="text-3xl font-black tracking-tight text-zinc-900">{totalFinancials.trialCount}</p>
            <p className="text-[10px] text-amber-600 font-semibold flex items-center gap-1">
              Planos gratuitos ou de teste ativos
            </p>
          </div>

          <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 space-y-2 relative overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.015)] hover:shadow-md transition-all group">
            <div className="absolute right-4 top-4 bg-purple-50 text-purple-600 p-2.5 rounded-xl group-hover:scale-110 transition-transform">
              <Briefcase className="w-5 h-5" />
            </div>
            <p className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider">Comissões a Pagar</p>
            <p className="text-3xl font-black tracking-tight text-purple-600">R$ {totalFinancials.commissionPaid.toFixed(2)}</p>
            <p className="text-[10px] text-zinc-500 font-semibold">
              Valor de comissionamentos para parceiros
            </p>
          </div>

        </div>

        {/* CONTROLS SECTION */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-white p-4 border border-zinc-200/80 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
          
          {/* SEARCH INPUT */}
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3.5 top-3 text-zinc-400 w-4.5 h-4.5" />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar loja por nome, link ou proprietário..."
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-800 placeholder-zinc-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all duration-200"
            />
          </div>

          {/* STATUS TABS */}
          <div className="flex flex-wrap items-center gap-1 bg-zinc-100 p-1 rounded-xl w-full lg:w-auto">
            <button 
              onClick={() => setActiveTab('all')}
              className={`flex-1 lg:flex-none px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${activeTab === 'all' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900Item'}`}
            >
              Todos
            </button>
            <button 
              onClick={() => setActiveTab('paid')}
              className={`flex-1 lg:flex-none px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${activeTab === 'paid' ? 'bg-emerald-600 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900Item'}`}
            >
              Pagantes
            </button>
            <button 
              onClick={() => setActiveTab('unpaid')}
              className={`flex-1 lg:flex-none px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${activeTab === 'unpaid' ? 'bg-rose-600 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900Item'}`}
            >
              Expirados
            </button>
            <button 
              onClick={() => setActiveTab('paused')}
              className={`flex-1 lg:flex-none px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${activeTab === 'paused' ? 'bg-amber-500 text-black shadow-sm' : 'text-zinc-500 hover:text-zinc-900Item'}`}
            >
              Pausados
            </button>
            <button 
              onClick={() => setActiveTab('blocked')}
              className={`flex-1 lg:flex-none px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${activeTab === 'blocked' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-905'}`}
            >
              Bloqueados
            </button>
          </div>

          {/* ADD STORE ACTION BUTTON */}
          <button 
            onClick={handleOpenCreateModal}
            className="w-full lg:w-auto bg-zinc-900 hover:bg-zinc-800 text-white font-extrabold rounded-xl px-6 py-2.5 text-sm flex items-center justify-center gap-2 shadow-md shadow-zinc-900/10 active:scale-98 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3px]" />
            Criar Loja
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <RefreshCw className="w-10 h-10 text-zinc-900 animate-spin" />
            <p className="text-zinc-550 text-sm font-semibold">Sincronizando com a base de dados inteligente...</p>
          </div>
        ) : filteredStores.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-[32px] py-16 px-6 text-center space-y-4 shadow-[0_4px_30px_rgba(0,0,0,0.012)]">
            <AlertCircle className="w-12 h-12 text-zinc-400 mx-auto" />
            <h2 className="text-xl font-bold text-zinc-800">Nenhuma loja encontrada</h2>
            <p className="text-zinc-500 text-sm max-w-sm mx-auto">
              Crie uma nova loja com o botão "Criar Loja" ou altere seus filtros de busca para prosseguir.
            </p>
          </div>
        ) : (
          /* STORES LIST OR CARDS */
          <div className="grid grid-cols-1 gap-6" id="stores-matrix">
            {filteredStores.map(store => {
              const daysRemaining = getDaysRemaining(store.vencimento);
              const isTrial = store.plano === 'gratis';
              const isOverdue = daysRemaining <= 0;
              const isLocked = store.bloqueado;
              const isPaused = store.pausado;

              let statusBadgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-250';
              let statusText = 'Em dia';

              if (isLocked) {
                statusBadgeBg = 'bg-rose-50 text-rose-700 border-rose-250';
                statusText = 'Bloqueado';
              } else if (isPaused) {
                statusBadgeBg = 'bg-sky-50 text-sky-700 border-sky-250';
                statusText = 'Pausado';
              } else if (isOverdue) {
                statusBadgeBg = 'bg-rose-50 text-rose-700 border-rose-250';
                statusText = 'Expirado / Vencido';
              } else if (daysRemaining <= 5) {
                statusBadgeBg = 'bg-amber-50 text-amber-700 border-amber-250';
                statusText = 'Prestes a Vencer';
              }

              return (
                <div 
                  key={store.id} 
                  className={`bg-white border rounded-[24px] p-6 hover:shadow-[0_12px_40px_rgba(0,0,0,0.03)] hover:border-zinc-300 transition-all relative overflow-hidden flex flex-col md:flex-row justify-between gap-6 ${isOverdue ? 'border-rose-200' : 'border-zinc-200/80 shadow-[0_4px_30px_rgba(0,0,0,0.015)]'}`}
                >
                  {/* Decorative Left Alert on Expiry */}
                  {daysRemaining <= 5 && !isLocked && !isPaused && (
                    <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${isOverdue ? 'bg-rose-500' : 'bg-amber-500'}`} />
                  )}

                  {/* left: Store Core details */}
                  <div className="flex flex-col md:flex-row gap-5 items-start flex-1 cursor-pointer" onClick={() => fetchStoreDetails(store)}>
                    <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 text-amber-400 font-black flex items-center justify-center text-xl shrink-0 uppercase shadow-md shadow-zinc-900/5">
                      {(store.nome || '').substring(0, 2)}
                    </div>

                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-extrabold text-lg text-zinc-900 hover:text-amber-550 transition-colors">{store.nome}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${statusBadgeBg}`}>
                          {statusText}
                        </span>
                        {store.plano === 'indicacao' && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] bg-purple-50 text-purple-700 border border-purple-200 font-extrabold uppercase">
                            Indicação
                          </span>
                        )}
                        {isTrial && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] bg-sky-50 text-sky-700 border border-sky-200 font-extrabold uppercase">
                            Teste Grátis
                          </span>
                        )}
                      </div>

                      <p className="text-zinc-500 text-xs flex items-center gap-2">
                        <Briefcase className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Nicho: <strong className="text-zinc-800">{store.nicho === 'hamburgueria' ? '🍔 Hamburgueria' : '🍽️ Outros restaurantes / negócios'}</strong></span>
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 pt-1.5 text-zinc-650 text-xs">
                        <p>Dono: <strong className="text-zinc-900 font-semibold">{store.owner_name}</strong></p>
                        <p>E-mail: <strong className="text-zinc-900 font-semibold">{store.owner_email}</strong></p>
                        <p>WhatsApp: <strong className="text-zinc-900 font-semibold">{store.whatsapp || 'Não inserido'}</strong></p>
                        <p>Acesso: <strong className="text-zinc-800 font-mono select-all bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">{store.owner_password}</strong></p>
                      </div>

                      {store.plano === 'indicacao' && (
                        <div className="mt-2 text-[11px] bg-purple-50 p-2.5 rounded-xl border border-purple-100 text-purple-950 font-medium leading-relaxed">
                          Recomendado por: <strong className="text-purple-900">{store.quem_indicou}</strong> (WhatsApp: {store.whatsapp_indicou}) • Retorno Parceiro: <strong className="text-purple-700 font-bold">R$ {Number(store.quanto_receber_indicacao).toFixed(2)}</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Expiration and Admin Quick Controls */}
                  <div className="flex flex-col justify-between items-start md:items-end gap-4 shrink-0">
                    <div className="text-left md:text-right space-y-1">
                      <p className="text-zinc-500 text-xs flex items-center md:justify-end gap-1.5">
                        <span>Vencimento:</span>
                        <strong className="text-zinc-800 font-semibold">{store.vencimento && !isNaN(new Date(store.vencimento).getTime()) ? new Date(store.vencimento).toLocaleDateString('pt-BR') : 'Não fornecido'}</strong>
                      </p>
                      <p className={`text-xs font-bold flex items-center md:justify-end gap-1 ${isOverdue ? 'text-rose-600' : 'text-zinc-700'}`}>
                        {isOverdue ? (
                          <>🔴 Expirado há {Math.abs(daysRemaining)} dias</>
                        ) : daysRemaining <= 5 ? (
                          <>🟡 Expira em {daysRemaining} dias!</>
                        ) : (
                          <>🟢 {daysRemaining} dias restantes</>
                        )}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 pb-1">
                      {/* View details button */}
                      <button 
                        onClick={() => fetchStoreDetails(store)}
                        className="bg-zinc-100 hover:bg-zinc-200 p-2.5 rounded-xl border border-zinc-200/80 text-zinc-700 font-bold hover:text-zinc-900 transition-all text-xs flex items-center gap-1.5 cursor-pointer"
                        title="Ver estatísticas detalhadas"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Ver Loja
                      </button>

                      {/* Pause / Resume */}
                      <button 
                        onClick={() => handleTogglePause(store)}
                        className={`p-2.5 rounded-xl border text-xs flex items-center gap-1 transition-all cursor-pointer ${isPaused ? 'bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100' : 'bg-zinc-50 border-zinc-200 text-zinc-650 hover:bg-zinc-100'}`}
                        title={isPaused ? 'Retomar Loja' : 'Pausar Loja'}
                      >
                        {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                      </button>

                      {/* Block / Unblock */}
                      <button 
                        onClick={() => handleToggleBlock(store)}
                        className={`p-2.5 rounded-xl border text-xs flex items-center gap-1 transition-all cursor-pointer ${isLocked ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100' : 'bg-zinc-50 border-zinc-200 text-zinc-650 hover:text-rose-600 hover:bg-zinc-100'}`}
                        title={isLocked ? 'Desbloquear' : 'Bloquear Loja'}
                      >
                        {isLocked ? <Check className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                      </button>

                      {/* Edit */}
                      <button 
                        onClick={() => handleOpenEditModal(store)}
                        className="bg-zinc-50 hover:bg-zinc-100 p-2.5 rounded-xl border border-zinc-200 text-zinc-650 hover:text-zinc-900 transition-all cursor-pointer"
                        title="Editar Registro"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button 
                        onClick={() => handleDeleteStore(store.id, store.slug)}
                        className="bg-rose-50 hover:bg-rose-100 p-2.5 rounded-xl border border-rose-200 text-rose-600 hover:text-rose-700 transition-all cursor-pointer"
                        title="Excluir Loja"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Previews Direct Links */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-bold">
                      <a 
                        href={`${window.location.origin}/#${getNormalizedSlug(store)}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-amber-600 hover:text-amber-700 hover:underline flex items-center gap-1"
                      >
                        <Globe className="w-3.5 h-3.5" /> Cardápio Público
                        <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                      </a>
                      <span className="text-zinc-300">•</span>
                      <button 
                        onClick={() => {
                          const targetSlug = getNormalizedSlug(store);
                          const loginSession = {
                            id: store.id,
                            nome: store.nome || store.name,
                            slug: targetSlug,
                            owner_email: store.owner_email,
                            owner_password: store.owner_password
                          };
                          const sessionKey = `pedifacil_store_admin_logged_in_${targetSlug}`;
                          localStorage.setItem(sessionKey, JSON.stringify(loginSession));
                          localStorage.setItem('pedifacil_store_admin_logged_in', JSON.stringify(loginSession));
                          window.open(`${window.location.origin}/#admin/${encodeURIComponent(targetSlug)}`, '_blank');
                          showToast(`Abrindo Painel do Lojista para ${store.nome || store.name || 'sua loja'}! 🚀`, 'success');
                        }}
                        className="text-sky-600 hover:text-sky-700 hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-none p-0 font-bold"
                      >
                        <Shield className="w-3.5 h-3.5" /> Painel Lojista
                        <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* FOOTER GENERAL */}
      <footer className="border-t border-zinc-200/80 py-8 text-center text-zinc-400 text-xs bg-white font-medium">
        <p>PediFácil Geral • Administrador Central Mestre v2.5 • Criado e Configurado com Segurança Inteligente</p>
      </footer>

      {/* CREATE / EDIT STORE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white border border-zinc-200 rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col my-8 max-h-[90vh]"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-zinc-150 bg-zinc-50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500 stroke-[2.5px]" />
                <h2 className="text-lg font-black text-zinc-900">{editingStoreId ? 'Editar Detalhes do Restaurante' : 'Cadastrar Novo Lojista'}</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-900 p-1.5 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Content */}
            <form onSubmit={handleSaveStore} className="p-6 overflow-y-auto flex-1 space-y-6">
              
              <div className="bg-zinc-50 p-5 border border-zinc-150 rounded-[24px] space-y-4">
                <h3 className="text-xs font-black text-amber-600 uppercase tracking-wider">Passo 1. Dados Pessoais do Proprietário</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-655 mb-1.5 uppercase tracking-wider">Nome Completo do Dono *</label>
                    <input 
                      type="text"
                      value={formOwnerName}
                      onChange={(e) => setFormOwnerName(e.target.value)}
                      placeholder="Ex: João da Silva"
                      className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2.5 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/5 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-655 mb-1.5 uppercase tracking-wider">WhatsApp de Contato (Com DDD) *</label>
                    <input 
                      type="text"
                      value={formWhatsApp}
                      onChange={(e) => setFormWhatsApp(e.target.value)}
                      placeholder="Ex: 86994112233"
                      className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2.5 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/5 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-655 mb-1.5 uppercase tracking-wider">E-mail de Login do Usuário *</label>
                    <input 
                      type="email"
                      value={formOwnerEmail}
                      onChange={(e) => setFormOwnerEmail(e.target.value)}
                      placeholder="Ex: joao@loja.com"
                      className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2.5 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/5 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-655 mb-1.5 uppercase tracking-wider">Senha de Login Provisória *</label>
                    <input 
                      type="text"
                      value={formOwnerPassword}
                      onChange={(e) => setFormOwnerPassword(e.target.value)}
                      placeholder="Senha do lojista para painel"
                      className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2.5 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/5 transition-all font-mono"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Store details */}
              <div className="bg-zinc-50 p-5 border border-zinc-150 rounded-[24px] space-y-4">
                <h3 className="text-xs font-black text-sky-600 uppercase tracking-wider">Passo 2. Identidade da Loja no Sistema</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-655 mb-1.5 uppercase tracking-wider">Nome Fantasia do Estabelecimento *</label>
                    <input 
                      type="text"
                      value={formStoreName}
                      onChange={(e) => setFormStoreName(e.target.value)}
                      placeholder="Ex: Hambúrguer do Chefe"
                      className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2.5 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/5 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-655 mb-1.5 uppercase tracking-wider">Nicho / Especialidade *</label>
                    <select 
                      value={formNiche}
                      onChange={(e) => setFormNiche(e.target.value)}
                      className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2.5 text-sm text-zinc-800 focus:outline-none focus:border-zinc-905 transition-all"
                    >
                      <option value="hamburgueria">🍔 Hamburgueria</option>
                      <option value="pizza">🍕 Pizzaria</option>
                      <option value="barbearia">💈 Barbearia</option>
                      <option value="outro">🍽️ Outro Restaurante / Negócio</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-655 mb-1.5 uppercase tracking-wider">Slug do Link de Endereço (URL amigável)</label>
                  <div className="flex items-center gap-1.5 bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-800 focus-within:border-zinc-900 transition-all">
                    <span className="text-zinc-400 font-bold">pedifacil.com/#</span>
                    <input 
                      type="text"
                      value={formSlug}
                      onChange={(e) => setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholder="hamburgueria-do-chefe"
                      className="bg-transparent text-zinc-800 border-none p-0 focus:outline-none font-extrabold flex-1 text-xs"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-zinc-405 mt-1">Este será o endereço único do cardápio digital do cliente.</p>
                </div>
              </div>

              {/* Plan Options */}
              <div className="bg-zinc-50 p-5 border border-zinc-150 rounded-[24px] space-y-4">
                <h3 className="text-xs font-black text-purple-600 uppercase tracking-wider">Passo 3. Plano Comercial e Valores</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-655 mb-1.5 uppercase tracking-wider">Selecione o Plano Comercial de Assinatura</label>
                    <select 
                      value={formPlan}
                      onChange={(e) => setFormPlan(e.target.value as any)}
                      className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2.5 text-sm text-zinc-800 focus:outline-none focus:border-zinc-905 transition-all"
                    >
                      <option value="gratis">🆓 Teste Grátis de {formTrialDays} Dias</option>
                      <option value="normal">💳 Plano Mensal Normal (Recorrente)</option>
                      <option value="indicacao">🤝 Indicação Premiada (Parceiro)</option>
                    </select>
                  </div>

                  {formPlan === 'gratis' && (
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-655 mb-1.5 uppercase tracking-wider">Duração do Período de Teste (Em Dias)</label>
                      <input 
                        type="number"
                        min="1"
                        max="30"
                        value={formTrialDays}
                        onChange={(e) => setFormTrialDays(Number(e.target.value))}
                        className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2.5 text-sm text-zinc-800 focus:outline-none focus:border-zinc-900 transition-all"
                      />
                    </div>
                  )}
                </div>

                {/* Sub-inputs if 'Indicação' */}
                {formPlan === 'indicacao' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-4 bg-purple-50/50 border border-purple-200 rounded-2xl space-y-3 pt-4"
                  >
                    <p className="text-purple-700 text-xs font-extrabold flex items-center gap-1.5">Configurações de Indicação do Afiliado:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-purple-950 mb-1">Quem indicou? (Nome)</label>
                        <input 
                          type="text"
                          value={formReferrerName}
                          onChange={(e) => setFormReferrerName(e.target.value)}
                          placeholder="Ex: Carlinhos"
                          className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-2 text-xs text-zinc-800"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-purple-950 mb-1">WhatsApp do Afiliado</label>
                        <input 
                          type="text"
                          value={formReferrerWhatsApp}
                          onChange={(e) => setFormReferrerWhatsApp(e.target.value)}
                          placeholder="Ex: 8699112233"
                          className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-2 text-xs text-zinc-800"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-purple-950 mb-1">Comissão (R$)</label>
                        <input 
                          type="number"
                          value={formReferrerCommission}
                          onChange={(e) => setFormReferrerCommission(Number(e.target.value))}
                          placeholder="Ex: 40.00"
                          className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-2 text-xs text-zinc-800"
                          required
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Status and Configuration switches */}
              <div className="bg-zinc-50 p-5 border border-zinc-150 rounded-[24px]">
                <h3 className="text-xs font-black text-emerald-600 uppercase tracking-wider mb-4">Passo 4. Status de Acesso Geral</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <label className="flex items-center gap-3 bg-white border border-zinc-200 p-3.5 rounded-2xl cursor-pointer hover:border-zinc-300 transition-all">
                    <input 
                      type="checkbox"
                      checked={formPaid}
                      onChange={(e) => setFormPaid(e.target.checked)}
                      className="rounded border-zinc-300 text-zinc-900 bg-zinc-50 focus:ring-0 w-4 h-4 accent-zinc-900"
                    />
                    <div className="text-xs">
                      <p className="font-extrabold text-zinc-800">Mensalidade Paga?</p>
                      <p className="text-[10px] text-zinc-400">Ativa o status pago</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 bg-white border border-zinc-200 p-3.5 rounded-2xl cursor-pointer hover:border-zinc-300 transition-all">
                    <input 
                      type="checkbox"
                      checked={formPaused}
                      onChange={(e) => setFormPaused(e.target.checked)}
                      className="rounded border-zinc-300 text-zinc-900 bg-zinc-50 focus:ring-0 w-4 h-4 accent-zinc-900"
                    />
                    <div className="text-xs">
                      <p className="font-extrabold text-zinc-800">Pausado?</p>
                      <p className="text-[10px] text-zinc-400">Pausa as atividades</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 bg-white border border-zinc-200 p-3.5 rounded-2xl cursor-pointer hover:border-rose-300 transition-all">
                    <input 
                      type="checkbox"
                      checked={formBlocked}
                      onChange={(e) => setFormBlocked(e.target.checked)}
                      className="rounded border-zinc-300 text-rose-600 bg-zinc-50 focus:ring-0 w-4 h-4 accent-rose-600"
                    />
                    <div className="text-xs">
                      <p className="font-extrabold text-rose-600">Bloqueado?</p>
                      <p className="text-[10px] text-zinc-400">Suspende o Cardápio</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Save Panel Button */}
              <div className="pt-4 border-t border-zinc-150 flex justify-end gap-3 bg-zinc-50/80 -mx-6 -mb-6 p-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 font-bold px-5 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="bg-zinc-900 hover:bg-zinc-850 text-white font-black px-6 py-2.5 rounded-xl text-xs shadow-md shadow-zinc-900/10 active:scale-98 transition-all cursor-pointer"
                >
                  {editingStoreId ? 'Salvar Edições' : 'Criar Conta Lojista'}
                </button>
              </div>

            </form>
          </motion.div>
        </div>
      )}

      {/* DETAIL STATISTICS VIEW MODAL */}
      {isDetailModalOpen && selectedStoreDetail && (
        <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white border border-zinc-200 p-7 rounded-[32px] w-full max-w-lg shadow-2xl relative"
          >
            <button 
              onClick={() => setIsDetailModalOpen(false)} 
              className="absolute right-5 top-5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 p-1.5 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-6">
              <div className="flex items-center gap-4.5">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 text-amber-400 font-extrabold flex items-center justify-center uppercase shadow-md shadow-zinc-900/10 shrink-0">
                  {(selectedStoreDetail.nome || '').substring(0, 2)}
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-zinc-900 leading-tight">{selectedStoreDetail.nome}</h3>
                  <a 
                    href={`#${selectedStoreDetail.slug}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-amber-600 hover:text-amber-700 hover:underline text-xs flex items-center gap-1 mt-1 font-bold"
                  >
                    /{selectedStoreDetail.slug} <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>

              <div className="border-t border-b border-zinc-100 py-4 grid grid-cols-2 gap-3.5">
                <div className="bg-zinc-50 p-3.5 rounded-2xl border border-zinc-150 shadow-[0_2px_10px_rgba(0,0,0,0.01)]">
                  <span className="text-[10px] text-zinc-400 block font-bold uppercase tracking-wider">Total de Pedidos</span>
                  <span className="text-2xl font-black tracking-tight text-zinc-900 mt-1 block">
                    {storeDetailStats.totalOrders}
                  </span>
                </div>

                <div className="bg-zinc-50 p-3.5 rounded-2xl border border-zinc-150 shadow-[0_2px_10px_rgba(0,0,0,0.01)]">
                  <span className="text-[10px] text-zinc-400 block font-bold uppercase tracking-wider">Faturamento Loja</span>
                  <span className="text-2xl font-black tracking-tight text-emerald-600 mt-1 block">
                    R$ {storeDetailStats.totalRevenue.toFixed(2)}
                  </span>
                </div>

                <div className="bg-zinc-50 p-3.5 rounded-2xl border border-zinc-150 shadow-[0_2px_10px_rgba(0,0,0,0.01)]">
                  <span className="text-[10px] text-zinc-400 block font-bold uppercase tracking-wider">Produtos</span>
                  <span className="text-2xl font-black tracking-tight text-zinc-900 mt-1 block">
                    {storeDetailStats.productCount}
                  </span>
                </div>

                <div className="bg-zinc-50 p-3.5 rounded-2xl border border-zinc-150 shadow-[0_2px_10px_rgba(0,0,0,0.01)]">
                  <span className="text-[10px] text-zinc-400 block font-bold uppercase tracking-wider">Status Plano</span>
                  <span className="text-[11px] font-black text-amber-600 mt-2 block uppercase tracking-wide">
                    {selectedStoreDetail.plano === 'gratis' ? 'Teste Grátis' : selectedStoreDetail.plano === 'normal' ? 'Assinatura Normal' : 'Referenciado'}
                  </span>
                </div>
              </div>

              {/* Recent Orders List */}
              <div className="space-y-3.5">
                <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-sky-600" /> Últimos Pedidos Recebidos
                </h4>
                {storeDetailStats.recentOrders.length === 0 ? (
                  <p className="text-xs text-zinc-400 italic py-3 text-center bg-zinc-50 rounded-2xl border border-zinc-150">Nenhum pedido recebido ainda por este restaurante.</p>
                ) : (
                  <div className="space-y-2 bg-zinc-50 p-3 border border-zinc-150 rounded-2xl max-h-48 overflow-y-auto">
                    {storeDetailStats.recentOrders.map((o: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-xs py-2 border-b border-zinc-100 last:border-0 last:pb-0">
                        <div>
                          <p className="font-extrabold text-zinc-800">#{(o.id || '').substring(0, 5)} - {o.cliente_nome}</p>
                          <p className="text-[10px] text-zinc-500 font-medium">{o.created_at && !isNaN(new Date(o.created_at).getTime()) ? new Date(o.created_at).toLocaleDateString() : ''} {o.created_at && !isNaN(new Date(o.created_at).getTime()) ? new Date(o.created_at).toLocaleTimeString().substring(0, 5) : ''}</p>
                        </div>
                        <span className="font-black text-emerald-600">R$ {Number(o.total || 0).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 flex gap-2.5">
                <a 
                  href={`#admin`} 
                  onClick={() => localStorage.setItem('pedifacil_store_admin_logged_in', JSON.stringify({
                    id: selectedStoreDetail.id,
                    nome: selectedStoreDetail.nome,
                    slug: selectedStoreDetail.slug,
                    owner_email: selectedStoreDetail.owner_email,
                    owner_password: selectedStoreDetail.owner_password,
                  }))}
                  className="bg-zinc-900 hover:bg-zinc-850 text-white text-center font-black py-3 px-4 rounded-xl text-xs flex-1 transition-transform active:scale-95 shadow-md shadow-zinc-900/10 cursor-pointer"
                >
                  Entrar no Painel do Lojista
                </a>
                <button 
                  onClick={() => setIsDetailModalOpen(false)}
                  className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold py-3 px-5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
