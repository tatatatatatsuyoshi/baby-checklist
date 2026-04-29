// ==========================================
// 🚨 陣痛タイマーページ
// ==========================================
import { useState, useEffect } from "react";
import { Activity, Trash2, Play, Square, AlertCircle, Heart } from "lucide-react";

import { db } from "./firebase";
import {
  collection, onSnapshot, addDoc, deleteDoc, updateDoc,
  doc, query, orderBy,
} from "firebase/firestore";

export default function LaborTimer({ currentUser, darkMode }) {
  // 📋 陣痛記録一覧
  const [contractions, setContractions] = useState([]);
  // ⏱️ 経過時間表示用(現在進行中の陣痛のリアルタイム秒数)
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // 🔥 陣痛記録のリアルタイム監視
  useEffect(() => {
    const ref = collection(db, "contractions");
    const q = query(ref, orderBy("startTime", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setContractions(records);
    });
    return () => unsubscribe();
  }, []);

  // ⏱️ 進行中の陣痛がある場合、毎秒経過時間を更新
  const ongoingContraction = contractions.find((c) => !c.endTime);

  useEffect(() => {
    if (!ongoingContraction) {
      setElapsedSeconds(0);
      return;
    }
    // 1秒ごとに更新
    const interval = setInterval(() => {
      const start = new Date(ongoingContraction.startTime);
      const now = new Date();
      setElapsedSeconds(Math.floor((now - start) / 1000));
    }, 1000);

    // 初回即時更新
    const start = new Date(ongoingContraction.startTime);
    const now = new Date();
    setElapsedSeconds(Math.floor((now - start) / 1000));

    return () => clearInterval(interval);
  }, [ongoingContraction]);

  // ▶️ 陣痛開始
  const startContraction = async () => {
    await addDoc(collection(db, "contractions"), {
      startTime: new Date().toISOString(),
      endTime: null,
      durationSeconds: null,
      recordedBy: currentUser,
    });
  };

  // ⏹️ 陣痛終了
  const endContraction = async () => {
    if (!ongoingContraction) return;
    const start = new Date(ongoingContraction.startTime);
    const end = new Date();
    const duration = Math.floor((end - start) / 1000);
    await updateDoc(doc(db, "contractions", ongoingContraction.id), {
      endTime: end.toISOString(),
      durationSeconds: duration,
    });
  };

  // 🗑️ 削除
  const deleteContraction = async (id) => {
    if (window.confirm("この記録を削除しますか?")) {
      await deleteDoc(doc(db, "contractions", id));
    }
  };

  // 🗑️ 全削除
  const clearAllContractions = async () => {
    if (window.confirm("すべての陣痛記録を削除しますか?\n（※元に戻せません）")) {
      for (const c of contractions) {
        await deleteDoc(doc(db, "contractions", c.id));
      }
    }
  };

  // 👤 ユーザーアイコン
  const getUserEmoji = (user) => {
    if (user === "龍由" || user === "たっちゃん" || user === "主人") return "👨";
    return "👩";
  };

  // ⏱️ 秒数を「MM:SS」形式に
  const formatDuration = (seconds) => {
    if (seconds == null || isNaN(seconds)) return "--:--";
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  // ⏰ 時刻フォーマット(HH:MM)
  const formatTime = (isoString) => {
    if (!isoString) return "";
    const d = new Date(isoString);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  // 📅 日付フォーマット(M/D)
  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  // 📊 完了済みの陣痛だけ抽出
  const completedContractions = contractions.filter((c) => c.endTime);

  // 📊 直近の陣痛(完了済みの最新1件)
  const lastCompleted = completedContractions[0];

  // 📊 直近10件の平均間隔を計算(完了済みベース)
  const calculateAverageInterval = () => {
    if (completedContractions.length < 2) return null;
    const recent = completedContractions.slice(0, 10);
    const intervals = [];
    for (let i = 0; i < recent.length - 1; i++) {
      const current = new Date(recent[i].startTime);
      const previous = new Date(recent[i + 1].startTime);
      intervals.push((current - previous) / 1000);
    }
    if (intervals.length === 0) return null;
    const avgSec = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    return Math.floor(avgSec);
  };

  const avgIntervalSeconds = calculateAverageInterval();
  const avgIntervalMinutes = avgIntervalSeconds ? Math.floor(avgIntervalSeconds / 60) : null;

  // 🚨 病院連絡の警告判定
  const isUrgent = avgIntervalMinutes !== null && avgIntervalMinutes <= 10;
  const isWarning = avgIntervalMinutes !== null && avgIntervalMinutes <= 15 && avgIntervalMinutes > 10;

  // 🕒 各陣痛の間隔を計算(前の記録との差)
  const getIntervalFromPrevious = (currentIndex) => {
    if (currentIndex >= contractions.length - 1) return null;
    const current = new Date(contractions[currentIndex].startTime);
    const previous = new Date(contractions[currentIndex + 1].startTime);
    return Math.floor((current - previous) / 1000);
  };

  return (
    <div className="max-w-md mx-auto">
      {/* ヘッダー */}
      <header className="text-center mb-6">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full shadow-md mb-3 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <Activity className="w-8 h-8 text-rose-400" strokeWidth={1.5} />
        </div>
        <h1 className={`text-2xl font-bold mb-1 ${darkMode ? "text-gray-100" : "text-gray-800"}`}>
          陣痛タイマー
        </h1>
        <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          ボタンで記録、夫婦でリアルタイム共有 💕
        </p>
      </header>

      {/* 🚨 警告バナー(陣痛間隔が短い時) */}
      {isUrgent && (
        <div className={`rounded-2xl p-4 mb-5 border-2 ${darkMode ? "bg-red-900/40 border-red-500" : "bg-red-50 border-red-400"} animate-pulse`}>
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className={`w-5 h-5 ${darkMode ? "text-red-300" : "text-red-600"}`} />
            <p className={`text-sm font-bold ${darkMode ? "text-red-300" : "text-red-700"}`}>
              病院に連絡しましょう
            </p>
          </div>
          <p className={`text-xs ${darkMode ? "text-red-200" : "text-red-600"}`}>
            陣痛の間隔が10分以下になっています。担当の産院に連絡してください。
          </p>
        </div>
      )}
      {isWarning && (
        <div className={`rounded-2xl p-4 mb-5 border-2 ${darkMode ? "bg-amber-900/40 border-amber-500" : "bg-amber-50 border-amber-400"}`}>
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className={`w-5 h-5 ${darkMode ? "text-amber-300" : "text-amber-600"}`} />
            <p className={`text-sm font-bold ${darkMode ? "text-amber-300" : "text-amber-700"}`}>
              そろそろ準備を
            </p>
          </div>
          <p className={`text-xs ${darkMode ? "text-amber-200" : "text-amber-600"}`}>
            陣痛の間隔が15分以下になっています。出かける準備をしましょう。
          </p>
        </div>
      )}

      {/* ⏱️ メインタイマー表示 */}
      <div className={`rounded-2xl shadow-sm p-6 mb-5 border text-center ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-rose-100"} ${ongoingContraction ? "ring-4 ring-rose-300 animate-pulse" : ""}`}>
        <div className={`text-xs mb-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          {ongoingContraction ? "🔴 陣痛中" : "⏸️ 待機中"}
        </div>
        <p className={`text-5xl font-bold mb-3 font-mono ${ongoingContraction
          ? "text-rose-500"
          : (darkMode ? "text-gray-300" : "text-gray-700")
        }`}>
          {ongoingContraction ? formatDuration(elapsedSeconds) : (lastCompleted ? formatDuration(lastCompleted.durationSeconds) : "00:00")}
        </p>
        <p className={`text-xs mb-4 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
          {ongoingContraction ? "経過時間" : (lastCompleted ? "前回の継続時間" : "まだ記録がありません")}
        </p>

        {/* 🎯 開始/終了ボタン(トグル式) */}
        {!ongoingContraction ? (
          <button
            onClick={startContraction}
            className="w-full py-4 bg-gradient-to-r from-rose-400 to-pink-500 text-white rounded-2xl font-bold text-lg shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" fill="currentColor" />
            陣痛きた！
          </button>
        ) : (
          <button
            onClick={endContraction}
            className="w-full py-4 bg-gradient-to-r from-purple-400 to-indigo-500 text-white rounded-2xl font-bold text-lg shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Square className="w-5 h-5" fill="currentColor" />
            陣痛おわり
          </button>
        )}
      </div>

      {/* 📊 サマリ */}
      {completedContractions.length > 0 && (
        <div className={`rounded-2xl shadow-sm p-5 mb-5 border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-rose-100"}`}>
          <h2 className={`text-sm font-semibold mb-3 flex items-center gap-1 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
            <Heart className="w-4 h-4 text-rose-400" fill="currentColor" />
            サマリ
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className={`rounded-xl p-3 text-center ${darkMode ? "bg-rose-900/30" : "bg-rose-50"}`}>
              <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>記録回数</p>
              <p className={`text-2xl font-bold ${darkMode ? "text-rose-300" : "text-rose-700"}`}>
                {completedContractions.length}
              </p>
              <p className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>回</p>
            </div>
            <div className={`rounded-xl p-3 text-center ${darkMode ? "bg-purple-900/30" : "bg-purple-50"}`}>
              <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>平均間隔</p>
              <p className={`text-2xl font-bold ${darkMode ? "text-purple-300" : "text-purple-700"}`}>
                {avgIntervalMinutes !== null ? avgIntervalMinutes : "-"}
              </p>
              <p className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>分</p>
            </div>
          </div>
        </div>
      )}

      {/* 📋 履歴 */}
      {contractions.length > 0 && (
        <div className="mb-32">
          <div className="flex items-center justify-between mb-2 px-2">
            <h2 className={`text-sm font-bold flex items-center gap-1 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
              📋 履歴
              <span className={`text-xs font-normal ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                ({contractions.length}件)
              </span>
            </h2>
            <button
              onClick={clearAllContractions}
              className={`text-xs px-2 py-1 rounded transition-all ${darkMode ? "text-gray-500 hover:text-rose-400" : "text-gray-400 hover:text-rose-500"}`}
            >
              全削除
            </button>
          </div>
          <div className="space-y-2">
            {contractions.map((c, index) => {
              const interval = getIntervalFromPrevious(index);
              const intervalMin = interval ? Math.floor(interval / 60) : null;
              const intervalSec = interval ? interval % 60 : null;
              const isOngoing = !c.endTime;

              return (
                <div
                  key={c.id}
                  className={`rounded-xl p-3 border ${
                    isOngoing
                      ? (darkMode ? "bg-rose-900/30 border-rose-500" : "bg-rose-50 border-rose-300")
                      : (darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-pink-100")
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-xl flex-shrink-0">
                      {isOngoing ? "🔴" : "✅"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                          {formatDate(c.startTime)}
                        </p>
                        <p className={`text-sm font-bold font-mono ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                          {formatTime(c.startTime)}
                          {c.endTime && ` 〜 ${formatTime(c.endTime)}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {c.durationSeconds != null && (
                          <span className={`text-xs ${darkMode ? "text-rose-300" : "text-rose-600"}`}>
                            ⏱️ 継続 {formatDuration(c.durationSeconds)}
                          </span>
                        )}
                        {interval !== null && (
                          <span className={`text-xs ${darkMode ? "text-purple-300" : "text-purple-600"}`}>
                            ↕️ 間隔 {intervalMin}分{intervalSec > 0 ? intervalSec + "秒" : ""}
                          </span>
                        )}
                        {isOngoing && (
                          <span className={`text-xs font-bold ${darkMode ? "text-rose-300" : "text-rose-600"} animate-pulse`}>
                            進行中...
                          </span>
                        )}
                      </div>
                      {c.recordedBy && (
                        <p className={`text-xs mt-0.5 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                          {getUserEmoji(c.recordedBy)} {c.recordedBy}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteContraction(c.id)}
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

      {/* 📝 使い方ガイド(履歴がない時) */}
      {contractions.length === 0 && (
        <div className={`rounded-2xl shadow-sm p-5 mb-5 border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-rose-100"}`}>
          <h2 className={`text-sm font-bold mb-3 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
            💡 使い方
          </h2>
          <ol className={`text-xs space-y-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            <li>1. 陣痛がきたら「陣痛きた！」をタップ</li>
            <li>2. 陣痛が終わったら「陣痛おわり」をタップ</li>
            <li>3. 次の陣痛がきたら、また「陣痛きた！」</li>
            <li>4. 平均間隔が10分以下になったら病院へ🏥</li>
          </ol>
          <div className={`mt-3 pt-3 border-t text-xs ${darkMode ? "border-gray-700 text-gray-400" : "border-gray-100 text-gray-500"}`}>
            ※ 個人差があります。担当医の指示を優先してください。
          </div>
        </div>
      )}
    </div>
  );
}
