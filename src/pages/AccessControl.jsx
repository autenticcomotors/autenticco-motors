// src/pages/AccessControl.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import {
  Shield,
  UserPlus,
  UserCircle,
  Users,
  KeyRound,
  Check,
  X,
  RefreshCw,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';

const AccessControl = () => {
  // =========================
  // STATES BASE
  // =========================
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]); // app_users
  const [usersPerms, setUsersPerms] = useState([]); // vw_app_user_permissions
  const [roles, setRoles] = useState([]); // app_roles
  const [permissions, setPermissions] = useState([]); // app_permissions
  const [rolePermissions, setRolePermissions] = useState([]); // app_role_permissions
  const [selectedUser, setSelectedUser] = useState(null);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    full_name: '',
    phone: '',
    is_active: true,
  });

  const [selectedRole, setSelectedRole] = useState(null);
  const [isRolePermDialogOpen, setIsRolePermDialogOpen] = useState(false);

  const [userSearch, setUserSearch] = useState('');

  // =========================
  // FETCH
  // =========================
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [uRes, vwRes, rRes, pRes, rpRes] = await Promise.all([
        supabase.from('app_users').select('*').order('created_at', { ascending: false }),
        supabase.from('vw_app_user_permissions').select('*'),
        supabase.from('app_roles').select('*').order('name', { ascending: true }),
        supabase.from('app_permissions').select('*').order('group_name', { ascending: true }),
        supabase.from('app_role_permissions').select('*'),
      ]);

      if (uRes.error) console.error('Erro app_users:', uRes.error);
      if (vwRes.error) console.error('Erro vw_app_user_permissions:', vwRes.error);
      if (rRes.error) console.error('Erro app_roles:', rRes.error);
      if (pRes.error) console.error('Erro app_permissions:', pRes.error);
      if (rpRes.error) console.error('Erro app_role_permissions:', rpRes.error);

      setUsers(uRes.data || []);
      setUsersPerms(vwRes.data || []);
      setRoles(rRes.data || []);
      setPermissions(pRes.data || []);
      setRolePermissions(rpRes.data || []);
    } catch (err) {
      console.error('Erro geral fetchAll:', err);
      toast({
        title: 'Erro ao carregar acessos',
        description: String(err),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // =========================
  // HELPERS
  // =========================

  const usersWithRoles = useMemo(() => {
    if (!users || !usersPerms) return [];
    return users.map((u) => {
      const match = usersPerms.find((vv) => vv.user_id === u.id);
      return {
        ...u,
        roles: match?.roles || [],
        permissions: match?.permissions || [],
      };
    });
  }, [users, usersPerms]);

  const filteredUsers = useMemo(() => {
    const term = userSearch.trim().toLowerCase();
    if (!term) return usersWithRoles;
    return usersWithRoles.filter((u) => {
      const s1 = (u.full_name || '').toLowerCase();
      const s2 = (u.email || '').toLowerCase();
      const s3 = (u.phone || '').toLowerCase();
      return s1.includes(term) || s2.includes(term) || s3.includes(term);
    });
  }, [userSearch, usersWithRoles]);

  const permissionsByGroup = useMemo(() => {
    const map = {};
    (permissions || []).forEach((p) => {
      const g = p.group_name || 'Outros';
      if (!map[g]) map[g] = [];
      map[g].push(p);
    });
    return map;
  }, [permissions]);

  const roleHasPermission = (roleId, permCode) => {
    return rolePermissions.some(
      (rp) => rp.role_id === roleId && rp.permission_code === permCode
    );
  };

  // =========================
  // ACTIONS: USERS
  // =========================
  const openCreateUser = () => {
    setNewUser({
      email: '',
      full_name: '',
      phone: '',
      is_active: true,
    });
    setIsUserDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!newUser.email) {
      toast({ title: 'Informe o e-mail', variant: 'destructive' });
      return;
    }
    try {
      const payload = {
        email: newUser.email,
        full_name: newUser.full_name || null,
        phone: newUser.phone || null,
        is_active: newUser.is_active,
      };
      const { data, error } = await supabase.from('app_users').insert([payload]).select().single();
      if (error) {
        console.error('Erro ao criar usuário:', error);
        toast({
          title: 'Erro ao criar usuário',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }
      toast({ title: 'Usuário criado!' });
      setIsUserDialogOpen(false);
      setSelectedUser(data);
      await fetchAll();
    } catch (err) {
      console.error('Erro geral ao criar usuário:', err);
      toast({
        title: 'Erro ao criar usuário',
        description: String(err),
        variant: 'destructive',
      });
    }
  };

  const toggleUserActive = async (user) => {
    try {
      const { error } = await supabase
        .from('app_users')
        .update({ is_active: !user.is_active, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (error) {
        toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
        return;
      }
      toast({ title: 'Atualizado!' });
      fetchAll();
    } catch (err) {
      toast({ title: 'Erro ao atualizar', description: String(err), variant: 'destructive' });
    }
  };

  const openUserRoles = (user) => {
    setSelectedUser(user);
  };

  const handleAssignRoleToUser = async (roleId) => {
    if (!selectedUser) return;
    try {
      const { error } = await supabase
        .from('app_user_roles')
        .upsert(
          [
            {
              user_id: selectedUser.id,
              role_id: roleId,
            },
          ],
          {
            onConflict: 'user_id,role_id',
          }
        );
      if (error) {
        toast({ title: 'Erro ao vincular papel', description: error.message, variant: 'destructive' });
        return;
      }
      toast({ title: 'Papel vinculado!' });
      await fetchAll();
      // reabrir user atualizado
      const updated = usersWithRoles.find((u) => u.id === selectedUser.id);
      setSelectedUser(updated || null);
    } catch (err) {
      toast({ title: 'Erro ao vincular papel', description: String(err), variant: 'destructive' });
    }
  };

  const handleRemoveRoleFromUser = async (roleId) => {
    if (!selectedUser) return;
    try {
      const { error } = await supabase
        .from('app_user_roles')
        .delete()
        .eq('user_id', selectedUser.id)
        .eq('role_id', roleId);
      if (error) {
        toast({ title: 'Erro ao remover papel', description: error.message, variant: 'destructive' });
        return;
      }
      toast({ title: 'Papel removido!' });
      await fetchAll();
      const updated = usersWithRoles.find((u) => u.id === selectedUser.id);
      setSelectedUser(updated || null);
    } catch (err) {
      toast({ title: 'Erro ao remover papel', description: String(err), variant: 'destructive' });
    }
  };

  // =========================
  // ACTIONS: ROLES x PERMISSIONS
  // =========================
  const openRolePerms = (role) => {
    setSelectedRole(role);
    setIsRolePermDialogOpen(true);
  };

  const togglePermissionForRole = async (permCode) => {
    if (!selectedRole) return;
    const has = roleHasPermission(selectedRole.id, permCode);
    try {
      if (has) {
        const { error } = await supabase
          .from('app_role_permissions')
          .delete()
          .eq('role_id', selectedRole.id)
          .eq('permission_code', permCode);
        if (error) {
          toast({ title: 'Erro ao remover permissão', description: error.message, variant: 'destructive' });
          return;
        }
      } else {
        const { error } = await supabase
          .from('app_role_permissions')
          .insert([{ role_id: selectedRole.id, permission_code: permCode }]);
        if (error) {
          toast({ title: 'Erro ao adicionar permissão', description: error.message, variant: 'destructive' });
          return;
        }
      }
      await fetchAll();
      toast({ title: 'Permissões atualizadas!' });
    } catch (err) {
      toast({ title: 'Erro ao atualizar permissão', description: String(err), variant: 'destructive' });
    }
  };

  // =========================
  // UI
  // =========================
  if (loading) {
    return (
      <div className="min-h-screen pt-28 bg-gray-50 flex items-center justify-center">
        <div className="text-yellow-500 text-lg animate-pulse flex items-center gap-2">
          <Shield className="w-5 h-5" /> Carregando controle de acesso...
        </div>
      </div>
    );
  }

  return (
    <div className="relative isolate min-h-screen bg-gray-50 text-gray-800 pt-28 pb-8">
      <Helmet>
        <title>Gestão de Acessos - AutenTicco Motors</title>
      </Helmet>

      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Shield className="text-yellow-500" /> Gestão de Acessos
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Controle de usuários, papéis e permissões da área administrativa.
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={openCreateUser} className="bg-yellow-400 text-black hover:bg-yellow-500">
              <UserPlus className="w-4 h-4 mr-2" />
              Novo usuário
            </Button>
            <Button variant="outline" onClick={fetchAll}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>

        {/* TOPO: CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border shadow-sm p-5 flex items-center gap-4"
          >
            <div className="p-3 bg-yellow-100 rounded-xl text-yellow-600">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Usuários</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border shadow-sm p-5 flex items-center gap-4"
          >
            <div className="p-3 bg-slate-100 rounded-xl text-slate-600">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Papéis</p>
              <p className="text-2xl font-bold text-gray-900">{roles.length}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border shadow-sm p-5 flex items-center gap-4"
          >
            <div className="p-3 bg-green-100 rounded-xl text-green-600">
              <Check className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Permissões</p>
              <p className="text-2xl font-bold text-gray-900">{permissions.length}</p>
            </div>
          </motion.div>
        </div>

        {/* LAYOUT PRINCIPAL */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* COLUNA 1 e 2: USUÁRIOS */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border shadow-sm p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <UserCircle className="text-yellow-500" /> Usuários do painel
                  </h2>
                  <p className="text-xs text-gray-500">
                    Clique em um usuário para gerenciar papéis e ver permissões.
                  </p>
                </div>
                <div className="relative w-full md:w-64">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Buscar por nome, e-mail, telefone..."
                    className="pl-9 pr-3 py-2 rounded-lg border border-gray-200 w-full text-sm focus:outline-none focus:border-yellow-400"
                  />
                </div>
              </div>

              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-2">
                {filteredUsers.map((u) => (
                  <motion.div
                    key={u.id}
                    whileHover={{ scale: 1.01 }}
                    className={`flex items-center justify-between gap-3 border rounded-xl px-4 py-3 cursor-pointer ${
                      selectedUser?.id === u.id ? 'bg-yellow-50 border-yellow-200' : 'bg-white'
                    }`}
                    onClick={() => openUserRoles(u)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-sm font-medium">
                        {u.full_name ? u.full_name.slice(0, 2).toUpperCase() : 'US'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {u.full_name || 'Sem nome'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{u.email}</p>
                        <p className="text-xs mt-1 flex flex-wrap gap-1">
                          {(u.roles || []).map((r) => (
                            <span
                              key={r}
                              className="inline-flex items-center rounded-full bg-yellow-100 text-yellow-800 text-[10px] px-2 py-0.5"
                            >
                              {r}
                            </span>
                          ))}
                          {(!u.roles || u.roles.length === 0) && (
                            <span className="text-[10px] text-gray-400">Sem papel</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={u.is_active ? 'outline' : 'ghost'}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleUserActive(u);
                        }}
                      >
                        {u.is_active ? 'Ativo' : 'Inativo'}
                      </Button>
                    </div>
                  </motion.div>
                ))}

                {filteredUsers.length === 0 && (
                  <div className="text-center text-gray-400 text-sm py-10">
                    Nenhum usuário encontrado.
                  </div>
                )}
              </div>
            </div>

            {/* PAINEL DE PAPÉIS (LISTA) */}
            <div className="bg-white rounded-2xl border shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <KeyRound className="text-yellow-500" /> Papéis (perfis)
                </h2>
                <p className="text-xs text-gray-400">
                  Clique em um papel para ver/editar permissões.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {roles.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => openRolePerms(r)}
                    className="px-3 py-2 rounded-xl border bg-gray-50 hover:bg-yellow-50 transition text-left"
                  >
                    <p className="text-sm font-semibold text-gray-800 flex items-center gap-1">
                      {r.is_system && <Shield className="w-3 h-3 text-yellow-500" />}
                      {r.name}
                    </p>
                    <p className="text-[11px] text-gray-400">{r.code}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* COLUNA 3: PERMISSÕES AGRUPADAS */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border shadow-sm p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Check className="text-green-500" /> Permissões por módulo
              </h2>
              <p className="text-xs text-gray-500 mb-3">
                Só leitura. A edição é na permissão do papel.
              </p>
              <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
                {Object.entries(permissionsByGroup).map(([group, list]) => (
                  <div key={group} className="border rounded-xl p-3 bg-gray-50/50">
                    <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                      {group}
                    </p>
                    <ul className="space-y-1">
                      {list.map((p) => (
                        <li key={p.code} className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block" />
                          <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded-md border">
                            {p.code}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* DICA */}
            <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4 text-sm text-gray-700">
              <p className="font-semibold mb-1">Como usar</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Cadastra o usuário.</li>
                <li>Depois clica nele e atribui 1 ou mais papéis.</li>
                <li>Se precisar, entra no papel e liga/desliga permissões.</li>
                <li>Depois no React a gente só esconde botão de quem não pode.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* DIALOG: NOVO USUÁRIO */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader>
            <DialogTitle>Novo usuário do painel</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <input
              value={newUser.full_name}
              onChange={(e) => setNewUser((p) => ({ ...p, full_name: e.target.value }))}
              placeholder="Nome completo"
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
            <input
              value={newUser.email}
              onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))}
              placeholder="E-mail"
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
            <input
              value={newUser.phone}
              onChange={(e) => setNewUser((p) => ({ ...p, phone: e.target.value }))}
              placeholder="Telefone / WhatsApp"
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={newUser.is_active}
                onChange={(e) => setNewUser((p) => ({ ...p, is_active: e.target.checked }))}
              />
              Usuário ativo
            </label>
            <p className="text-[10px] text-gray-400">
              * depois a gente amarra isso com o login real / sessão de 24h.
            </p>
          </div>
          <DialogFooter className="mt-3">
            <Button variant="ghost" onClick={() => setIsUserDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveUser} className="bg-yellow-400 text-black hover:bg-yellow-500">
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: DETALHE DO USUÁRIO (PAPÉIS) */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="bg-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Permissões de {selectedUser?.full_name || selectedUser?.email}</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              {/* Coluna papéis */}
              <div className="border rounded-xl p-3 bg-gray-50">
                <p className="text-xs uppercase text-gray-500 mb-2">Papéis atribuídos</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {(selectedUser.roles || []).map((r) => (
                    <span
                      key={r}
                      className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-[11px]"
                    >
                      {r}
                      <button
                        className="text-red-500"
                        onClick={() => {
                          const roleObj = roles.find((ro) => ro.code === r);
                          if (roleObj) handleRemoveRoleFromUser(roleObj.id);
                        }}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {(!selectedUser.roles || selectedUser.roles.length === 0) && (
                    <p className="text-[11px] text-gray-400">Nenhum papel</p>
                  )}
                </div>
                <p className="text-xs uppercase text-gray-400 mb-1">Atribuir novo papel</p>
                <div className="flex flex-wrap gap-2">
                  {roles.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => handleAssignRoleToUser(r.id)}
                      className="px-2 py-1 rounded-lg border bg-white text-xs hover:bg-yellow-50"
                    >
                      {r.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Coluna permissões efetivas */}
              <div className="border rounded-xl p-3 bg-white">
                <p className="text-xs uppercase text-gray-500 mb-2">Permissões efetivas</p>
                <div className="max-h-52 overflow-y-auto pr-1 space-y-1">
                  {(selectedUser.permissions || []).map((perm) => (
                    <div
                      key={perm}
                      className="flex items-center gap-2 text-[11px] bg-gray-50 rounded px-2 py-1"
                    >
                      <Check className="w-3 h-3 text-green-500" /> {perm}
                    </div>
                  ))}
                  {(!selectedUser.permissions || selectedUser.permissions.length === 0) && (
                    <p className="text-[11px] text-gray-400">Nenhuma permissão</p>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="mt-4">
            <Button onClick={() => setSelectedUser(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: PERMISSÕES DO PAPEL */}
      <Dialog open={isRolePermDialogOpen} onOpenChange={setIsRolePermDialogOpen}>
        <DialogContent className="bg-white max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Permissões do papel:{' '}
              <span className="text-yellow-500">{selectedRole?.name || selectedRole?.code}</span>
            </DialogTitle>
          </DialogHeader>
          {selectedRole && (
            <div className="mt-3 space-y-4">
              {Object.entries(permissionsByGroup).map(([group, list]) => (
                <div key={group} className="border rounded-xl p-3">
                  <p className="text-xs uppercase text-gray-500 mb-2">{group}</p>
                  <div className="flex flex-wrap gap-2">
                    {list.map((p) => {
                      const active = roleHasPermission(selectedRole.id, p.code);
                      return (
                        <button
                          key={p.code}
                          onClick={() => togglePermissionForRole(p.code)}
                          className={`px-2 py-1 rounded-lg text-[11px] border ${
                            active
                              ? 'bg-yellow-400 text-black border-yellow-400'
                              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {p.code}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
          <DialogFooter className="mt-4">
            <Button onClick={() => setIsRolePermDialogOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccessControl;

