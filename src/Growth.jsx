// ==========================================
// 📏 成長記録ページ(身長・体重・頭囲)
// ==========================================
import { useState, useEffect } from "react";
import { Ruler, Plus, Trash2, TrendingUp } from "lucide-react";

import { db } from "./firebase";
import {
  collection, onSnapshot, addDoc, deleteDoc,
  doc, query, orderBy,
} from "firebase/firestore";

export default function Growth({ currentUser, darkMode }) {
  const [records, setRecords] = useState([]);
  const [newDate, setNewDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  });
  const [newWeight, setNewWeight] = useState("");
  const [newHeight, setNewHeight] = useState("");
  const [newHead, setNewHead] = useState("");
  const [newMemo, setNewMemo] = useState("");

  // 🔥 リアルタイム監視(日付の古い順)
  useEffect(() => {
    const ref = collection(db, "growthRecords");
    const q = query(ref, orderBy("measuredDate", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setRecords(data);
    });
    return () => unsubscribe();
  }, []);

  const addRecord = async () => {
    if (!newWeight && !newHeight && !newHead) {
      alert("少なくとも1つは入力してください");
      return;
    }
    await addDoc(collection(db, "growthRecords"), {
      measuredDate: newDate,
      weight: newWeight ? Number(newWeight) : null,
      height: newHeight ? Number(newHeight) : null,
      headCircumference: newHead ? Number(newHead) : null,
      memo: newMemo,
      recordedBy: currentUser,
      createdAt: new Date().toISOString(),
    });
    setNewWeight("");
    setNewHeight("");
    setNewHead("");
    setNewMemo("");
  };

  const deleteRecord = async (id) => {
    if (window.confirm("この記録を削除しますか?")) {
      await deleteDoc(doc(db, "growthRecords", id));
    }
  };

  const getUserEmoji = (user) => {
    if (user === "龍由" || user === "たっちゃん" || user === "主人") return "👨";
    return "👩";
  };

  // 📊 簡易グラフのための最大値計算
  const calculateMax = (key) => {
    const vals = records.map((r) => r[key]).filter((v) => v != null);
    return vals.length > 0 ? Math.max(...vals) : 0;
  };
  const calculateMin = (key) => {
    const vals = records.map((r) => r[key]).filter((v) => v != null);
    return vals.length > 0 ? Math.min(...vals) : 0;
  };

  // 最新の記録
  const latestRecord = records.length > 0 ? records[records.length - 1] : null;
  const firstRecord = records.length > 0 ? records[0] : null;

  // 成長量(最新 - 初回)
  const calculateGrowth = (key) => {
    if (!latestRecord || !firstRecord || latestRecord.id === firstRecord.id) return null;
    const latest = latestRecord[key];
    const first = firstRecord[key];
    if (latest == null || first == null) return null;
    return latest - first;
  };

  // 表示用降順
  const displayRecords = [...records].reverse();

  return (
    <div className="max-w-md mx-auto">
      <header className="text-center mb-6">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full shadow-md mb-3 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <Ruler className="w-8 h-8 text-purple-400" strokeWidth={1.5} />
        </div>
        <h1 className={`text-2xl font-bold mb-1 ${darkMode ? "text-gray-100" : "text-gray-800"}`}>
          成長記録
        </h1>
        <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          赤ちゃんの成長を記録しよう 📏
        </p>
      </header>

      {/* 📊 サマリー */}
      {latestRecord && (
        <div className={`rounded-2xl shadow-sm p-4 mb-5 border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-purple-100"}`}>
          <h2 className={`text-sm font-semibold mb-3 flex items-center gap-1 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
            <TrendingUp className="w-4 h-4 text-purple-400" />
            最新の記録
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: "weight", label: "体重", unit: "g", color: "rose" },
              { key: "height", label: "身長", unit: "cm", color: "blue" },
              { key: "headCircumference", label: "頭囲", unit: "cm", color: "amber" },
            ].map((item) => {
              const val = latestRecord[item.key];
              const growth = calculateGrowth(item.key);
              const colorMap = {
                rose:   { bg: darkMode ? "bg-rose-900/30"   : "bg-rose-50",   text: darkMode ? "text-rose-300"   : "text-rose-700" },
                blue:   { bg: darkMode ? "bg-blue-900/30"   : "bg-blue-50",   text: darkMode ? "text-blue-300"   : "text-blue-700" },
                amber:  { bg: darkMode ? "bg-amber-900/30"  : "bg-amber-50",  text: darkMode ? "text-amber-300"  : "text-amber-700" },
              };
              return (
                <div key={item.key} className={`rounded-xl p-3 text-center ${colorMap[item.color].bg}`}>
                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{item.label}</p>
                  <p className={`text-lg font-bold ${colorMap[item.color].text}`}>
                    {val != null ? val.toLocaleString() : "-"}
                  </p>
                  <p className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{item.unit}</p>
                  {growth != null && growth > 0 && (
                    <p className={`text-xs mt-1 font-semibold ${darkMode ? "text-green-400" : "text-green-600"}`}>
                      +{growth.toLocaleString()}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 📊 簡易グラフ(SVG) */}
      {records.length >= 2 && (
        <div className={`rounded-2xl shadow-sm p-4 mb-5 border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-purple-100"}`}>
          <h2 className={`text-sm font-semibold mb-3 flex items-center gap-1 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
            <TrendingUp className="w-4 h-4 text-purple-400" />
            体重の推移
          </h2>
          {(() => {
            const weightRecords = records.filter((r) => r.weight != null);
            if (weightRecords.length < 2) {
              return <p className={`text-xs text-center py-4 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>体重データが2件以上必要です</p>;
            }
            const maxW = Math.max(...weightRecords.map((r) => r.weight));
            const minW = Math.min(...weightRecords.map((r) => r.weight));
            const range = maxW - minW || 1;
            const width = 320;
            const height = 120;
            const padding = 20;
            const points = weightRecords.map((r, i) => {
              const x = padding + (i * (width - padding * 2)) / (weightRecords.length - 1);
              const y = height - padding - ((r.weight - minW) / range) * (height - padding * 2);
              return `${x},${y}`;
            });
            return (
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
                <polyline
                  points={points.join(" ")}
                  fill="none"
                  stroke={darkMode ? "#fb7185" : "#f43f5e"}
                  strokeWidth="2"
                />
                {points.map((p, i) => {
                  const [x, y] = p.split(",").map(Number);
                  return <circle key={i} cx={x} cy={y} r="3" fill={darkMode ? "#fb7185" : "#f43f5e"} />;
                })}
              </svg>
            );
          })()}
          <p className={`text-xs text-center ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
            最小:{calculateMin("weight")}g 〜 最大:{calculateMax("weight")}g
          </p>
        </div>
      )}

      {/* ⏱️ 入力フォーム */}
      <div className={`rounded-2xl shadow-sm p-4 mb-5 border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-purple-100"}`}>
        <h2 className={`text-sm font-semibold mb-3 flex items-center gap-1 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
          <Plus className="w-4 h-4 text-purple-400" />
          記録を追加
        </h2>
        <div className="space-y-2">
          <div>
            <label className={`text-xs block mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>測定日</label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className={`block w-full min-w-0 box-border appearance-none px-3 py-2 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-purple-200 ${darkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "border-gray-200"}`}
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className={`text-xs block mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>体重(g)</label>
              <input
                type="number"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                placeholder="3200"
                className={`w-full px-2 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 ${darkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "border-gray-200"}`}
              />
            </div>
            <div>
              <label className={`text-xs block mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>身長(cm)</label>
              <input
                type="number"
                step="0.1"
                value={newHeight}
                onChange={(e) => setNewHeight(e.target.value)}
                placeholder="50.0"
                className={`w-full px-2 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 ${darkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "border-gray-200"}`}
              />
            </div>
            <div>
              <label className={`text-xs block mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>頭囲(cm)</label>
              <input
                type="number"
                step="0.1"
                value={newHead}
                onChange={(e) => setNewHead(e.target.value)}
                placeholder="33.0"
                className={`w-full px-2 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 ${darkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "border-gray-200"}`}
              />
            </div>
          </div>
          <div>
            <label className={`text-xs block mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>メモ(任意)</label>
            <input
              type="text"
              value={newMemo}
              onChange={(e) => setNewMemo(e.target.value)}
              placeholder="例: 1ヶ月健診、自宅測定"
              className={`w-full px-3 py-2 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-purple-200 ${darkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "border-gray-200"}`}
            />
          </div>
          <button
            onClick={addRecord}
            className="w-full py-2 bg-gradient-to-r from-purple-300 to-pink-300 text-white rounded-lg text-sm font-semibold shadow-sm active:scale-95 transition-all"
          >
            記録する
          </button>
        </div>
      </div>

      {/* 📋 履歴 */}
      {records.length === 0 ? (
        <div className={`rounded-2xl shadow-sm p-8 text-center border mb-32 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-pink-100"}`}>
          <p className="text-3xl mb-2">📏</p>
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
            {displayRecords.map((rec) => (
              <div
                key={rec.id}
                className={`rounded-xl p-3 border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-purple-100"}`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl flex-shrink-0">👶</div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${darkMode ? "text-gray-100" : "text-gray-800"}`}>
                      {rec.measuredDate}
                    </p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap text-xs">
                      {rec.weight != null && (
                        <span className={darkMode ? "text-rose-300" : "text-rose-600"}>
                          ⚖️ {rec.weight.toLocaleString()}g
                        </span>
                      )}
                      {rec.height != null && (
                        <span className={darkMode ? "text-blue-300" : "text-blue-600"}>
                          📏 {rec.height}cm
                        </span>
                      )}
                      {rec.headCircumference != null && (
                        <span className={darkMode ? "text-amber-300" : "text-amber-600"}>
                          🧠 {rec.headCircumference}cm
                        </span>
                      )}
                    </div>
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
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
