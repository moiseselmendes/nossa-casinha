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
  apiKey:            "AIzaSyAz1hjQFNrvN0sEehPSoS_Do2lKUhjxkCo",
  authDomain:        "nossa-casinha-9cf39.firebaseapp.com",
  databaseURL:       "https://nossa-casinha-9cf39-default-rtdb.firebaseio.com",
  projectId:         "nossa-casinha-9cf39",
  storageBucket:     "nossa-casinha-9cf39.firebasestorage.app",
  messagingSenderId: "326715488454",
  appId:             "1:326715488454:web:023647ac47638c775dffc7",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
