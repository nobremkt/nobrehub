# Arquitetura de Data Layer Unificado

## 🎯 Objetivo

Criar uma camada de abstração de dados que:
1. Centralize TODA lógica de banco de dados em uma pasta
2. Todo o app use apenas essa camada (nunca Firebase direto)
3. Facilite migração futura para PostgreSQL ou outro banco

---

## 📁 Estrutura Proposta

```
src/
├── data/                           # 🔥 CAMADA DE DADOS (única pasta que conhece Firebase)
│   ├── index.ts                    # Exports centralizados
│   │
│   ├── providers/                  # Implementações específicas de banco
│   │   ├── firebase/               # Firebase (atual)
│   │   │   ├── FirebaseProvider.ts
│   │   │   ├── collections.ts      # Nomes das collections
│   │   │   └── converters.ts       # Firestore converters
│   │   │
│   │   └── postgres/               # PostgreSQL (futuro)
│   │       └── PostgresProvider.ts
│   │
│   ├── repositories/               # Interfaces + Implementações
│   │   ├── interfaces/             # Contratos (o que o app conhece)
│   │   │   ├── ILeadRepository.ts
│   │   │   ├── IProjectRepository.ts
│   │   │   ├── IConversationRepository.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── LeadRepository.ts       # Implementação atual (usa Firebase)
│   │   ├── ProjectRepository.ts
│   │   ├── ConversationRepository.ts
│   │   └── index.ts
│   │
│   ├── services/                   # Lógica de negócio sobre os repositories
│   │   ├── LeadService.ts          # Operações de alto nível
│   │   ├── ProjectService.ts
│   │   ├── DistributionService.ts  # Lógica de distribuição
│   │   └── index.ts
│   │
│   └── hooks/                      # React hooks para consumir os services
│       ├── useLeads.ts
│       ├── useProjects.ts
│       └── index.ts
│
├── features/                       # Features (NÃO conhecem Firebase)
│   ├── crm/
│   ├── production/
│   └── inbox/
│
└── types/                          # Types compartilhados
```

---

## 🔑 Padrão Repository

### Interface (Contrato)

```typescript
// src/data/repositories/interfaces/ILeadRepository.ts

export interface ILeadRepository {
  // CRUD básico
  getById(id: string): Promise<Lead | null>;
  getAll(): Promise<Lead[]>;
  create(data: CreateLeadDTO): Promise<Lead>;
  update(id: string, data: Partial<Lead>): Promise<void>;
  delete(id: string): Promise<void>;

  // Queries específicas
  getByResponsible(responsibleId: string): Promise<Lead[]>;
  getByStatus(status: ClientStatus): Promise<Lead[]>;
  getByPipeline(pipeline: Pipeline): Promise<Lead[]>;

  // Real-time (opcional para bancos que suportam)
  subscribe(callback: (leads: Lead[]) => void): () => void;
}
```

### Implementação Firebase (atual)

```typescript
// src/data/repositories/LeadRepository.ts

import { firestore } from '../providers/firebase/FirebaseProvider';
import { ILeadRepository } from './interfaces/ILeadRepository';

export class LeadRepository implements ILeadRepository {
  private collection = firestore.collection('leads');

  async getById(id: string): Promise<Lead | null> {
    const doc = await this.collection.doc(id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } as Lead : null;
  }

  async getByResponsible(responsibleId: string): Promise<Lead[]> {
    const snapshot = await this.collection
      .where('responsibleId', '==', responsibleId)
      .get();
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as Lead);
  }

  subscribe(callback: (leads: Lead[]) => void): () => void {
    return this.collection.onSnapshot(snap => {
      const leads = snap.docs.map(d => ({ id: d.id, ...d.data() }) as Lead);
      callback(leads);
    });
  }

  // ... outros métodos
}
```

### Implementação PostgreSQL (futuro)

```typescript
// src/data/providers/postgres/LeadRepository.ts

import { sql } from '../PostgresProvider';
import { ILeadRepository } from '../../interfaces/ILeadRepository';

export class LeadRepository implements ILeadRepository {
  async getById(id: string): Promise<Lead | null> {
    const result = await sql`SELECT * FROM leads WHERE id = ${id}`;
    return result[0] ?? null;
  }

  async getByResponsible(responsibleId: string): Promise<Lead[]> {
    return await sql`
      SELECT * FROM leads 
      WHERE responsible_id = ${responsibleId}
    `;
  }

  subscribe(callback: (leads: Lead[]) => void): () => void {
    // PostgreSQL não tem real-time nativo
    // Opções: polling, Supabase Realtime, ou websockets
    const interval = setInterval(async () => {
      const leads = await this.getAll();
      callback(leads);
    }, 5000);
    return () => clearInterval(interval);
  }
}
```

---

## 🔄 Dependency Injection

### Factory Pattern

```typescript
// src/data/index.ts

import { LeadRepository } from './repositories/LeadRepository';
import { ILeadRepository } from './repositories/interfaces/ILeadRepository';

// Escolhe qual implementação usar baseado em config
const DATABASE_PROVIDER = import.meta.env.VITE_DATABASE_PROVIDER || 'firebase';

export function getLeadRepository(): ILeadRepository {
  switch (DATABASE_PROVIDER) {
    case 'postgres':
      // Importa dinamicamente para não bundlar código não usado
      return new (require('./providers/postgres/LeadRepository')).LeadRepository();
    case 'firebase':
    default:
      return new LeadRepository();
  }
}

// Singleton para reusar instância
let leadRepository: ILeadRepository | null = null;
export function useLeadRepository(): ILeadRepository {
  if (!leadRepository) {
    leadRepository = getLeadRepository();
  }
  return leadRepository;
}
```

---

## 📦 Como o App Usa

### Antes (atual - acoplado ao Firebase)

```typescript
// ❌ Componente conhece Firebase diretamente
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

function ContactsPage() {
  useEffect(() => {
    const q = query(collection(db, 'leads'), where('status', '==', 'open'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // ...
    });
  }, []);
}
```

### Depois (desacoplado)

```typescript
// ✅ Componente usa apenas a camada de dados
import { useLeadRepository } from '@/data';

function ContactsPage() {
  const leadRepo = useLeadRepository();
  
  useEffect(() => {
    const unsubscribe = leadRepo.subscribe((leads) => {
      const openLeads = leads.filter(l => l.status === 'open');
      // ...
    });
    return unsubscribe;
  }, [leadRepo]);
}
```

### Ou com Hook customizado (ainda melhor)

```typescript
// src/data/hooks/useLeads.ts
export function useLeads(filter?: LeadFilter) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const repo = useLeadRepository();

  useEffect(() => {
    const unsubscribe = repo.subscribe((allLeads) => {
      const filtered = filter ? applyFilter(allLeads, filter) : allLeads;
      setLeads(filtered);
      setLoading(false);
    });
    return unsubscribe;
  }, [repo, filter]);

  return { leads, loading };
}

// Componente final (super limpo)
function ContactsPage() {
  const { leads, loading } = useLeads({ status: 'open' });
  
  if (loading) return <Spinner />;
  return <LeadList leads={leads} />;
}
```

---

## 📝 Migração Gradual

### Fase 1: Criar estrutura
1. Criar pasta `src/data/`
2. Criar interfaces dos repositories
3. Implementar repositories usando Firebase

### Fase 2: Migrar services existentes
1. Mover lógica de `LeadService.ts` para novo `data/services/LeadService.ts`
2. Fazer service usar repository em vez de Firebase direto
3. Atualizar imports nos componentes

### Fase 3: Criar hooks
1. Criar hooks customizados (`useLeads`, `useProjects`, etc.)
2. Componentes usam hooks em vez de services diretamente

### Fase 4: Preparar para PostgreSQL (futuro)
1. Criar `providers/postgres/`
2. Implementar mesmas interfaces
3. Testar com flag de feature
4. Switch gradual

---

## ✅ Benefícios

| Benefício | Descrição |
|-----------|-----------|
| **Migração Fácil** | Só precisa criar nova implementação, app não muda |
| **Testabilidade** | Mock dos repositories para testes unitários |
| **Manutenção** | Toda lógica de DB em um lugar só |
| **Consistência** | Tipos e contratos bem definidos |
| **Real-time** | Abstração funciona igual independente do banco |

---

## 🎯 Próximos Passos

1. [ ] Decidir se implementar agora ou após as features atuais
2. [ ] Criar estrutura de pastas
3. [ ] Definir interfaces de todos os repositories
4. [ ] Migrar services existentes gradualmente
5. [ ] Criar hooks customizados
6. [ ] Documentar padrões para novos devs
