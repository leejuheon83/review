"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useActor } from "@/components/actor-provider";
import { auth } from "@/lib/firebase";
import {
  defaultLeadershipScores,
  getCategoryAverages,
  getMonthKey,
  getResultLabel,
  getScoreMeaning,
  getStrengthAndFocus,
  getTotalScore,
  leadershipQuestions,
  type LeadershipQuestionId,
  type LeadershipScores,
} from "@/lib/leadership-assessment";
import { buildLeadershipOverview } from "@/lib/leadership-overview";
import {
  getRecentLeadershipAssessments,
  saveLeadershipAssessment,
} from "@/lib/leadership-firestore";

type RecentAssessment = {
  id: string;
  monthKey: string;
  totalScore: number;
  memo: string;
  scores?: Record<string, number>;
};

export default function LeadershipPage() {
  const { actor } = useActor();
  const [uid, setUid] = useState<string | null>(null);
  const [scores, setScores] = useState<LeadershipScores>(defaultLeadershipScores);
  const [memo, setMemo] = useState("");
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<RecentAssessment[]>([]);
  const [message, setMessage] = useState("");

  const totalScore = useMemo(() => getTotalScore(scores), [scores]);
  const resultLabel = useMemo(() => getResultLabel(totalScore), [totalScore]);
  const categoryAverages = useMemo(() => getCategoryAverages(scores), [scores]);
  const { strength, focus } = useMemo(() => getStrengthAndFocus(scores), [scores]);
  const ownerUid = actor?.id || uid;
  const latestSavedOverview = useMemo(
    () => buildLeadershipOverview((recent[0] as { totalScore: number; scores?: Record<string, number> }) || null),
    [recent],
  );

  const handleScoreChange = (id: LeadershipQuestionId, value: number) => {
    setScores((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  useEffect(() => {
    if (!auth) {
      setUid(actor?.id ?? null);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setUid(actor?.id ?? null);
        return;
      }
      setUid(user.uid);
    });

    return () => unsubscribe();
  }, [actor?.id]);

  useEffect(() => {
    const loadRecent = async () => {
      if (!ownerUid) {
        setRecent([]);
        return;
      }

      try {
        const items = await getRecentLeadershipAssessments(ownerUid);
        const parsed = items.map((item) => ({
          id: String(item.id),
          monthKey: String(item.monthKey || ""),
          totalScore: Number(item.totalScore || 0),
          memo: String(item.memo || ""),
          scores:
            item.scores && typeof item.scores === "object"
              ? (item.scores as Record<string, number>)
              : undefined,
        }));
        setRecent(parsed);
      } catch (error) {
        console.error(error);
      }
    };

    void loadRecent();
  }, [ownerUid]);

  const handleSave = async () => {
    if (!ownerUid) {
      setMessage("로그인이 필요합니다.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await saveLeadershipAssessment({
        ownerUid,
        monthKey: getMonthKey(),
        scores,
        totalScore,
        memo,
      });

      const items = await getRecentLeadershipAssessments(ownerUid);
      const parsed = items.map((item) => ({
        id: String(item.id),
        monthKey: String(item.monthKey || ""),
        totalScore: Number(item.totalScore || 0),
        memo: String(item.memo || ""),
        scores:
          item.scores && typeof item.scores === "object"
            ? (item.scores as Record<string, number>)
            : undefined,
      }));
      setRecent(parsed);
      setMessage("리더십 진단이 저장되었어요.");
    } catch (error) {
      console.error(error);
      const reason = error instanceof Error ? error.message : "알 수 없는 오류";
      setMessage(`저장 중 문제가 발생했어요. (${reason})`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f6f7fb] px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white px-6 py-5">
          <p className="text-sm font-semibold text-blue-600">Leadership Check</p>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">리더십 자기 진단</h1>
          <p className="mt-2 text-sm text-gray-600">
            월 1회, 팀장으로서의 리더십 상태를 점검하세요. 너무 길게 고민하지 말고 지금 기준으로 빠르게
            체크하는 게 좋아요.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.65fr_1fr]">
          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">10문항 진단표</h2>
                <p className="mt-1 text-sm text-gray-500">
                  1점은 전혀 아니다, 5점은 항상 그렇다로 체크해보세요.
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 px-4 py-3 text-right">
                <p className="text-xs text-gray-500">총점</p>
                <p className="text-2xl font-bold text-gray-900">{totalScore} / 50</p>
                <p className="text-sm font-medium text-blue-600">{resultLabel}</p>
              </div>
            </div>

            <div className="space-y-4">
              {leadershipQuestions.map((question, index) => (
                <div key={question.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-gray-600">
                          Q{index + 1}
                        </span>
                        <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-600">
                          {question.category}
                        </span>
                      </div>

                      <h3 className="text-sm font-semibold text-gray-900">{question.title}</h3>
                      <p className="mt-1 text-sm text-gray-600">{question.description}</p>
                    </div>

                    <div className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-gray-800">
                      {scores[question.id]}점
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5].map((value) => {
                      const active = scores[question.id] === value;

                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => handleScoreChange(question.id, value)}
                          className={`h-10 w-10 rounded-full border text-sm font-semibold transition ${
                            active
                              ? "border-blue-600 bg-blue-600 text-white"
                              : "border-gray-300 bg-white text-gray-700 hover:border-blue-400"
                          }`}
                        >
                          {value}
                        </button>
                      );
                    })}
                  </div>

                  <p className="mt-3 text-xs text-gray-500">현재 선택: {getScoreMeaning(scores[question.id])}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-4">
              <label className="mb-2 block text-sm font-semibold text-gray-900">이번 달 리더십 메모</label>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                rows={5}
                placeholder="예: 최근 피드백은 자주 했지만, 방향 제시는 조금 추상적이었다. 다음 달에는 1:1 전에 기대 결과를 더 명확히 말해보자."
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500"
              />
            </div>

            <div className="mt-5 flex items-center gap-3">
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={loading}
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "저장 중..." : "진단 저장하기"}
              </button>

              {message ? <p className="text-sm text-gray-600">{message}</p> : null}
            </div>
          </section>

          <aside className="space-y-6">
            <section id="recent-result" className="rounded-2xl border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-bold text-gray-900">최근 저장 결과</h2>
              {latestSavedOverview ? (
                <>
                  <div className="mt-4 rounded-2xl bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">최근 저장 점수</p>
                    <p className="mt-1 text-3xl font-bold text-gray-900">
                      {latestSavedOverview.totalScore}
                    </p>
                    <p className="mt-1 text-sm font-medium text-blue-600">
                      {latestSavedOverview.resultLabel}
                    </p>
                  </div>

                  <div className="mt-5 space-y-4">
                    {latestSavedOverview.categoryAverages.map((item) => (
                      <div key={item.category}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="text-gray-700">{item.category}</span>
                          <span className="font-semibold text-gray-900">{item.average} / 5</span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-100">
                          <div
                            className="h-2 rounded-full bg-blue-600 transition-all"
                            style={{ width: `${(item.average / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="mt-3 text-sm text-gray-500">최근 저장된 결과가 없습니다.</p>
              )}
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-bold text-gray-900">진단 요약</h2>

              <div className="mt-4 rounded-2xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">이번 달 결과</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">{totalScore}</p>
                <p className="mt-1 text-sm font-medium text-blue-600">{resultLabel}</p>
              </div>

              <div className="mt-5 space-y-4">
                {categoryAverages.map((item) => (
                  <div key={item.category}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-gray-700">{item.category}</span>
                      <span className="font-semibold text-gray-900">{item.average} / 5</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100">
                      <div
                        className="h-2 rounded-full bg-blue-600 transition-all"
                        style={{ width: `${(item.average / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-bold text-gray-900">강점 / 집중 영역</h2>

              <div className="mt-4 space-y-3">
                <div className="rounded-2xl bg-green-50 p-4">
                  <p className="text-xs font-semibold text-green-700">강점</p>
                  <p className="mt-1 text-base font-bold text-gray-900">{strength.category}</p>
                  <p className="mt-1 text-sm text-gray-600">평균 {strength.average}점</p>
                </div>

                <div className="rounded-2xl bg-amber-50 p-4">
                  <p className="text-xs font-semibold text-amber-700">집중 영역</p>
                  <p className="mt-1 text-base font-bold text-gray-900">{focus.category}</p>
                  <p className="mt-1 text-sm text-gray-600">평균 {focus.average}점</p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-bold text-gray-900">점수 기준</h2>

              <div className="mt-4 space-y-2 text-sm text-gray-600">
                <p>
                  <span className="font-semibold text-gray-900">1점</span> 전혀 아니다
                </p>
                <p>
                  <span className="font-semibold text-gray-900">2점</span> 가끔 그렇다
                </p>
                <p>
                  <span className="font-semibold text-gray-900">3점</span> 보통이다
                </p>
                <p>
                  <span className="font-semibold text-gray-900">4점</span> 자주 그렇다
                </p>
                <p>
                  <span className="font-semibold text-gray-900">5점</span> 항상 그렇다
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-bold text-gray-900">최근 저장 기록</h2>

              <div className="mt-4 space-y-3">
                {recent.length === 0 ? (
                  <p className="text-sm text-gray-500">아직 저장된 리더십 진단이 없어요.</p>
                ) : (
                  recent.map((item) => (
                    <div key={item.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-900">{item.monthKey}</p>
                        <span className="text-sm font-bold text-blue-600">{item.totalScore}점</span>
                      </div>
                      {item.memo ? (
                        <p className="mt-2 line-clamp-2 text-sm text-gray-600">{item.memo}</p>
                      ) : (
                        <p className="mt-2 text-sm text-gray-400">메모 없음</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
