// ==========================================
// 👤 ユーザー選択画面(主人 or 奥様)
// ==========================================
import { Heart } from "lucide-react";

export default function UserSelect({ onSelect }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-md mb-4">
            <Heart className="w-10 h-10 text-pink-400" fill="currentColor" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            こんにちは 👶
          </h1>
          <p className="text-sm text-gray-500">あなたはどちらですか？</p>
        </div>

        <button
          onClick={() => onSelect("龍由")}
          className="w-full mb-3 p-6 bg-white rounded-2xl shadow-sm border-2 border-blue-100 hover:border-blue-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-center gap-3">
            <span className="text-3xl">👨</span>
            <span className="text-lg font-bold text-blue-700">龍由</span>
          </div>
        </button>

        <button
          onClick={() => onSelect("まーちゃん")}
          className="w-full p-6 bg-white rounded-2xl shadow-sm border-2 border-pink-100 hover:border-pink-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-center gap-3">
            <span className="text-3xl">👩</span>
            <span className="text-lg font-bold text-pink-700">まーちゃん</span>
          </div>
        </button>

        <p className="text-center text-xs text-gray-400 mt-6">
          ※ 一度選ぶと、このスマホでは次回から自動で使われます
        </p>
      </div>
    </div>
  );
}
