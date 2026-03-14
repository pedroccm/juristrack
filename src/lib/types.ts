export type Role = "admin" | "advogado";

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: Role;
  ativo: boolean;
  created_at: string;
}

export interface Processo {
  id: string;
  numero_cnj: string;
  tribunal: string;
  cliente: string;
  pasta: string;
  discussao: string;
  responsaveis?: Usuario[];  // múltiplos responsáveis
  andamento_atual: string;
  data_andamento: string | null;
  status: "ativo" | "arquivado";
  created_at: string;
  updated_at: string;
}

export interface Andamento {
  id: string;
  processo_id: string;
  descricao: string;
  data_andamento: string;
  detectado_em: string;
}

export interface Monitoramento {
  id: string;
  iniciado_em: string;
  finalizado_em: string | null;
  total_processos: number;
  total_mudancas: number;
  total_nao_encontrados: number;
  iniciado_por: string | null;
  status: "rodando" | "concluido" | "erro";
}
