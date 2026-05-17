// ==========================================
// 📋 手続きTODOページ(出産・育休・移住など)
// ==========================================
import { useState, useEffect } from "react";
import { ClipboardList, Plus, Trash2, Check, ChevronDown, ChevronUp, AlertCircle, FileText, X } from "lucide-react";

import { db } from "./firebase";
import {
  collection, onSnapshot, addDoc, deleteDoc, updateDoc,
  doc, query, orderBy,
} from "firebase/firestore";

// 📅 初期データ(PDFの9件)
const INITIAL_PROCEDURES = [
  // STEP 1
  {
    order: 1, step: "STEP1", name: "児童手当の申請", deadline: "2026-05-27",
    method: "オンライン", submitTo: "マイナポータル",
    requirements: "あなたのマイナンバーカード、暗証番号、振込口座",
    memo: "子のマイナンバー欄は「不明」または「未記入」でOK。世田谷区側でデータが届いた後、住民票と照合して処理してくれます。",
    amount: "",
  },
  {
    order: 2, step: "STEP1", name: "乳幼児医療費助成", deadline: null,
    method: "オンライン", submitTo: "世田谷区電子申請",
    requirements: "お子様の情報のみ入力",
    memo: "速やかに",
    amount: "",
  },
  {
    order: 3, step: "STEP1", name: "子の健康保険加入", deadline: null,
    method: "郵送/社内便", submitTo: "ヤマト健保",
    requirements: "母子手帳の出生証明ページ写し",
    memo: "会社へ「出生報告」。月曜日になったら、会社の担当の方に「12日に生まれ、15日に出生届を出しました。健保加入の手続きをお願いします」と一報入れておくと、保険証の発行が早まります。",
    amount: "",
  },
  {
    order: 4, step: "STEP1", name: "失業保険延長手続", deadline: "2027-05-12",
    method: "郵送/窓口", submitTo: "ハローワーク府中",
    requirements: "離職票、母子手帳、奥様の本人確認書類",
    memo: "1年以内",
    amount: "",
  },
  // STEP 2
  {
    order: 5, step: "STEP2", name: "018サポート", deadline: null,
    method: "オンライン", submitTo: "公式サイト",
    requirements: "",
    memo: "東京都独自の支援。住民票にお子様が反映された頃(5/22以降目安)に申請可能。",
    amount: "月5,000円",
  },
  {
    order: 6, step: "STEP2", name: "赤ちゃんファースト", deadline: null,
    method: "オンライン", submitTo: "東京都共通ポータル",
    requirements: "",
    memo: "10万円相当の育児ポイント。住民票にお子様が反映された頃(5/22以降目安)に申請可能。",
    amount: "10万円相当のポイント",
  },
  // STEP 3
  {
    order: 7, step: "STEP3", name: "妻の転入届", deadline: null,
    method: "窓口", submitTo: "世田谷区各窓口",
    requirements: "奥様のマイナンバーカード",
    memo: "引越後14日以内。同居を確定するための手続き。",
    amount: "",
  },
  {
    order: 8, step: "STEP3", name: "妻の扶養再申請", deadline: null,
    method: "社内便", submitTo: "ヤマト健保",
    requirements: "「同居」の住民票",
    memo: "転入後すぐ。住民票を添付し再審査。",
    amount: "",
  },
  {
    order: 9, step: "STEP3", name: "医療費還付請求", deadline: null,
    method: "窓口", submitTo: "世田谷区総合支所",
    requirements: "領収書原本(必須)",
    memo: "広島での3割負担分を精算。今日以降、病院で支払う「お子様の健診代」や「お薬代」はすべて世田谷区で返金対象になります。広島(福山市)の窓口ではまだ「世田谷区の医療証」が使えないため、必ず領収書を保管しておいてください。",
    amount: "",
  },
];

const STEP_INFO = {
  STEP1: { label: "STEP 1：今すぐ〜広島滞在中(5/27まで)", emoji: "🚨", color: "rose" },
  STEP2: { label: "STEP 2：生後1〜2週間後(オンライン)",     emoji: "📅", color: "blue" },
  STEP3: { label: "STEP 3：東京都世田谷区へ移住後",          emoji: "🏠", color: "purple" },
};

export default function Procedures({ currentUser, darkMode }) {
  const [procedures, setProcedures] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // 新規/編集フォーム
  const [formStep, setFormStep] = useState("STEP1");
  const [formName, setFormName] = useState("");
  const [formDeadline, setFormDeadline] = useState("");
  const [formMethod, setFormMethod] = useState("");
  const [formSubmitTo, setFormSubmitTo] = useState("");
  const [formRequirements, setFormRequirements] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formMemo, setFormMemo] = useState("");

  useEffect(() => {
    const ref = collection(db, "procedures");
    const q = query(ref, orderBy("order", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setProcedures(data);
    });
    return () => unsubscribe();
  }, []);

  // 📥 初期データ一括読み込み
  const seedInitialData = async () => {
    if (!window.confirm("初期データ(9件)を読み込みますか?")) return;
    for (const p of INITIAL_PROCEDURES) {
      await addDoc(collection(db, "procedures"), {
        ...p,
        checked: false,
        checkedBy: null,
        checkedAt: null,
        createdAt: new Date().toISOString(),
      });
    }
  };

  const resetForm = () => {
    setFormStep("STEP1");
    setFormName("");
    setFormDeadline("");
    setFormMethod("");
    setFormSubmitTo("");
    setFormRequirements("");
    setFormAmount("");
    setFormMemo("");
    setIsAdding(false);
    setEditingId(null);
  };

  // ➕ 追加保存
  const saveNew = async () => {
    if (!formName.trim()) {
      alert("手続き名を入力してください");
      return;
    }
    const maxOrder = procedures.length > 0 ? Math.max(...procedures.map((p) => p.order || 0)) : 0;
    await addDoc(collection(db, "procedures"), {
      order: maxOrder + 1,
      step: formStep,
      name: formName,
      deadline: formDeadline || null,
      method: formMethod,
      submitTo: formSubmitTo,
      requirements: formRequirements,
      amount: formAmount,
      memo: formMemo,
      checked: false,
      checkedBy: null,
      checkedAt: null,
      createdAt: new Date().toISOString(),
    });
    resetForm();
  };

  // ✏️ 編集開始
  const startEdit = (proc) => {
    setEditingId(proc.id);
    setFormStep(proc.step || "STEP1");
    setFormName(proc.name || "");
    setFormDeadline(proc.deadline || "");
    setFormMethod(proc.method || "");
    setFormSubmitTo(proc.submitTo || "");
    setFormRequirements(proc.requirements || "");
    setFormAmount(proc.amount || "");
    setFormMemo(proc.memo || "");
    setIsAdding(false);
    setExpandedId(null);
  };

  // 💾 編集保存
  const saveEdit = async () => {
    if (!formName.trim()) {
      alert("手続き名を入力してください");
      return;
    }
    await updateDoc(doc(db, "procedures", editingId), {
      step: formStep,
      name: formName,
      deadline: formDeadline || null,
      method: formMethod,
      submitTo: formSubmitTo,
      requirements: formRequirements,
      amount: formAmount,
      memo: formMemo,
    });
    resetForm();
  };

  // ✅ チェック切替
  const toggleCheck = async (proc) => {
    await updateDoc(doc(db, "procedures", proc.id), {
      checked: !proc.checked,
      checkedBy: !proc.checked ? currentUser : null,
      checkedAt: !proc.checked ? new Date().toISOString() : null,
    });
  };

  // 🗑️ 削除
  const deleteProc = async (id, name, e) => {
    if (e) e.stopPropagation();
    if (window.confirm(`「${name}」を削除しますか?`)) {
      await deleteDoc(doc(db, "procedures", id));
    }
  };

  const getUserEmoji = (user) => {
    if (user === "龍由" || user === "たっちゃん" || user === "主人") return "👨";
    return "👩";
  };

  // 📅 期限まで何日?
  const daysUntilDeadline = (deadline) => {
    if (!deadline) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(deadline);
    return Math.ceil((d - today) / (1000 * 60 * 60 * 24));
  };

  // 📅 期限の状態
  const getDeadlineStatus = (deadline, checked) => {
    if (!deadline || checked) return null;
    const days = daysUntilDeadline(deadline);
    if (days < 0)  return { level: "overdue", text: `${Math.abs(days)}日超過`,  color: darkMode ? "bg-red-900/50 text-red-200 border-red-600"     : "bg-red-100 text-red-800 border-red-300" };
    if (days === 0) return { level: "today",  text: "今日が期限!",            color: darkMode ? "bg-red-900/50 text-red-200 border-red-600"     : "bg-red-100 text-red-800 border-red-300" };
    if (days <= 3) return { level: "urgent",  text: `あと${days}日`,            color: darkMode ? "bg-rose-900/40 text-rose-300 border-rose-700" : "bg-rose-50 text-rose-700 border-rose-300" };
    if (days <= 7) return { level: "warning", text: `あと${days}日`,            color: darkMode ? "bg-amber-900/40 text-amber-300 border-amber-700" : "bg-amber-50 text-amber-700 border-amber-200" };
    return         { level: "ok",      text: `あと${days}日`,            color: darkMode ? "bg-green-900/30 text-green-300 border-green-700"  : "bg-green-50 text-green-700 border-green-200" };
  };

  const formatDeadline = (d) => {
    if (!d) return null;
    const date = new Date(d);
    return `${date.getMonth() + 1}/${date.getDate()}(${["日","月","火","水","木","金","土"][date.getDay()]})`;
  };

  // STEP別グルーピング
  const groupedProcedures = procedures.reduce((acc, p) => {
    if (!acc[p.step]) acc[p.step] = [];
    acc[p.step].push(p);
    return acc;
  }, {});

  // 進捗
  const total = procedures.length;
  const done = procedures.filter((p) => p.checked).length;
  const progress = total === 0 ? 0 : Math.round((done / total) * 100);

  // フォーム
  const showForm = isAdding || editingId !== null;

  return (
    <div className="max-w-md mx-auto">
      <header className="text-center mb-6">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full shadow-md mb-3 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <ClipboardList className="w-8 h-8 text-rose-400" strokeWidth={1.5} />
        </div>
        <h1 className={`text-2xl font-bold mb-1 ${darkMode ? "text-gray-100" : "text-gray-800"}`}>
          手続き
        </h1>
        <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          出産・育休・移住の手続き 📋
        </p>
      </header>

      {/* 📊 進捗 */}
      {procedures.length > 0 && (
        <div className={`rounded-2xl shadow-sm p-4 mb-5 border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-rose-100"}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-semibold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
              全体の進捗
            </span>
            <span className={`text-sm font-bold ${darkMode ? "text-rose-300" : "text-rose-600"}`}>
              {done} / {total} 件
            </span>
          </div>
          <div className={`w-full rounded-full h-2 overflow-hidden ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
            <div
              className="h-full bg-gradient-to-r from-rose-300 to-purple-400 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-center text-lg font-bold mt-2 text-rose-500">{progress}%</p>
        </div>
      )}

      {/* ➕ アクションボタン */}
      {!showForm && (
        <div className="flex gap-2 mb-5">
          {procedures.length === 0 && (
            <button
              onClick={seedInitialData}
              className="flex-1 py-2 bg-gradient-to-r from-amber-300 to-orange-300 text-white rounded-lg font-semibold text-sm shadow-sm flex items-center justify-center gap-1"
            >
              <FileText className="w-4 h-4" />
              初期データを読み込む
            </button>
          )}
          <button
            onClick={() => setIsAdding(true)}
            className="flex-1 py-2 bg-gradient-to-r from-rose-300 to-pink-300 text-white rounded-lg font-semibold text-sm shadow-sm flex items-center justify-center gap-1"
          >
            <Plus className="w-4 h-4" />
            手続きを追加
          </button>
        </div>
      )}

      {/* 📝 追加・編集フォーム */}
      {showForm && (
        <div className={`rounded-2xl shadow-sm p-4 mb-5 border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-rose-100"}`}>
          <h2 className={`text-sm font-semibold mb-3 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
            {editingId !== null ? "✏️ 編集" : "➕ 新しい手続き"}
          </h2>
          <div className="space-y-2">
            <div>
              <label className={`text-xs block mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>STEP</label>
              <select
                value={formStep}
                onChange={(e) => setFormStep(e.target.value)}
                className={`block w-full min-w-0 box-border appearance-none px-3 py-2 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-rose-200 ${darkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-200"}`}
              >
                <option value="STEP1">🚨 STEP 1：今すぐ〜広島滞在中</option>
                <option value="STEP2">📅 STEP 2：生後1〜2週間後</option>
                <option value="STEP3">🏠 STEP 3：移住後</option>
              </select>
            </div>
            <div>
              <label className={`text-xs block mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>手続き名 *</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="例: 児童手当の申請"
                className={`block w-full min-w-0 box-border appearance-none px-3 py-2 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-rose-200 ${darkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "border-gray-200"}`}
              />
            </div>
            <div>
              <label className={`text-xs block mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>期限(任意)</label>
              <input
                type="date"
                value={formDeadline}
                onChange={(e) => setFormDeadline(e.target.value)}
                className={`block w-full min-w-0 box-border appearance-none px-3 py-2 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-rose-200 ${darkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "border-gray-200"}`}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={`text-xs block mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>手段</label>
                <input
                  type="text"
                  value={formMethod}
                  onChange={(e) => setFormMethod(e.target.value)}
                  placeholder="オンライン"
                  className={`block w-full min-w-0 box-border appearance-none px-3 py-2 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-rose-200 ${darkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "border-gray-200"}`}
                />
              </div>
              <div>
                <label className={`text-xs block mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>提出先</label>
                <input
                  type="text"
                  value={formSubmitTo}
                  onChange={(e) => setFormSubmitTo(e.target.value)}
                  placeholder="マイナポータル"
                  className={`block w-full min-w-0 box-border appearance-none px-3 py-2 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-rose-200 ${darkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "border-gray-200"}`}
                />
              </div>
            </div>
            <div>
              <label className={`text-xs block mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>必要なもの</label>
              <textarea
                value={formRequirements}
                onChange={(e) => setFormRequirements(e.target.value)}
                rows={2}
                placeholder="マイナンバーカード、振込口座..."
                className={`block w-full min-w-0 box-border appearance-none px-3 py-2 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-rose-200 resize-none ${darkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "border-gray-200"}`}
              />
            </div>
            <div>
              <label className={`text-xs block mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>金額(任意)</label>
              <input
                type="text"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                placeholder="月5,000円"
                className={`block w-full min-w-0 box-border appearance-none px-3 py-2 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-rose-200 ${darkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "border-gray-200"}`}
              />
            </div>
            <div>
              <label className={`text-xs block mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>メモ・補足(任意)</label>
              <textarea
                value={formMemo}
                onChange={(e) => setFormMemo(e.target.value)}
                rows={3}
                placeholder="補足情報..."
                className={`block w-full min-w-0 box-border appearance-none px-3 py-2 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-rose-200 resize-none ${darkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "border-gray-200"}`}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={resetForm}
                className={`py-2 rounded-lg text-sm font-semibold transition-all ${darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                キャンセル
              </button>
              <button
                onClick={editingId !== null ? saveEdit : saveNew}
                className="py-2 bg-gradient-to-r from-rose-300 to-pink-300 text-white rounded-lg text-sm font-semibold"
              >
                {editingId !== null ? "保存" : "追加"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📋 リスト本体 */}
      {procedures.length === 0 && !showForm ? (
        <div className={`rounded-2xl shadow-sm p-8 text-center border mb-32 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-pink-100"}`}>
          <p className="text-3xl mb-2">📋</p>
          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            まだ手続きがありません
          </p>
          <p className={`text-xs mt-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
            「初期データを読み込む」ボタンで標準的な手続きを追加できます
          </p>
        </div>
      ) : (
        <div className="mb-32">
          {Object.keys(STEP_INFO).map((stepKey) => {
            const items = groupedProcedures[stepKey] || [];
            if (items.length === 0) return null;
            const info = STEP_INFO[stepKey];
            const stepDone = items.filter((p) => p.checked).length;
            return (
              <div key={stepKey} className="mb-5">
                <div className="flex items-center gap-2 mb-2 px-2">
                  <h2 className={`text-sm font-bold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                    {info.emoji} {info.label}
                  </h2>
                  <span className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                    ({stepDone}/{items.length})
                  </span>
                </div>
                <div className="space-y-2">
                  {items.map((proc) => {
                    const expanded = expandedId === proc.id;
                    const deadlineStatus = getDeadlineStatus(proc.deadline, proc.checked);
                    return (
                      <div
                        key={proc.id}
                        className={`rounded-xl border transition-all ${
                          proc.checked
                            ? (darkMode ? "bg-gray-800/50 border-gray-700 opacity-60" : "bg-gray-50 border-gray-200 opacity-70")
                            : (darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-rose-100")
                        } ${deadlineStatus?.level === "today" || deadlineStatus?.level === "overdue" ? "ring-2 ring-red-400 animate-pulse" : ""}`}
                      >
                        {/* カード本体 */}
                        <div className="p-3">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => toggleCheck(proc)}
                              className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                proc.checked
                                  ? "bg-gradient-to-br from-rose-300 to-pink-400 border-transparent"
                                  : (darkMode ? "bg-gray-700 border-gray-500" : "bg-white border-gray-300")
                              }`}
                            >
                              {proc.checked && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                            </button>
                            <button
                              onClick={() => setExpandedId(expanded ? null : proc.id)}
                              className="flex-1 min-w-0 text-left"
                            >
                              <p className={`text-sm font-bold ${proc.checked ? "line-through" : ""} ${darkMode ? "text-gray-100" : "text-gray-800"}`}>
                                {proc.order && <span className="text-xs mr-1 opacity-60">#{proc.order}</span>}
                                {proc.name}
                              </p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                {proc.deadline && (
                                  <span className={`text-xs px-2 py-0.5 rounded-full border ${deadlineStatus ? deadlineStatus.color : (darkMode ? "bg-gray-700 text-gray-300 border-gray-600" : "bg-gray-100 text-gray-600 border-gray-200")}`}>
                                    📅 {formatDeadline(proc.deadline)} {deadlineStatus && `(${deadlineStatus.text})`}
                                  </span>
                                )}
                                {proc.method && (
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${darkMode ? "bg-blue-900/30 text-blue-300" : "bg-blue-50 text-blue-700"}`}>
                                    {proc.method}
                                  </span>
                                )}
                                {proc.amount && (
                                  <span className={`text-xs font-semibold ${darkMode ? "text-green-400" : "text-green-600"}`}>
                                    💰 {proc.amount}
                                  </span>
                                )}
                              </div>
                            </button>
                            <button
                              onClick={() => setExpandedId(expanded ? null : proc.id)}
                              className={`flex-shrink-0 p-2 rounded-lg transition-all ${darkMode ? "text-gray-400 hover:bg-gray-700" : "text-gray-400 hover:bg-gray-100"}`}
                            >
                              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        {/* 詳細展開 */}
                        {expanded && (
                          <div className={`px-3 pb-3 pt-1 border-t space-y-2 ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
                            {proc.submitTo && (
                              <div>
                                <p className={`text-xs font-semibold mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>📍 提出先</p>
                                <p className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{proc.submitTo}</p>
                              </div>
                            )}
                            {proc.requirements && (
                              <div>
                                <p className={`text-xs font-semibold mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>📋 必要なもの</p>
                                <p className={`text-sm whitespace-pre-wrap ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{proc.requirements}</p>
                              </div>
                            )}
                            {proc.memo && (
                              <div className={`rounded-lg p-2 ${darkMode ? "bg-amber-900/20" : "bg-amber-50"}`}>
                                <div className="flex items-start gap-1">
                                  <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${darkMode ? "text-amber-300" : "text-amber-600"}`} />
                                  <p className={`text-xs whitespace-pre-wrap ${darkMode ? "text-amber-200" : "text-amber-800"}`}>{proc.memo}</p>
                                </div>
                              </div>
                            )}
                            {proc.checked && proc.checkedBy && (
                              <p className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                                ✅ {getUserEmoji(proc.checkedBy)} {proc.checkedBy} が完了
                              </p>
                            )}
                            <div className="flex gap-2 pt-2">
                              <button
                                onClick={() => startEdit(proc)}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-purple-50 text-purple-700 hover:bg-purple-100"}`}
                              >
                                ✏️ 編集
                              </button>
                              <button
                                onClick={(e) => deleteProc(proc.id, proc.name, e)}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${darkMode ? "bg-gray-700 text-rose-400 hover:bg-gray-600" : "bg-rose-50 text-rose-600 hover:bg-rose-100"}`}
                              >
                                🗑️ 削除
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
