// ==========================================
// 💊 予防接種スケジュールページ
// ==========================================
import { useState, useEffect } from "react";
import { Syringe, Check, X, AlertCircle } from "lucide-react";

import { db } from "./firebase";
import {
  collection, onSnapshot, doc, setDoc, deleteDoc,
} from "firebase/firestore";

// 📅 標準的な予防接種スケジュール(日本の定期接種)
// timing は「生後の月数」
const STANDARD_VACCINES = [
  // 2ヶ月
  { id: "hib-1",       name: "ヒブ(Hib) 1回目",        timing: 2,  category: "定期", color: "rose" },
  { id: "pcv-1",       name: "肺炎球菌 1回目",          timing: 2,  category: "定期", color: "rose" },
  { id: "hepb-1",      name: "B型肝炎 1回目",          timing: 2,  category: "定期", color: "rose" },
  { id: "rota-1",      name: "ロタウイルス 1回目",      timing: 2,  category: "定期", color: "rose" },
  // 3ヶ月
  { id: "hib-2",       name: "ヒブ(Hib) 2回目",        timing: 3,  category: "定期", color: "rose" },
  { id: "pcv-2",       name: "肺炎球菌 2回目",          timing: 3,  category: "定期", color: "rose" },
  { id: "hepb-2",      name: "B型肝炎 2回目",          timing: 3,  category: "定期", color: "rose" },
  { id: "rota-2",      name: "ロタウイルス 2回目",      timing: 3,  category: "定期", color: "rose" },
  { id: "5shu-1",      name: "5種混合 1回目",           timing: 3,  category: "定期", color: "blue" },
  // 4ヶ月
  { id: "hib-3",       name: "ヒブ(Hib) 3回目",        timing: 4,  category: "定期", color: "rose" },
  { id: "pcv-3",       name: "肺炎球菌 3回目",          timing: 4,  category: "定期", color: "rose" },
  { id: "rota-3",      name: "ロタウイルス 3回目",      timing: 4,  category: "定期", color: "rose" },
  { id: "5shu-2",      name: "5種混合 2回目",           timing: 4,  category: "定期", color: "blue" },
  // 5ヶ月
  { id: "5shu-3",      name: "5種混合 3回目",           timing: 5,  category: "定期", color: "blue" },
  { id: "bcg",         name: "BCG",                    timing: 5,  category: "定期", color: "purple" },
  // 7-8ヶ月
  { id: "hepb-3",      name: "B型肝炎 3回目",          timing: 7,  category: "定期", color: "rose" },
  // 12ヶ月
  { id: "mr-1",        name: "MR(麻疹風疹) 1回目",      timing: 12, category: "定期", color: "amber" },
  { id: "varicella-1", name: "水痘 1回目",             timing: 12, category: "定期", color: "amber" },
  { id: "hib-4",       name: "ヒブ(Hib) 4回目",        timing: 12, category: "定期", color: "rose" },
  { id: "pcv-4",       name: "肺炎球菌 4回目",          timing: 12, category: "定期", color: "rose" },
  // 15-18ヶ月
  { id: "varicella-2", name: "水痘 2回目",             timing: 15, category: "定期", color: "amber" },
  { id: "5shu-4",      name: "5種混合 4回目",           timing: 18, category: "定期", color: "blue" },
  // 任意
  { id: "rota-opt",    name: "おたふくかぜ 1回目",       timing: 12, category: "任意", color: "green" },
  { id: "flu-1",       name: "インフルエンザ(秋〜冬)",   timing: 6,  category: "任意", color: "green" },
];

export default function Vaccination({ currentUser, darkMode, dueDate }) {
  // 📋 接種済みの記録(idをキーとした辞書)
  const [records, setRecords] = useState({});

  // 🔥 リアルタイム監視
  useEffect(() => {
    const ref = collection(db, "vaccinations");
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const data = {};
      snapshot.docs.forEach((d) => {
        data[d.id] = d.data();
      });
      setRecords(data);
    });
    return () => unsubscribe();
  }, []);

  const getUserEmoji = (user) => {
    if (user === "龍由" || user === "たっちゃん" || user === "主人") return "👨";
    return "👩";
  };

  // 🎯 接種済みにマーク
  const toggleVaccinated = async (vaccineId, vaccineName) => {
    const existing = records[vaccineId];
    if (existing) {
      // 既に接種済み→削除
      if (window.confirm(`「${vaccineName}」の接種済みマークを取り消しますか?`)) {
        await deleteDoc(doc(db, "vaccinations", vaccineId));
      }
    } else {
      // 新規追加
      await setDoc(doc(db, "vaccinations", vaccineId), {
        vaccineName,
        vaccinatedAt: new Date().toISOString(),
        recordedBy: currentUser,
      });
    }
  };

  // 👶 赤ちゃんの年齢計算(月単位)
  // dueDateを「生まれた日」と見立てて計算(出産後の使用)
  // 注意: dueDateが未来の場合は月齢0
  const calculateAgeMonths = () => {
    if (!dueDate) return null;
    const birth = new Date(dueDate);
    const now = new Date();
    if (birth > now) return 0;
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    return Math.max(0, months);
  };

  const ageMonths = calculateAgeMonths();

  // カラーマップ
  const getColor = (color, isDone) => {
    if (isDone) {
      return darkMode
        ? { bg: "bg-gray-800/60", border: "border-gray-700", text: "text-gray-500" }
        : { bg: "bg-gray-100", border: "border-gray-200", text: "text-gray-400" };
    }
    const colorMap = {
      rose:   { bg: darkMode ? "bg-rose-900/30"   : "bg-rose-50",   border: darkMode ? "border-rose-700"   : "border-rose-200",   text: darkMode ? "text-rose-300"   : "text-rose-700" },
      blue:   { bg: darkMode ? "bg-blue-900/30"   : "bg-blue-50",   border: darkMode ? "border-blue-700"   : "border-blue-200",   text: darkMode ? "text-blue-300"   : "text-blue-700" },
      purple: { bg: darkMode ? "bg-purple-900/30" : "bg-purple-50", border: darkMode ? "border-purple-700" : "border-purple-200", text: darkMode ? "text-purple-300" : "text-purple-700" },
      amber:  { bg: darkMode ? "bg-amber-900/30"  : "bg-amber-50",  border: darkMode ? "border-amber-700"  : "border-amber-200",  text: darkMode ? "text-amber-300"  : "text-amber-700" },
      green:  { bg: darkMode ? "bg-green-900/30"  : "bg-green-50",  border: darkMode ? "border-green-700"  : "border-green-200",  text: darkMode ? "text-green-300"  : "text-green-700" },
    };
    return colorMap[color] || colorMap.rose;
  };

  // タイミング別にグループ化
  const groupedByTiming = STANDARD_VACCINES.reduce((acc, v) => {
    if (!acc[v.timing]) acc[v.timing] = [];
    acc[v.timing].push(v);
    return acc;
  }, {});

  const timings = Object.keys(groupedByTiming).sort((a, b) => Number(a) - Number(b));

  // 進捗計算
  const totalVaccines = STANDARD_VACCINES.length;
  const doneCount = Object.keys(records).length;
  const progress = totalVaccines === 0 ? 0 : Math.round((doneCount / totalVaccines) * 100);

  // 近づいている接種(次の月齢)
  const upcomingTiming = ageMonths != null
    ? timings.find((t) => Number(t) >= ageMonths && groupedByTiming[t].some((v) => !records[v.id]))
    : null;

  return (
    <div className="max-w-md mx-auto">
      <header className="text-center mb-6">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full shadow-md mb-3 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <Syringe className="w-8 h-8 text-blue-400" strokeWidth={1.5} />
        </div>
        <h1 className={`text-2xl font-bold mb-1 ${darkMode ? "text-gray-100" : "text-gray-800"}`}>
          予防接種スケジュール
        </h1>
        <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          接種したらタップでチェック 💊
        </p>
      </header>

      {/* 📊 進捗 */}
      <div className={`rounded-2xl shadow-sm p-4 mb-5 border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-blue-100"}`}>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-sm font-semibold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
            接種進捗
          </span>
          <span className={`text-sm font-bold ${darkMode ? "text-blue-300" : "text-blue-600"}`}>
            {doneCount} / {totalVaccines} 件
          </span>
        </div>
        <div className={`w-full rounded-full h-2 overflow-hidden ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
          <div
            className="h-full bg-gradient-to-r from-blue-300 to-purple-400 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-center text-lg font-bold mt-2 text-blue-500">{progress}%</p>
        {ageMonths != null && (
          <p className={`text-center text-xs mt-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            👶 赤ちゃんは現在 <span className="font-bold">生後 {ageMonths} ヶ月</span>
          </p>
        )}
      </div>

      {/* 🔔 次の接種候補 */}
      {upcomingTiming && (
        <div className={`rounded-2xl p-3 mb-5 border-2 ${darkMode ? "bg-blue-900/30 border-blue-700" : "bg-blue-50 border-blue-200"}`}>
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className={`w-4 h-4 ${darkMode ? "text-blue-300" : "text-blue-600"}`} />
            <p className={`text-sm font-bold ${darkMode ? "text-blue-300" : "text-blue-700"}`}>
              次の予防接種(生後{upcomingTiming}ヶ月頃)
            </p>
          </div>
          <p className={`text-xs ${darkMode ? "text-blue-200" : "text-blue-600"}`}>
            {groupedByTiming[upcomingTiming].filter((v) => !records[v.id]).map((v) => v.name).join("、")}
          </p>
        </div>
      )}

      {/* 📋 月齢別リスト */}
      <div className="mb-32">
        {timings.map((timing) => {
          const vaccines = groupedByTiming[timing];
          const allDone = vaccines.every((v) => records[v.id]);
          return (
            <div key={timing} className="mb-5">
              <div className={`flex items-center gap-2 mb-2 px-2 ${allDone ? "opacity-60" : ""}`}>
                <h2 className={`text-sm font-bold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                  📅 生後 {timing} ヶ月
                </h2>
                <span className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                  ({vaccines.filter((v) => records[v.id]).length} / {vaccines.length})
                </span>
              </div>
              <div className="space-y-2">
                {vaccines.map((vaccine) => {
                  const record = records[vaccine.id];
                  const isDone = !!record;
                  const colors = getColor(vaccine.color, isDone);
                  return (
                    <button
                      key={vaccine.id}
                      onClick={() => toggleVaccinated(vaccine.id, vaccine.name)}
                      className={`w-full rounded-xl p-3 border text-left transition-all active:scale-95 ${colors.bg} ${colors.border}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          isDone
                            ? "bg-gradient-to-br from-blue-300 to-purple-400 border-transparent"
                            : (darkMode ? "bg-gray-700 border-gray-500" : "bg-white border-gray-300")
                        }`}>
                          {isDone && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold ${isDone ? "line-through" : ""} ${colors.text}`}>
                            {vaccine.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              vaccine.category === "定期"
                                ? (darkMode ? "bg-blue-900/40 text-blue-300" : "bg-blue-100 text-blue-700")
                                : (darkMode ? "bg-green-900/40 text-green-300" : "bg-green-100 text-green-700")
                            }`}>
                              {vaccine.category}
                            </span>
                            {record?.recordedBy && (
                              <span className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                                {getUserEmoji(record.recordedBy)} {record.recordedBy}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
