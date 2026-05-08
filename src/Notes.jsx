// ==========================================
// 📝 メモページ(付箋スタイル・夫婦共有)
// ==========================================
import { useState, useEffect } from "react";
import { StickyNote, Plus, Trash2, Save, X, ChevronLeft } from "lucide-react";

import { db } from "./firebase";
import {
  collection, onSnapshot, addDoc, deleteDoc, updateDoc,
  doc, query, orderBy,
} from "firebase/firestore";

export default function Notes({ currentUser, darkMode }) {
  // 📋 メモ一覧
  const [notes, setNotes] = useState([]);
  // 📖 詳細表示中のメモID(nullなら一覧表示)
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  // ✏️ 編集中の値
  const [editTitle, setEditTitle] = useState("");
  const [editText, setEditText] = useState("");

  // 🔥 メモのリアルタイム監視(更新が新しい順)
  useEffect(() => {
    const ref = collection(db, "notes");
    const q = query(ref, orderBy("updatedAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setNotes(records);
    });
    return () => unsubscribe();
  }, []);

  // ➕ 新しいメモ作成→そのまま編集画面に
  const createNote = async () => {
    const now = new Date().toISOString();
    const docRef = await addDoc(collection(db, "notes"), {
      title: "",
      text: "",
      colorKey: pickRandomColor(),
      createdAt: now,
      updatedAt: now,
      updatedBy: currentUser,
    });
    // 作ったメモを即座に開く
    setSelectedNoteId(docRef.id);
    setEditTitle("");
    setEditText("");
  };

  // 📖 メモを開く
  const openNote = (note) => {
    setSelectedNoteId(note.id);
    setEditTitle(note.title || "");
    setEditText(note.text || "");
  };

  // 💾 保存
  const saveNote = async () => {
    if (!selectedNoteId) return;
    await updateDoc(doc(db, "notes", selectedNoteId), {
      title: editTitle,
      text: editText,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser,
    });
    setSelectedNoteId(null);
  };

  // 🗑️ 削除
  const deleteNote = async (id, e) => {
    if (e) e.stopPropagation(); // カードのクリックイベントが発火しないように
    if (window.confirm("このメモを削除しますか?")) {
      await deleteDoc(doc(db, "notes", id));
      if (selectedNoteId === id) {
        setSelectedNoteId(null);
      }
    }
  };

  // 🎨 ランダムな付箋色
  const pickRandomColor = () => {
    const colors = ["yellow", "pink", "blue", "green", "purple", "orange"];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // 🎨 付箋色のスタイル
  const getNoteStyle = (colorKey) => {
    const colorMap = {
      yellow: { bg: darkMode ? "bg-yellow-900/40" : "bg-yellow-100", border: darkMode ? "border-yellow-700" : "border-yellow-300", text: darkMode ? "text-yellow-200" : "text-yellow-900" },
      pink:   { bg: darkMode ? "bg-pink-900/40"   : "bg-pink-100",   border: darkMode ? "border-pink-700"   : "border-pink-300",   text: darkMode ? "text-pink-200"   : "text-pink-900" },
      blue:   { bg: darkMode ? "bg-blue-900/40"   : "bg-blue-100",   border: darkMode ? "border-blue-700"   : "border-blue-300",   text: darkMode ? "text-blue-200"   : "text-blue-900" },
      green:  { bg: darkMode ? "bg-green-900/40"  : "bg-green-100",  border: darkMode ? "border-green-700"  : "border-green-300",  text: darkMode ? "text-green-200"  : "text-green-900" },
      purple: { bg: darkMode ? "bg-purple-900/40" : "bg-purple-100", border: darkMode ? "border-purple-700" : "border-purple-300", text: darkMode ? "text-purple-200" : "text-purple-900" },
      orange: { bg: darkMode ? "bg-orange-900/40" : "bg-orange-100", border: darkMode ? "border-orange-700" : "border-orange-300", text: darkMode ? "text-orange-200" : "text-orange-900" },
    };
    return colorMap[colorKey] || colorMap.yellow;
  };

  // 👤 ユーザーアイコン
  const getUserEmoji = (user) => {
    if (user === "龍由" || user === "たっちゃん" || user === "主人") return "👨";
    return "👩";
  };

  // 🕒 相対時刻
  const getRelativeTime = (isoString) => {
    if (!isoString) return "";
    const past = new Date(isoString);
    const now = new Date();
    const diffMs = now - past;
    const diffMin = Math.floor(diffMs / (1000 * 60));
    if (diffMin < 1) return "たった今";
    if (diffMin < 60) return `${diffMin}分前`;
    const hours = Math.floor(diffMin / 60);
    if (hours < 24) return `${hours}時間前`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}日前`;
    return `${past.getMonth() + 1}/${past.getDate()}`;
  };

  // 📖 詳細編集画面
  if (selectedNoteId) {
    const note = notes.find((n) => n.id === selectedNoteId);
    if (!note) {
      // 削除されたなどで見つからない場合は一覧に戻す
      setSelectedNoteId(null);
      return null;
    }
    const style = getNoteStyle(note.colorKey);

    return (
      <div className="max-w-md mx-auto">
        {/* 戻るボタン */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setSelectedNoteId(null)}
            className={`inline-flex items-center gap-1 text-sm font-semibold px-3 py-1 rounded-full transition-all ${darkMode ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-white/80 text-gray-600 hover:bg-white"}`}
          >
            <ChevronLeft className="w-4 h-4" />
            一覧に戻る
          </button>
          <button
            onClick={() => deleteNote(selectedNoteId)}
            className={`inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full transition-all ${darkMode ? "text-gray-500 hover:text-rose-400" : "text-gray-400 hover:text-rose-500"}`}
          >
            <Trash2 className="w-3 h-3" />
            削除
          </button>
        </div>

        {/* 編集カード(付箋風) */}
        <div className={`rounded-2xl p-5 border-2 ${style.bg} ${style.border} shadow-md mb-4`}>
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="タイトル"
            className={`w-full text-lg font-bold bg-transparent border-b-2 ${darkMode ? "border-white/20 text-gray-100 placeholder-gray-500" : "border-black/10 text-gray-800 placeholder-gray-400"} focus:outline-none focus:border-current pb-2 mb-3`}
          />
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            placeholder="ここにメモを書く..."
            rows={12}
            className={`w-full bg-transparent text-base resize-none focus:outline-none ${darkMode ? "text-gray-100 placeholder-gray-500" : "text-gray-800 placeholder-gray-400"}`}
          />
        </div>

        {/* 更新者情報 */}
        {note.updatedBy && (
          <p className={`text-xs text-center mb-4 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
            最終更新: {getUserEmoji(note.updatedBy)} {note.updatedBy} ({getRelativeTime(note.updatedAt)})
          </p>
        )}

        {/* 保存ボタン */}
        <div className="grid grid-cols-2 gap-2 mb-32">
          <button
            onClick={() => setSelectedNoteId(null)}
            className={`py-3 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            <X className="w-4 h-4" />
            キャンセル
          </button>
          <button
            onClick={saveNote}
            className="py-3 bg-gradient-to-r from-amber-300 to-yellow-400 text-white rounded-2xl font-semibold text-sm shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            保存
          </button>
        </div>
      </div>
    );
  }

  // 📋 一覧画面
  return (
    <div className="max-w-md mx-auto">
      {/* ヘッダー */}
      <header className="text-center mb-6">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full shadow-md mb-3 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <StickyNote className="w-8 h-8 text-amber-400" strokeWidth={1.5} />
        </div>
        <h1 className={`text-2xl font-bold mb-1 ${darkMode ? "text-gray-100" : "text-gray-800"}`}>
          メモ
        </h1>
        <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          夫婦で共有できる付箋メモ 📝
        </p>
      </header>

      {/* ➕ 新しいメモボタン */}
      <button
        onClick={createNote}
        className={`w-full py-3 mb-5 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md active:scale-95 bg-gradient-to-r from-amber-300 to-yellow-400 text-white`}
      >
        <Plus className="w-4 h-4" />
        新しいメモを作る
      </button>

      {/* 📋 メモ一覧 */}
      {notes.length === 0 ? (
        <div className={`rounded-2xl shadow-sm p-8 text-center border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-pink-100"}`}>
          <p className="text-3xl mb-2">📝</p>
          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            まだメモがありません
          </p>
          <p className={`text-xs mt-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
            上の「新しいメモを作る」から始めましょう
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mb-32">
          {notes.map((note) => {
            const style = getNoteStyle(note.colorKey);
            const displayTitle = note.title || "（タイトルなし）";
            const displayText = note.text || "（本文なし）";
            return (
              <div
                key={note.id}
                onClick={() => openNote(note)}
                className={`rounded-xl p-3 border-2 ${style.bg} ${style.border} shadow-sm cursor-pointer active:scale-95 hover:shadow-md transition-all relative group`}
              >
                {/* 削除ボタン(右上、ホバー時表示) */}
                <button
                  onClick={(e) => deleteNote(note.id, e)}
                  className={`absolute top-1 right-1 p-1 rounded-full transition-all opacity-0 group-hover:opacity-100 ${darkMode ? "bg-gray-800/80 text-gray-400 hover:text-rose-400" : "bg-white/80 text-gray-400 hover:text-rose-500"}`}
                  aria-label="削除"
                >
                  <Trash2 className="w-3 h-3" />
                </button>

                {/* タイトル */}
                <p className={`text-sm font-bold mb-2 line-clamp-2 ${style.text}`}>
                  {displayTitle}
                </p>

                {/* 本文プレビュー */}
                <p className={`text-xs mb-2 line-clamp-4 whitespace-pre-wrap ${style.text} opacity-75`}>
                  {displayText}
                </p>

                {/* 更新情報 */}
                {note.updatedBy && (
                  <p className={`text-xs ${style.text} opacity-60 border-t pt-1 ${darkMode ? "border-white/10" : "border-black/10"}`}>
                    {getUserEmoji(note.updatedBy)} {getRelativeTime(note.updatedAt)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
