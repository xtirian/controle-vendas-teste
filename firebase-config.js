// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDCAvG0zi9TrRhjS3bi29PuFCiEuKt8-eE",
  authDomain: "controle-vendas-teste.firebaseapp.com",
  databaseURL: "https://controle-vendas-teste-default-rtdb.firebaseio.com",
  projectId: "controle-vendas-teste",
  storageBucket: "controle-vendas-teste.firebasestorage.app",
  messagingSenderId: "47366150695",
  appId: "1:47366150695:web:bf86ba0038addfb5438c02",
  measurementId: "G-YMT5J3WZC5"
};



const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
