// ==========================================
// 📞 緊急連絡先ページ(メモ欄付き)
// ==========================================
import { useState, useEffect } from "react";
import { Phone, Plus, Trash2, Copy, Check, Pencil, X } from "lucide-react";

import { db } from "./firebase";
import {
  collection, onSnapshot, addDoc, deleteDoc, updateDoc,
  doc, query, orderBy,
} from "firebase/firestore";

export default function EmergencyContacts({ darkMode }) {
  const [contacts, setContacts] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newCategory, setNewCategory] = useState("病院");
  const [newMemo, setNewMemo] = useState(""); // 📝 追加: 新規メモ
  const [copiedId, setCopiedId] = useState(null);

  // 🎯 アクション選択中のID
  const [actionMenuId, setActionMenuId] = useState(null);

  // ✏️ 編集モード中のID
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editMemo, setEditMemo] = useState(""); // 📝 追加: 編集メモ

  useEffect(() => {
    const contactsRef = collection(db, "emergencyContacts");
    const q = query(contactsRef, orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const firestoreContacts = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setContacts(firestoreContacts);
    });
    return () => unsubscribe();
  }, []);

  const addContact = async () => {
    if (newName.trim() === "" || newPhone.trim() === "") {
      alert("名前と電話番号を入力してください");
      return;
    }
    await addDoc(collection(db, "emergencyContacts"), {
      name: newName,
      phone: newPhone,
      category: newCategory,
      memo: newMemo, // 📝 追加
      createdAt: new Date().toISOString(),
    });
    setNewName("");
    setNewPhone("");
    setNewCategory("病院");
    setNewMemo(""); // 📝 追加
    setIsAdding(false);
  };

  const deleteContact = async (id) => {
    if (window.confirm("この連絡先を削除しますか?")) {
      await deleteDoc(doc(db, "emergencyContacts", id));
    }
  };

  // 📋 コピー処理
  const copyPhone = async (id, phone) => {
    setActionMenuId(null);
    try {
      await navigator.clipboard.writeText(phone);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      const textArea = document.createElement("textarea");
      textArea.value = phone;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      } catch {
        alert("コピーできませんでした");
      }
      document.body.removeChild(textArea);
    }
  };

  // ✏️ 編集モードに入る
  const startEdit = (contact) => {
    setActionMenuId(null);
    setEditingId(contact.id);
    setEditName(contact.name);
    setEditPhone(contact.phone);
    setEditCategory(contact.category);
    setEditMemo(contact.memo || ""); // 📝 追加
  };

  // 🎯 カードタップ → アクションメニュー表示/非表示
  const handleCardTap = (id) => {
    setActionMenuId(actionMenuId === id ? null : id);
  };

  const saveEdit = async (id) => {
    if (editName.trim() === "" || editPhone.trim() === "") {
      alert("名前と電話番号を入力してください");
      return;
    }
    await updateDoc(doc(db, "emergencyContacts", id), {
      name: editName,
      phone: editPhone,
      category: editCategory,
      memo: editMemo, // 📝 追加
    });
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const categoryStyles = {
    "病院":   { bg: darkMode ? "bg-rose-900/30"   : "bg-rose-50",   border: darkMode ? "border-rose-700"   : "border-rose-200",   text: darkMode ? "text-rose-300"   : "text-rose-700",   emoji: "🏥" },
    "区役所": { bg: darkMode ? "bg-blue-900/30"   : "bg-blue-50",   border: darkMode ? "border-blue-700"   : "border-blue-200",   text: darkMode ? "text-blue-300"   : "text-blue-700",   emoji: "🏛️" },
    "親族":   { bg: darkMode ? "bg-pink-900/30"   : "bg-pink-50",   border: darkMode ? "border-pink-700"   : "border-pink-200",   text: darkMode ? "text-pink-300"   : "text-pink-700",   emoji: "👨‍👩‍👧" },
    "タクシー": { bg: darkMode ? "bg-yellow-900/30" : "bg-yellow-50", border: darkMode ? "border-yellow-700" : "border-yellow-200", text: darkMode ? "text-yellow-300" : "text-yellow-700", emoji: "🚕" },
    "その他": { bg: darkMode ? "bg-gray-800"      : "bg-gray-50",   border: darkMode ? "border-gray-600"   : "border-gray-200",   text: darkMode ? "text-gray-300"   : "text-gray-700",   emoji: "📞" },
  };

  const categories = Object.keys(categoryStyles);

  return (
    <div className="max-w-md mx-auto">
      <header className="text-center mb-6">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full shadow-md mb-3 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <Phone className="w-8 h-8 text-rose-400" strokeWidth={1.5} />
        </div>
        <h1 className={`text-2xl font-bold mb-1 ${darkMode ? "text-gray-100" : "text-gray-800"}`}>
          緊急連絡先
        </h1>
        <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          タップでメニュー表示 📋
        </p>
      </header>

      <div className={`rounded-2xl shadow-sm p-4 mb-5 border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-pink-100"}`}>
        {!isAdding ? (
          <button
            onClick={() => setIsAdding(true)}
            className={`w-full py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${darkMode ? "text-rose-400 hover:bg-gray-700" : "text-rose-600 hover:bg-rose-50"}`}
          >
            <Plus className="w-4 h-4" />
            連絡先を追加
          </button>
        ) : (
          <div>
            <h2 className={`text-sm font-semibold mb-3 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
              新しい連絡先
            </h2>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="例:○○産婦人科"
              className={`w-full px-3 py-2 border rounded-lg mb-2 text-base focus:outline-none focus:ring-2 focus:ring-rose-200 ${darkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "border-gray-200"}`}
            />
            <input
              type="tel"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="例:03-1234-5678"
              className={`w-full px-3 py-2 border rounded-lg mb-2 text-base focus:outline-none focus:ring-2 focus:ring-rose-200 ${darkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "border-gray-200"}`}
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg mb-2 text-base focus:outline-none focus:ring-2 focus:ring-rose-200 ${darkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-200"}`}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {categoryStyles[cat].emoji} {cat}
                </option>
              ))}
            </select>
            {/* 📝 メモ入力欄(新規追加) */}
            <input
              type="text"
              value={newMemo}
              onChange={(e) => setNewMemo(e.target.value)}
              placeholder="メモ(例:夜間救急、田中先生など)"
              className={`w-full px-3 py-2 border rounded-lg mb-3 text-base focus:outline-none focus:ring-2 focus:ring-rose-200 ${darkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "border-gray-200"}`}
            />
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setIsAdding(false);
                  setNewName("");
                  setNewPhone("");
                  setNewMemo("");
                }}
                className={`py-2 rounded-lg text-sm font-semibold transition-all ${darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                キャンセル
              </button>
              <button
                onClick={addContact}
                className="py-2 bg-gradient-to-r from-rose-300 to-pink-300 text-white rounded-lg text-sm font-semibold hover:from-rose-400 hover:to-pink-400 transition-all"
              >
                追加
              </button>
            </div>
          </div>
        )}
      </div>

      {contacts.length === 0 ? (
        <div className={`rounded-2xl shadow-sm p-8 text-center border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-pink-100"}`}>
          <p className="text-3xl mb-2">📞</p>
          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            まだ連絡先がありません
          </p>
        </div>
      ) : (
        <div className="space-y-2 mb-32">
          {contacts.map((contact) => {
            const style = categoryStyles[contact.category] || categoryStyles["その他"];
            const isCopied = copiedId === contact.id;
            const isEditing = editingId === contact.id;
            const isMenuOpen = actionMenuId === contact.id;

            // ✏️ 編集モード
            if (isEditing) {
              return (
                <div
                  key={contact.id}
                  className={`rounded-xl p-3 border-2 ${darkMode ? "bg-gray-800 border-purple-500" : "bg-white border-purple-300"}`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Pencil className={`w-4 h-4 ${darkMode ? "text-purple-400" : "text-purple-500"}`} />
                    <span className={`text-xs font-semibold ${darkMode ? "text-purple-400" : "text-purple-500"}`}>
                      編集モード
                    </span>
                  </div>
                  <div className="space-y-2 mb-3">
                    <div>
                      <label className={`text-xs block mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>名前</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-purple-200 ${darkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "border-gray-200"}`}
                      />
                    </div>
                    <div>
                      <label className={`text-xs block mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>電話番号</label>
                      <input
                        type="tel"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-purple-200 ${darkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "border-gray-200"}`}
                      />
                    </div>
                    <div>
                      <label className={`text-xs block mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>カテゴリ</label>
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-purple-200 ${darkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-200"}`}
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {categoryStyles[cat].emoji} {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                    {/* 📝 メモ編集欄(新規追加) */}
                    <div>
                      <label className={`text-xs block mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>メモ</label>
                      <input
                        type="text"
                        value={editMemo}
                        onChange={(e) => setEditMemo(e.target.value)}
                        placeholder="メモ(例:夜間救急など)"
                        className={`w-full px-3 py-2 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-purple-200 ${darkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "border-gray-200"}`}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={cancelEdit}
                      className={`py-2 rounded-lg text-sm font-semibold transition-all ${darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={() => saveEdit(contact.id)}
                      className="py-2 bg-gradient-to-r from-purple-400 to-pink-400 text-white rounded-lg text-sm font-semibold"
                    >
                      保存
                    </button>
                  </div>
                </div>
              );
            }

            // 📋 通常モード
            return (
              <div
                key={contact.id}
                className={`rounded-xl border ${style.bg} ${style.border} overflow-hidden transition-all ${isMenuOpen ? "ring-2 ring-purple-300" : ""}`}
              >
                <div className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl flex-shrink-0">{style.emoji}</div>
                    <button
                      onClick={() => handleCardTap(contact.id)}
                      className="flex-1 min-w-0 text-left active:scale-95 transition-all"
                    >
                      <p className={`text-sm font-bold truncate ${style.text}`}>
                        {contact.name}
                      </p>
                      <p className={`text-base font-mono mt-0.5 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                        {contact.phone}
                      </p>
                      {/* 📝 メモ表示(新規追加) */}
                      {contact.memo && (
                        <p className={`text-xs mt-0.5 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                          📝 {contact.memo}
                        </p>
                      )}
                      {isCopied ? (
                        <span className="inline-flex items-center gap-0.5 text-xs text-green-600 font-semibold mt-1">
                          <Check className="w-3 h-3" />
                          コピーしました!
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-0.5 text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                          {isMenuOpen ? "↓ アクションを選択 ↓" : "タップでメニュー表示"}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => deleteContact(contact.id)}
                      className={`flex-shrink-0 p-2 rounded-lg transition-all ${darkMode ? "text-gray-500 hover:text-rose-400 hover:bg-gray-700" : "text-gray-300 hover:text-rose-400 hover:bg-rose-50"}`}
                      aria-label="削除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 🎯 アクションメニュー */}
                {isMenuOpen && (
                  <div className={`grid grid-cols-3 gap-1 p-2 border-t ${darkMode ? "bg-gray-800/50 border-gray-700" : "bg-white/60 border-gray-100"}`}>
                    <button
                      onClick={() => copyPhone(contact.id, contact.phone)}
                      className="flex flex-col items-center justify-center gap-1 py-2 bg-gradient-to-br from-blue-300 to-cyan-300 text-white rounded-lg text-xs font-semibold transition-all active:scale-95"
                    >
                      <Copy className="w-4 h-4" />
                      コピー
                    </button>
                    <button
                      onClick={() => startEdit(contact)}
                      className="flex flex-col items-center justify-center gap-1 py-2 bg-gradient-to-br from-purple-300 to-pink-300 text-white rounded-lg text-xs font-semibold transition-all active:scale-95"
                    >
                      <Pencil className="w-4 h-4" />
                      編集
                    </button>
                    <button
                      onClick={() => setActionMenuId(null)}
                      className={`flex flex-col items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold transition-all active:scale-95 ${darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-600"}`}
                    >
                      <X className="w-4 h-4" />
                      閉じる
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
