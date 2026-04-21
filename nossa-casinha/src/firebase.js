// ─────────────────────────────────────────────────────────────
//  PASSO 1: Acesse https://console.firebase.google.com
//  PASSO 2: Crie um projeto chamado "nossa-casinha"
//  PASSO 3: Clique em "Adicionar app" → Web (</>)
//  PASSO 4: Copie os valores do seu firebaseConfig aqui abaixo
//  PASSO 5: Vá em "Realtime Database" → "Criar banco de dados"
//           → escolha a região mais próxima (us-central1)
//           → inicie em "modo de teste" (permite leitura/escrita por 30 dias)
// ─────────────────────────────────────────────────────────────

import { initializeApp } from 'firebase/app';
import { getDatabase }   from 'firebase/database';

const firebaseConfig = {
  apiKey:            "COLE_AQUI_SEU_apiKey",
  authDomain:        "COLE_AQUI_SEU_authDomain",
  databaseURL:       "COLE_AQUI_SEU_databaseURL",
  projectId:         "COLE_AQUI_SEU_projectId",
  storageBucket:     "COLE_AQUI_SEU_storageBucket",
  messagingSenderId: "COLE_AQUI_SEU_messagingSenderId",
  appId:             "COLE_AQUI_SEU_appId",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
