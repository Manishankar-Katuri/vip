"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {

  const [analytics, setAnalytics] =
    useState<any>(null);

  const [trend, setTrend] =
    useState<any>(null);

  async function loadDashboard() {

    try {

      const analyticsRes =
        await fetch(
          "/api/intelligence/reviews?hospital=Harika ENT Care Hospitals"
        );

      const analyticsData =
        await analyticsRes.json();

      setAnalytics(
        analyticsData.analytics
      );

      const trendRes =
        await fetch(
          "/api/intelligence/trends"
        );

      const trendData =
        await trendRes.json();

      setTrend(
        trendData.trend
      );

    } catch (error) {

      console.log(error);

    }

  }

  useEffect(() => {

    loadDashboard();

  }, []);

  if (!analytics) {

    return (

      <div className="p-10">

        <h1 className="text-3xl font-bold">
          VIP Intelligence Dashboard
        </h1>

        <p className="mt-4">
          Loading analytics...
        </p>

      </div>

    );

  }

  return (

    <div className="p-10 space-y-8 bg-gray-50 min-h-screen">

      <div>

        <h1 className="text-4xl font-bold">
          VIP Intelligence Dashboard
        </h1>

        <p className="text-gray-500 mt-2">
          Hospital Reputation & Growth Intelligence
        </p>

      </div>

      {/* Analytics Cards */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="bg-white border rounded-xl p-6 shadow-sm">

          <h2 className="text-sm text-gray-500">
            Total Reviews
          </h2>

          <p className="text-4xl font-bold mt-2">
            {analytics.totalReviews}
          </p>

        </div>

        <div className="bg-white border rounded-xl p-6 shadow-sm">

          <h2 className="text-sm text-gray-500">
            Average Rating
          </h2>

          <p className="text-4xl font-bold mt-2">
            ⭐ {analytics.averageRating}
          </p>

        </div>

        <div className="bg-white border rounded-xl p-6 shadow-sm">

          <h2 className="text-sm text-gray-500">
            Positive Reviews
          </h2>

          <p className="text-4xl font-bold mt-2">
            {analytics.positivePercentage}%
          </p>

        </div>

        <div className="bg-white border rounded-xl p-6 shadow-sm">

          <h2 className="text-sm text-gray-500">
            Negative Reviews
          </h2>

          <p className="text-4xl font-bold mt-2">
            {analytics.negativePercentage}%
          </p>

        </div>

      </div>

      {/* Trend Intelligence */}

      {trend && (

        <div className="bg-white border rounded-xl p-6 shadow-sm">

          <h2 className="text-2xl font-bold mb-6">
            Trend Intelligence
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <div className="border rounded-lg p-4">

              <h3 className="text-gray-500 text-sm">
                Trend Status
              </h3>

              <p className="text-2xl font-bold mt-2 capitalize">
                {trend.trend}
              </p>

            </div>

            <div className="border rounded-lg p-4">

              <h3 className="text-gray-500 text-sm">
                Rating Movement
              </h3>

              <p className="text-2xl font-bold mt-2">
                {trend.ratingMovement}
              </p>

            </div>

            <div className="border rounded-lg p-4">

              <h3 className="text-gray-500 text-sm">
                Review Growth
              </h3>

              <p className="text-2xl font-bold mt-2">
                {trend.reviewGrowth}
              </p>

            </div>

          </div>

        </div>

      )}

      {/* Complaints */}

      <div className="bg-white border rounded-xl p-6 shadow-sm">

        <h2 className="text-2xl font-bold mb-4">
          Top Complaints
        </h2>

        {analytics.topComplaints.length === 0 ? (

          <p className="text-gray-500">
            No major complaints found.
          </p>

        ) : (

          <div className="space-y-3">

            {analytics.topComplaints.map(
              (complaint: string) => (

                <div
                  key={complaint}
                  className="border rounded-lg p-4 bg-gray-50"
                >

                  • {complaint}

                </div>

              )
            )}

          </div>

        )}

      </div>

      {/* Strategic Recommendations */}

      <div className="bg-white border rounded-xl p-6 shadow-sm">

        <h2 className="text-2xl font-bold mb-4">
          VIP Recommendations
        </h2>

        <div className="space-y-4">

          <div className="border rounded-lg p-4">

            Improve patient waiting time communication
            through proactive updates and scheduling.

          </div>

          <div className="border rounded-lg p-4">

            Increase positive review generation campaigns
            for satisfied patients.

          </div>

          <div className="border rounded-lg p-4">

            Create social media content around
            patient success stories and treatments.

          </div>

        </div>

      </div>

    </div>

  );

}