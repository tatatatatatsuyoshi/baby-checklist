// ==========================================
// 🌡️ 体温記録ページ
// ==========================================
import { useState, useEffect } from "react";
import { Thermometer, Plus, Trash2, AlertCircle } from "lucide-react";

import { db } from "./firebase";
import {
  collection, onSnapshot, addDoc, deleteDoc,
  doc, query, orderBy,
} from "firebase/firestore";

export default function Temperature({ currentUser, darkMode }) {
  const [records, setRecords] = useState([]);
  const [newTemp, setNewTemp] = useState("");
  const [newDateTime, setNewDateTime] = useState(() => {
    // デフォルトは現在時刻
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const hh = String(now.getHours()).padStart(2, "0");
    const mi = String(now.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  });
  const [newMemo, setNewMemo] = useState("");

  // 🔥 リアルタイム監視
  useEffect(() => {
    const ref = collection(db, "temperatures");
    const q = query(ref, orderBy("measuredAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setRecords(data);
    });
    return () => unsubscribe();
  }, []);

  // ➕ 追加
  const addRecord = async () => {
    if (!newTemp || isNaN(Number(newTemp))) {
      alert("体温を入力してください(例:36.5)");
      return;
    }
    await addDoc(collection(db, "temperatures"), {
      temperature: Number(newTemp),
      measuredAt: new Date(newDateTime).toISOString(),
      memo: newMemo,
      recordedBy: currentUser,
      createdAt: new Date().toISOString(),
    });
    setNewTemp("");
    setNewMemo("");
    // 日時は次回も今を表示するので更新
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const hh = String(now.getHours()).padStart(2, "0");
    const mi = String(now.getMinutes()).padStart(2, "0");
    setNewDateTime(`${yyyy}-${mm}-${dd}T${hh}:${mi}`);
  };

  const deleteRecord = async (id) => {
    if (window.confirm("この記録を削除しますか?")) {
      await deleteDoc(doc(db, "temperatures", id));
    }
  };

  // 🚨 警告判定
  const getTempStatus = (temp) => {
    if (temp >= 38.0) return { level: "high", emoji: "🔥", text: "高熱", colorClass: darkMode ? "text-red-300 bg-red-900/40" : "text-red-700 bg-red-50" };
    if (temp >= 37.5) return { level: "fever", emoji: "🌡️", text: "発熱", colorClass: darkMode ? "text-orange-300 bg-orange-900/40" : "text-orange-700 bg-orange-50" };
    if (temp >= 37.0) return { level: "warm", emoji: "🌤️", text: "微熱", colorClass: darkMode ? "text-amber-300 bg-amber-900/40" : "text-amber-700 bg-amber-50" };
    if (temp >= 36.0) return { level: "normal", emoji: "✅", text: "平熱", colorClass: darkMode ? "text-green-300 bg-green-900/40" : "text-green-700 bg-green-50" };
    return { level: "low", emoji: "❄️", text: "低体温", colorClass: darkMode ? "text-blue-300 bg-blue-900/40" : "text-blue-700 bg-blue-50" };
  };

  const getUserEmoji = (user) => {
    if (user === "龍由" || user === "たっちゃん" || user === "主人") return "👨";
    return "👩";
  };

  const formatDateTime = (iso) => {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  // 最新の体温
  const latestRecord = records[0];
  const latestStatus = latestRecord ? getTempStatus(latestRecord.temperature) : null;

  return (
    <div className="max-w-md mx-auto">
      <header className="text-center mb-6">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full shadow-md mb-3 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <Thermometer className="w-8 h-8 text-rose-400" strokeWidth={1.5} />
        </div>
        <h1 className={`text-2xl font-bold mb-1 ${darkMode ? "text-gray-100" : "text-gray-800"}`}>
          体温記録
        </h1>
        <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          発熱の傾向を把握しましょう 🌡️
        </p>
      </header>

      {/* 🚨 最新体温の警告 */}
      {latestRecord && latestStatus && (latestStatus.level === "high" || latestStatus.level === "fever") && (
        <div className={`rounded-2xl p-4 mb-5 border-2 ${latestStatus.level === "high"
          ? (darkMode ? "bg-red-900/40 border-red-500" : "bg-red-50 border-red-400")
          : (darkMode ? "bg-orange-900/40 border-orange-500" : "bg-orange-50 border-orange-400")} ${latestStatus.level === "high" ? "animate-pulse" : ""}`}>
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className={`w-5 h-5 ${latestStatus.level === "high"
              ? (darkMode ? "text-red-300" : "text-red-600")
              : (darkMode ? "text-orange-300" : "text-orange-600")}`} />
            <p className={`text-sm font-bold ${latestStatus.level === "high"
              ? (darkMode ? "text-red-300" : "text-red-700")
              : (darkMode ? "text-orange-300" : "text-orange-700")}`}>
              {latestStatus.level === "high" ? "高熱です" : "発熱しています"}
            </p>
          </div>
          <p className={`text-xs ${latestStatus.level === "high"
            ? (darkMode ? "text-red-200" : "text-red-600")
            : (darkMode ? "text-orange-200" : "text-orange-600")}`}>
            {latestStatus.level === "high"
              ? "至急、医療機関に連絡してください。生後3ヶ月未満の発熱は緊急です。"
              : "経過を観察し、必要に応じて医療機関へ。生後3ヶ月未満は早めに受診を。"}
          </p>
        </div>
      )}

      {/* ⏱️ 入力フォーム */}
      <div className={`rounded-2xl shadow-sm p-4 mb-5 border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-rose-100"}`}>
        <h2 className={`text-sm font-semibold mb-3 flex items-center gap-1 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
          <Plus className="w-4 h-4 text-rose-400" />
          体温を記録
        </h2>
        <div className="space-y-2">
          <div>
            <label className={`text-xs block mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>体温(℃)</label>
            <input
              type="number"
              step="0.1"
              value={newTemp}
              onChange={(e) => setNewTemp(e.target.value)}
              placeholder="例: 36.5"
              className={`w-full px-3 py-2 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-rose-200 ${darkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "border-gray-200"}`}
            />
          </div>
          <div>
            <label className={`text-xs block mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>測定日時</label>
          <input
            type="datetime-local"
            value={newDateTime}
            onChange={(e) => setNewDateTime(e.target.value)}
            className={`block w-full min-w-0 box-border appearance-none px-3 py-2 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-rose-200 ${darkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "border-gray-200"}`}
          />
          </div>
          <div>
            <label className={`text-xs block mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>メモ(任意)</label>
            <input
              type="text"
              value={newMemo}
              onChange={(e) => setNewMemo(e.target.value)}
              placeholder="例: 機嫌よし、咳あり、解熱剤使用"
              className={`w-full px-3 py-2 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-rose-200 ${darkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "border-gray-200"}`}
            />
          </div>
          <button
            onClick={addRecord}
            className="w-full py-2 bg-gradient-to-r from-rose-300 to-pink-300 text-white rounded-lg text-sm font-semibold shadow-sm active:scale-95 transition-all"
          >
            記録する
          </button>
        </div>
      </div>

      {/* 📋 履歴 */}
      {records.length === 0 ? (
        <div className={`rounded-2xl shadow-sm p-8 text-center border mb-32 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-pink-100"}`}>
          <p className="text-3xl mb-2">🌡️</p>
          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            まだ記録がありません
          </p>
        </div>
      ) : (
        <div className="mb-32">
          <h2 className={`text-sm font-bold px-2 mb-2 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
            📋 履歴 <span className={`text-xs font-normal ${darkMode ? "text-gray-500" : "text-gray-400"}`}>({records.length}件)</span>
          </h2>
          <div className="space-y-2">
            {records.map((rec) => {
              const status = getTempStatus(rec.temperature);
              return (
                <div
                  key={rec.id}
                  className={`rounded-xl p-3 border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-pink-100"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl flex-shrink-0">{status.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className={`text-xl font-bold ${darkMode ? "text-gray-100" : "text-gray-800"}`}>
                          {rec.temperature.toFixed(1)}℃
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${status.colorClass}`}>
                          {status.text}
                        </span>
                      </div>
                      <p className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        {formatDateTime(rec.measuredAt)}
                      </p>
                      {rec.memo && (
                        <p className={`text-xs mt-0.5 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                          📝 {rec.memo}
                        </p>
                      )}
                      {rec.recordedBy && (
                        <p className={`text-xs mt-0.5 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                          {getUserEmoji(rec.recordedBy)} {rec.recordedBy}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteRecord(rec.id)}
                      className={`flex-shrink-0 p-2 rounded-lg transition-all ${darkMode ? "text-gray-500 hover:text-rose-400 hover:bg-gray-700" : "text-gray-300 hover:text-rose-400 hover:bg-rose-50"}`}
                      aria-label="削除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
