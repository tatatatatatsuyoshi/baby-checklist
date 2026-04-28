// ==========================================
// 🎊 紙吹雪アニメーション
// ==========================================
// チェック時にパァッと舞う紙吹雪エフェクト
// 親コンポーネントから「show」プロパティで表示制御

import { useEffect, useState } from "react";

export default function Confetti({ show, x, y }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (show) {
      // 30個の紙吹雪を生成
      const newParticles = Array.from({ length: 30 }, (_, i) => ({
        id: Date.now() + i,
        // ランダムな方向(-180度〜180度)
        angle: Math.random() * 360,
        // ランダムな飛距離(50〜150px)
        distance: 50 + Math.random() * 100,
        // ランダムな色
        color: [
          "#fbbf24",
          "#f472b6",
          "#a78bfa",
          "#60a5fa",
          "#34d399",
          "#f87171",
        ][Math.floor(Math.random() * 6)],
        // ランダムな形(丸 or 四角)
        shape: Math.random() > 0.5 ? "circle" : "square",
        // ランダムな大きさ(4〜10px)
        size: 4 + Math.random() * 6,
        // ランダムな回転速度
        rotation: Math.random() * 720 - 360,
      }));
      setParticles(newParticles);

      // 1秒後に紙吹雪を消す
      const timer = setTimeout(() => setParticles([]), 1000);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (particles.length === 0) return null;

  return (
    <div
      className="fixed pointer-events-none z-[100]"
      style={{ left: x, top: y }}
    >
      {particles.map((p) => {
        // 飛ぶ方向のXY座標を計算
        const radian = (p.angle * Math.PI) / 180;
        const dx = Math.cos(radian) * p.distance;
        const dy = Math.sin(radian) * p.distance;

        return (
          <div
            key={p.id}
            className="absolute"
            style={{
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
              borderRadius: p.shape === "circle" ? "50%" : "2px",
              animation: `confetti-fly 1s ease-out forwards`,
              "--dx": `${dx}px`,
              "--dy": `${dy}px`,
              "--rotation": `${p.rotation}deg`,
            }}
          />
        );
      })}
      {/* アニメーションのCSSを定義 */}
      <style>{`
        @keyframes confetti-fly {
          0% {
            transform: translate(0, 0) rotate(0deg) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(var(--dx), var(--dy)) rotate(var(--rotation)) scale(0);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
