// ==========================================
// 👶 おむつ交換記録ページ(詳細記録対応版)
// ==========================================
import { useState, useEffect } from "react";
import {
  Droplet,
  Trash2,
  Clock,
  Calendar,
  ChevronDown,
  ChevronUp,
  FileText,
  X,
} from "lucide-react";

import { db } from "./firebase";
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";

export default function DiaperLog({ currentUser, darkMode }) {
  const [logs, setLogs] = useState([]);
  const [showOldLogs, setShowOldLogs] = useState(false);
  // 📝 詳細編集中のログID
  const [editingLogId, setEditingLogId] = useState(null);

  useEffect(() => {
    const logsRef = collection(db, "diaperLogs");
    const q = query(logsRef, orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const firestoreLogs = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setLogs(firestoreLogs);
    });
    return () => unsubscribe();
  }, []);

  const addLog = async (type) => {
    await addDoc(collection(db, "diaperLogs"), {
      type: type,
      timestamp: new Date().toISOString(),
      recordedBy: currentUser,
      // 詳細フィールドは空で初期化
      poopColor: "",
      poopSoftness: "",
      poopAmount: "",
      memo: "",
    });
  };

  const deleteLog = async (id) => {
    if (window.confirm("この記録を削除しますか?")) {
      await deleteDoc(doc(db, "diaperLogs", id));
    }
  };

  // 📝 詳細を更新
  const updateLogDetail = async (id, field, value) => {
    await updateDoc(doc(db, "diaperLogs", id), { [field]: value });
  };

  const typeStyles = {
    pee: {
      emoji: "💧",
      label: "おしっこ",
      bg: darkMode ? "bg-yellow-900/30" : "bg-yellow-50",
      border: darkMode ? "border-yellow-700" : "border-yellow-200",
      text: darkMode ? "text-yellow-300" : "text-yellow-700",
      btn: "from-yellow-300 to-amber-300",
    },
    poop: {
      emoji: "💩",
      label: "うんち",
      bg: darkMode ? "bg-orange-900/30" : "bg-orange-50",
      border: darkMode ? "border-orange-700" : "border-orange-200",
      text: darkMode ? "text-orange-300" : "text-orange-700",
      btn: "from-orange-300 to-amber-400",
    },
    both: {
      emoji: "🌀",
      label: "両方",
      bg: darkMode ? "bg-purple-900/30" : "bg-purple-50",
      border: darkMode ? "border-purple-700" : "border-purple-200",
      text: darkMode ? "text-purple-300" : "text-purple-700",
      btn: "from-purple-300 to-pink-300",
    },
  };

  // 💩 うんちの色オプション
  const poopColors = [
    { value: "黄色", emoji: "🟡", desc: "黄色" },
    { value: "茶色", emoji: "🟤", desc: "茶色" },
    { value: "濃い茶色", emoji: "🌰", desc: "濃い茶色" },
    { value: "緑っぽい", emoji: "🟢", desc: "緑っぽい" },
    { value: "黒い", emoji: "⚫", desc: "黒い" },
    { value: "赤い", emoji: "🔴", desc: "赤い⚠️" },
  ];

  // 💩 うんちの柔らかさオプション
  const poopSoftness = [
    { value: "水っぽい", emoji: "💦", desc: "水っぽい" },
    { value: "ゆるめ", emoji: "🌊", desc: "ゆるめ" },
    { value: "普通", emoji: "🟫", desc: "普通" },
    { value: "やや硬い", emoji: "🧱", desc: "やや硬い" },
    { value: "コロコロ", emoji: "⚪", desc: "コロコロ" },
  ];

  // 💩 うんちの量オプション
  const poopAmounts = [
    { value: "少なめ", emoji: "🤏", desc: "少なめ" },
    { value: "普通", emoji: "👌", desc: "普通" },
    { value: "多め", emoji: "📈", desc: "多め" },
  ];

  const getUserEmoji = (user) => {
    if (user === "龍由" || user === "たっちゃん" || user === "主人")
      return "👨";
    return "👩";
  };

  const isToday = (isoString) => {
    const d = new Date(isoString);
    const today = new Date();
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  };

  const formatTime = (isoString) => {
    const d = new Date(isoString);
    return `${String(d.getHours()).padStart(2, "0")}:${String(
      d.getMinutes()
    ).padStart(2, "0")}`;
  };

  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  };

  const getElapsedTime = (isoString) => {
    const past = new Date(isoString);
    const now = new Date();
    const diffMs = now - past;
    const diffMin = Math.floor(diffMs / (1000 * 60));
    if (diffMin < 1) return "たった今";
    if (diffMin < 60) return `${diffMin}分前`;
    const hours = Math.floor(diffMin / 60);
    const mins = diffMin % 60;
    if (hours < 24) return `${hours}時間${mins > 0 ? mins + "分" : ""}前`;
    const days = Math.floor(hours / 24);
    return `${days}日前`;
  };

  const todayLogs = logs.filter((log) => isToday(log.timestamp));
  const oldLogs = logs.filter((log) => !isToday(log.timestamp));
  const lastLog = logs[0];
  const todayPeeCount = todayLogs.filter((l) => l.type === "pee").length;
  const todayPoopCount = todayLogs.filter((l) => l.type === "poop").length;
  const todayBothCount = todayLogs.filter((l) => l.type === "both").length;
  const todayTotal = todayLogs.length;

  // 📝 詳細編集パネルのレンダリング
  const renderDetailEditor = (log) => {
    // うんちの詳細(うんち or 両方の時のみ表示)
    const showPoopDetails = log.type === "poop" || log.type === "both";

    return (
      <div
        className={`mt-3 pt-3 border-t space-y-3 ${
          darkMode ? "border-gray-700" : "border-gray-200"
        }`}
      >
        {showPoopDetails && (
          <>
            {/* 💩 色 */}
            <div>
              <label
                className={`text-xs font-semibold block mb-1.5 ${
                  darkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                💩 色
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {poopColors.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() =>
                      updateLogDetail(
                        log.id,
                        "poopColor",
                        log.poopColor === opt.value ? "" : opt.value
                      )
                    }
                    className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      log.poopColor === opt.value
                        ? "bg-gradient-to-r from-orange-300 to-amber-400 text-white shadow-sm"
                        : darkMode
                        ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <span className="text-base mr-1">{opt.emoji}</span>
                    {opt.desc}
                  </button>
                ))}
              </div>
            </div>

            {/* 💩 柔らかさ */}
            <div>
              <label
                className={`text-xs font-semibold block mb-1.5 ${
                  darkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                🤏 柔らかさ
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {poopSoftness.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() =>
                      updateLogDetail(
                        log.id,
                        "poopSoftness",
                        log.poopSoftness === opt.value ? "" : opt.value
                      )
                    }
                    className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      log.poopSoftness === opt.value
                        ? "bg-gradient-to-r from-orange-300 to-amber-400 text-white shadow-sm"
                        : darkMode
                        ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <span className="text-base mr-1">{opt.emoji}</span>
                    {opt.desc}
                  </button>
                ))}
              </div>
            </div>

            {/* 💩 量 */}
            <div>
              <label
                className={`text-xs font-semibold block mb-1.5 ${
                  darkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                📏 量
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {poopAmounts.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() =>
                      updateLogDetail(
                        log.id,
                        "poopAmount",
                        log.poopAmount === opt.value ? "" : opt.value
                      )
                    }
                    className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      log.poopAmount === opt.value
                        ? "bg-gradient-to-r from-orange-300 to-amber-400 text-white shadow-sm"
                        : darkMode
                        ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <span className="text-base mr-1">{opt.emoji}</span>
                    {opt.desc}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* 📝 自由メモ(全タイプで表示) */}
        <div>
          <label
            className={`text-xs font-semibold block mb-1.5 ${
              darkMode ? "text-gray-300" : "text-gray-600"
            }`}
          >
            📝 メモ(自由記入)
          </label>
          <textarea
            value={log.memo || ""}
            onChange={(e) => updateLogDetail(log.id, "memo", e.target.value)}
            placeholder={
              log.type === "pee"
                ? "色や量、気になったこと…"
                : "気になったこと、機嫌など…"
            }
            rows={2}
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 resize-none ${
              darkMode
                ? "bg-gray-700 border-gray-600 text-gray-100"
                : "border-gray-200"
            }`}
          />
        </div>

        {/* 閉じるボタン */}
        <button
          onClick={() => setEditingLogId(null)}
          className={`w-full py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
            darkMode
              ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <X className="w-3 h-3" />
          閉じる
        </button>
      </div>
    );
  };

  // 🏷️ 詳細サマリ(編集していない時に表示する詳細情報)
  const renderDetailSummary = (log) => {
    const details = [];
    if (log.poopColor) details.push(log.poopColor);
    if (log.poopSoftness) details.push(log.poopSoftness);
    if (log.poopAmount) details.push(`量:${log.poopAmount}`);

    if (details.length === 0 && !log.memo) return null;

    return (
      <div className="flex items-center gap-2 mt-1 flex-wrap">
        {details.length > 0 && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              darkMode
                ? "bg-gray-700 text-gray-300"
                : "bg-white/70 text-gray-600"
            }`}
          >
            {details.join(" / ")}
          </span>
        )}
        {log.memo && (
          <span
            className={`inline-flex items-center gap-0.5 text-xs ${
              darkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            <FileText className="w-3 h-3" />
            メモあり
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto">
      <header className="text-center mb-6">
        <div
          className={`inline-flex items-center justify-center w-16 h-16 rounded-full shadow-md mb-3 ${
            darkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          <Droplet className="w-8 h-8 text-purple-400" strokeWidth={1.5} />
        </div>
        <h1
          className={`text-2xl font-bold mb-1 ${
            darkMode ? "text-gray-100" : "text-gray-800"
          }`}
        >
          おむつ交換記録
        </h1>
        <p
          className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}
        >
          ワンタップ記録 → 詳細は後から ✨
        </p>
      </header>

      {lastLog && (
        <div
          className={`rounded-2xl shadow-sm p-5 mb-5 border text-center ${
            darkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-purple-100"
          }`}
        >
          <div
            className={`flex items-center justify-center gap-1 text-xs mb-1 ${
              darkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            <Clock className="w-3 h-3" />
            前回から
          </div>
          <p className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            {getElapsedTime(lastLog.timestamp)}
          </p>
          <p
            className={`text-xs mt-1 ${
              darkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            最終記録: {formatTime(lastLog.timestamp)} (
            {typeStyles[lastLog.type]?.emoji} {typeStyles[lastLog.type]?.label})
          </p>
        </div>
      )}

      <div
        className={`rounded-2xl shadow-sm p-5 mb-5 border ${
          darkMode
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-purple-100"
        }`}
      >
        <h2
          className={`text-sm font-semibold mb-3 flex items-center gap-1 ${
            darkMode ? "text-gray-200" : "text-gray-700"
          }`}
        >
          <Calendar className="w-4 h-4 text-purple-400" />
          今日の記録
        </h2>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div
            className={`rounded-xl p-2 ${
              darkMode ? "bg-yellow-900/30" : "bg-yellow-50"
            }`}
          >
            <p className="text-2xl">💧</p>
            <p
              className={`text-xs ${
                darkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              おしっこ
            </p>
            <p
              className={`text-lg font-bold ${
                darkMode ? "text-yellow-300" : "text-yellow-700"
              }`}
            >
              {todayPeeCount}
            </p>
          </div>
          <div
            className={`rounded-xl p-2 ${
              darkMode ? "bg-orange-900/30" : "bg-orange-50"
            }`}
          >
            <p className="text-2xl">💩</p>
            <p
              className={`text-xs ${
                darkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              うんち
            </p>
            <p
              className={`text-lg font-bold ${
                darkMode ? "text-orange-300" : "text-orange-700"
              }`}
            >
              {todayPoopCount}
            </p>
          </div>
          <div
            className={`rounded-xl p-2 ${
              darkMode ? "bg-purple-900/30" : "bg-purple-50"
            }`}
          >
            <p className="text-2xl">🌀</p>
            <p
              className={`text-xs ${
                darkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              両方
            </p>
            <p
              className={`text-lg font-bold ${
                darkMode ? "text-purple-300" : "text-purple-700"
              }`}
            >
              {todayBothCount}
            </p>
          </div>
          <div
            className={`rounded-xl p-2 ${
              darkMode
                ? "bg-gradient-to-br from-pink-900/30 to-purple-900/30"
                : "bg-gradient-to-br from-pink-50 to-purple-50"
            }`}
          >
            <p className="text-2xl">📊</p>
            <p
              className={`text-xs ${
                darkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              合計
            </p>
            <p
              className={`text-lg font-bold ${
                darkMode ? "text-pink-300" : "text-pink-700"
              }`}
            >
              {todayTotal}
            </p>
          </div>
        </div>
      </div>

      <div
        className={`rounded-2xl shadow-sm p-4 mb-5 border ${
          darkMode
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-purple-100"
        }`}
      >
        <h2
          className={`text-sm font-semibold mb-3 ${
            darkMode ? "text-gray-200" : "text-gray-700"
          }`}
        >
          今、おむつ替えた? 👶
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(typeStyles).map(([type, style]) => (
            <button
              key={type}
              onClick={() => addLog(type)}
              className={`p-4 bg-gradient-to-br ${style.btn} text-white rounded-xl font-semibold text-sm hover:shadow-md transition-all active:scale-95`}
            >
              <div className="text-3xl mb-1">{style.emoji}</div>
              <div className="text-xs">{style.label}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5">
        <h2
          className={`text-sm font-bold mb-2 px-2 flex items-center gap-1 ${
            darkMode ? "text-gray-200" : "text-gray-700"
          }`}
        >
          <Calendar className="w-4 h-4 text-purple-400" />
          今日の履歴
          <span
            className={`text-xs font-normal ${
              darkMode ? "text-gray-500" : "text-gray-400"
            }`}
          >
            ({todayLogs.length}件)
          </span>
        </h2>
        {todayLogs.length === 0 ? (
          <div
            className={`rounded-2xl shadow-sm p-6 text-center border ${
              darkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-purple-100"
            }`}
          >
            <p className="text-3xl mb-2">📝</p>
            <p
              className={`text-sm ${
                darkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              まだ今日の記録はありません
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {todayLogs.map((log) => {
              const style = typeStyles[log.type] || typeStyles.pee;
              const isEditing = editingLogId === log.id;
              return (
                <div
                  key={log.id}
                  className={`rounded-xl p-3 border ${style.bg} ${style.border}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl flex-shrink-0">{style.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <p className={`text-base font-bold ${style.text}`}>
                          {formatTime(log.timestamp)}
                        </p>
                        <p
                          className={`text-sm ${
                            darkMode ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {style.label}
                        </p>
                      </div>
                      {log.recordedBy && (
                        <p
                          className={`text-xs mt-0.5 ${
                            darkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          {getUserEmoji(log.recordedBy)} {log.recordedBy} が記録
                        </p>
                      )}
                      {!isEditing && renderDetailSummary(log)}
                    </div>
                    {/* 📝 詳細ボタン */}
                    <button
                      onClick={() => setEditingLogId(isEditing ? null : log.id)}
                      className={`flex-shrink-0 p-2 rounded-lg transition-all ${
                        isEditing
                          ? darkMode
                            ? "bg-purple-900/40 text-purple-300"
                            : "bg-purple-100 text-purple-600"
                          : darkMode
                          ? "text-gray-400 hover:text-purple-400 hover:bg-gray-700"
                          : "text-gray-400 hover:text-purple-500 hover:bg-purple-50"
                      }`}
                      aria-label="詳細"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteLog(log.id)}
                      className={`flex-shrink-0 p-2 rounded-lg transition-all ${
                        darkMode
                          ? "text-gray-500 hover:text-rose-400 hover:bg-gray-700"
                          : "text-gray-300 hover:text-rose-400 hover:bg-rose-50"
                      }`}
                      aria-label="削除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 📝 詳細編集パネル */}
                  {isEditing && renderDetailEditor(log)}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {oldLogs.length > 0 && (
        <div className="mb-32">
          <button
            onClick={() => setShowOldLogs(!showOldLogs)}
            className={`w-full rounded-2xl shadow-sm p-3 border flex items-center justify-between transition-all ${
              darkMode
                ? "bg-gray-800 border-gray-700 hover:bg-gray-700"
                : "bg-white border-purple-100 hover:bg-gray-50"
            }`}
          >
            <span
              className={`text-sm font-bold flex items-center gap-1 ${
                darkMode ? "text-gray-200" : "text-gray-700"
              }`}
            >
              <Calendar
                className={`w-4 h-4 ${
                  darkMode ? "text-gray-500" : "text-gray-400"
                }`}
              />
              過去の履歴
              <span
                className={`text-xs font-normal ${
                  darkMode ? "text-gray-500" : "text-gray-400"
                }`}
              >
                ({oldLogs.length}件)
              </span>
            </span>
            {showOldLogs ? (
              <ChevronUp
                className={`w-4 h-4 ${
                  darkMode ? "text-gray-500" : "text-gray-400"
                }`}
              />
            ) : (
              <ChevronDown
                className={`w-4 h-4 ${
                  darkMode ? "text-gray-500" : "text-gray-400"
                }`}
              />
            )}
          </button>

          {showOldLogs && (
            <div className="space-y-2 mt-2">
              {oldLogs.map((log) => {
                const style = typeStyles[log.type] || typeStyles.pee;
                const isEditing = editingLogId === log.id;
                return (
                  <div
                    key={log.id}
                    className={`rounded-xl p-3 border ${style.bg} ${style.border} opacity-90`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-xl flex-shrink-0">{style.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <p
                            className={`text-xs ${
                              darkMode ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            {formatDate(log.timestamp)}
                          </p>
                          <p className={`text-sm font-bold ${style.text}`}>
                            {formatTime(log.timestamp)}
                          </p>
                          <p
                            className={`text-xs ${
                              darkMode ? "text-gray-300" : "text-gray-600"
                            }`}
                          >
                            {style.label}
                          </p>
                        </div>
                        {log.recordedBy && (
                          <p
                            className={`text-xs mt-0.5 ${
                              darkMode ? "text-gray-500" : "text-gray-400"
                            }`}
                          >
                            {getUserEmoji(log.recordedBy)} {log.recordedBy}
                          </p>
                        )}
                        {!isEditing && renderDetailSummary(log)}
                      </div>
                      <button
                        onClick={() =>
                          setEditingLogId(isEditing ? null : log.id)
                        }
                        className={`flex-shrink-0 p-2 rounded-lg transition-all ${
                          isEditing
                            ? darkMode
                              ? "bg-purple-900/40 text-purple-300"
                              : "bg-purple-100 text-purple-600"
                            : darkMode
                            ? "text-gray-400 hover:text-purple-400 hover:bg-gray-700"
                            : "text-gray-400 hover:text-purple-500 hover:bg-purple-50"
                        }`}
                        aria-label="詳細"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteLog(log.id)}
                        className={`flex-shrink-0 p-2 rounded-lg transition-all ${
                          darkMode
                            ? "text-gray-500 hover:text-rose-400 hover:bg-gray-700"
                            : "text-gray-300 hover:text-rose-400 hover:bg-rose-50"
                        }`}
                        aria-label="削除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {isEditing && renderDetailEditor(log)}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
