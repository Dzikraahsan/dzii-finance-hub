import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useWallets() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['wallets', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('wallets').select('*').order('created_at');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCategories() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['categories', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*').order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useTransactions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('transactions').select('*').order('date', { ascending: false }).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useBudgets() {
  const { user } = useAuth();
  const currentMonth = new Date().toISOString().slice(0, 7);
  return useQuery({
    queryKey: ['budgets', user?.id, currentMonth],
    queryFn: async () => {
      const { data, error } = await supabase.from('budgets').select('*').eq('month', currentMonth);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useAddTransaction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (txn: {
      wallet_id: string;
      category_id: string | null;
      amount: number;
      type: 'income' | 'expense' | 'transfer';
      note?: string;
      date?: string;
      to_wallet_id?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Insert transaction
      const { error: txnError } = await supabase.from('transactions').insert({
        user_id: user.id,
        wallet_id: txn.wallet_id,
        category_id: txn.category_id,
        amount: txn.amount,
        type: txn.type,
        note: txn.note || null,
        date: txn.date || new Date().toISOString().split('T')[0],
        to_wallet_id: txn.to_wallet_id || null,
      });
      if (txnError) throw txnError;

      // Update wallet balance
      if (txn.type === 'income') {
        const { data: wallet } = await supabase.from('wallets').select('balance').eq('id', txn.wallet_id).single();
        if (wallet) {
          await supabase.from('wallets').update({ balance: Number(wallet.balance) + txn.amount }).eq('id', txn.wallet_id);
        }
      } else if (txn.type === 'expense') {
        const { data: wallet } = await supabase.from('wallets').select('balance').eq('id', txn.wallet_id).single();
        if (wallet) {
          await supabase.from('wallets').update({ balance: Number(wallet.balance) - txn.amount }).eq('id', txn.wallet_id);
        }
      } else if (txn.type === 'transfer' && txn.to_wallet_id) {
        const { data: fromWallet } = await supabase.from('wallets').select('balance').eq('id', txn.wallet_id).single();
        const { data: toWallet } = await supabase.from('wallets').select('balance').eq('id', txn.to_wallet_id).single();
        if (fromWallet) {
          await supabase.from('wallets').update({ balance: Number(fromWallet.balance) - txn.amount }).eq('id', txn.wallet_id);
        }
        if (toWallet) {
          await supabase.from('wallets').update({ balance: Number(toWallet.balance) + txn.amount }).eq('id', txn.to_wallet_id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}

export function useAddWallet() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (wallet: { name: string; type: string; balance: number; icon: string; color: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('wallets').insert({ ...wallet, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wallets'] }),
  });
}

export function useAddBudget() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (budget: { category_id: string; amount: number; month: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('budgets').upsert(
        { ...budget, user_id: user.id },
        { onConflict: 'user_id,category_id,month' }
      );
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['budgets'] }),
  });
}
