// Firebaseと接続するための設定ファイル
// このファイルは「Firebaseとやり取りする道具箱」のようなものです

// 🔧 Firebaseの必要な機能をインポート
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// 🔑 Firebaseの設定情報
const firebaseConfig = {
  apiKey: "AIzaSyAHbfN_E4vc3yWHE2KLmq7I-Frz7HRYqRA",
  authDomain: "umimasu-73c14.firebaseapp.com",
  projectId: "umimasu-73c14",
  storageBucket: "umimasu-73c14.firebasestorage.app",
  messagingSenderId: "180561037528",
  appId: "1:180561037528:web:3509017d57b68939bf6fad",
};

// 🚀 Firebaseを初期化（接続開始）
const app = initializeApp(firebaseConfig);

// 📚 Firestoreデータベースへの接続を取得してエクスポート
// 他のファイルから "import { db } from './firebase'" で使えるようになる
export const db = getFirestore(app);
