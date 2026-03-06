"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useActor } from "@/components/actor-provider";
import { learningContents } from "@/lib/learning-content";
import {
  buildLearningRecommendation,
  getRecommendedContents,
  type FeedbackRecord,
  type LeadershipAssessmentInput,
  type OneOnOneRecord,
} from "@/lib/learning-recommendation";
import {
  getLatestLeadershipAssessment,
  getRecentFeedbacks,
  getRecentOneOnOnes,
} from "@/lib/learning-data-source";
import AIRecommendationCard from "@/components/learning/ai-recommendation-card";
import TheoryCard from "@/components/learning/theory-card";

export default function LearningPage() {
  const { actor } = useActor();
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [leadership, setLeadership] = useState<LeadershipAssessmentInput | null>(null);
  const [feedbacks, setFeedbacks] = useState<FeedbackRecord[]>([]);
  const [oneOnOnes, setOneOnOnes] = useState<OneOnOneRecord[]>([]);

  useEffect(() => {
    if (!auth) {
      setUid(actor?.id ?? null);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const ownerUid = user?.uid || actor?.id || null;
      if (!ownerUid) {
        setUid(null);
        setLoading(false);
        return;
      }

      setUid(ownerUid);
      setLoading(true);

      try {
        const [leadershipData, feedbackData, oneOnOneData] = await Promise.all([
          getLatestLeadershipAssessment(ownerUid),
          getRecentFeedbacks(ownerUid),
          getRecentOneOnOnes(ownerUid),
        ]);

        setLeadership(leadershipData);
        setFeedbacks(feedbackData);
        setOneOnOnes(oneOnOneData);
      } catch (error) {
        console.error("학습 자료 데이터 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [actor?.id]);

  useEffect(() => {
    if (auth) return;
    const ownerUid = actor?.id || null;
    if (!ownerUid) return;

    setUid(ownerUid);
    setLoading(true);
    void Promise.all([
      getLatestLeadershipAssessment(ownerUid),
      getRecentFeedbacks(ownerUid),
      getRecentOneOnOnes(ownerUid),
    ])
      .then(([leadershipData, feedbackData, oneOnOneData]) => {
        setLeadership(leadershipData);
        setFeedbacks(feedbackData);
        setOneOnOnes(oneOnOneData);
      })
      .catch((error) => {
        console.error("학습 자료 데이터 로드 실패:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [actor?.id]);

  const recommendation = useMemo(() => {
    return buildLearningRecommendation({
      leadership: leadership ?? undefined,
      feedbacks,
      oneOnOnes,
    });
  }, [leadership, feedbacks, oneOnOnes]);

  const recommendedContents = useMemo(() => {
    return getRecommendedContents(recommendation.recommendedContentIds);
  }, [recommendation]);

  const recommendedIds = useMemo(
    () => new Set(recommendedContents.map((content) => content.id)),
    [recommendedContents],
  );

  const feedbackItems = useMemo(
    () =>
      learningContents.filter(
        (item) => item.category === "feedback" && !recommendedIds.has(item.id),
      ),
    [recommendedIds],
  );
  const oneOnOneItems = useMemo(
    () =>
      learningContents.filter(
        (item) => item.category === "oneonone" && !recommendedIds.has(item.id),
      ),
    [recommendedIds],
  );

  return (
    <main className="min-h-screen bg-[#f6f7fb] px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white px-6 py-5">
          <p className="text-sm font-semibold text-blue-600">Learning Library</p>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">학습 자료</h1>
          <p className="mt-2 text-sm text-gray-600">
            기본 이론 콘텐츠는 항상 고정으로 제공하고, 현재 리더십 진단과 피드백 패턴을 바탕으로 AI가
            우선순위를 추천해줘요.
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
            학습 자료를 불러오는 중...
          </div>
        ) : !uid ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
            로그인 후 학습 자료를 볼 수 있어요.
          </div>
        ) : (
          <div className="space-y-8">
            <AIRecommendationCard recommendation={recommendation} />

            <section className="rounded-2xl border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-bold text-gray-900">추천 콘텐츠</h2>
              <p className="mt-1 text-sm text-gray-500">현재 상태를 기준으로 먼저 보면 좋은 콘텐츠예요.</p>

              <div className="mt-5 grid gap-6">
                {recommendedContents.map((content) => (
                  <TheoryCard key={content.id} content={content} />
                ))}
              </div>
            </section>

            <section className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">피드백 스킬</h2>
                <p className="mt-1 text-sm text-gray-500">
                  팀원에게 더 구체적이고 수용 가능한 피드백을 주기 위한 기본 이론이에요.
                </p>
              </div>

              <div className="grid gap-6">
                {feedbackItems.map((content) => (
                  <TheoryCard key={content.id} content={content} />
                ))}
              </div>
            </section>

            <section className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">1:1 미팅 가이드</h2>
                <p className="mt-1 text-sm text-gray-500">좋은 1:1 루틴과 질문 구조를 빠르게 익힐 수 있어요.</p>
              </div>

              <div className="grid gap-6">
                {oneOnOneItems.map((content) => (
                  <TheoryCard key={content.id} content={content} />
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
