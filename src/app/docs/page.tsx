import type { Metadata } from "next";
import Link from "next/link";
import { RATING_DOCS, RATING_SCALE } from "@/lib/ratingDocs";

export const metadata: Metadata = {
  title: "Rating guide | Common Ground Component Checker",
  description: "What the ratings of the checker, from 0.5 to 5.5, mean and how they are measured.",
};

export default function RatingGuidePage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold text-cg-blue">Rating guide</h1>
        <p className="text-gray-700">
          The checker rates a component from 0.5 to 5.5, shown as 1 to 5 stars, in five categories. Each category is made up of
          aspects, and each aspect is rated from one or more criteria. These pages explain, per aspect, what it
          means, how the checker measures it and which sources it is based on.
        </p>
        <p className="text-gray-700">
          The ratings are an estimate made with open tools. They are not a SIG rating and not a certification.
        </p>
      </section>

      <section aria-labelledby="categories" className="space-y-3">
        <h2 id="categories" className="text-2xl font-bold text-cg-blue">
          Categories
        </h2>
        <ul className="space-y-3">
          {RATING_DOCS.map((category) => (
            <li key={category.slug} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-2">
              <Link href={`/docs/${category.slug}`} className="text-lg font-semibold text-cg-lightblue hover:underline">
                {category.title}
              </Link>
              <p className="text-gray-700">{category.summary}</p>
              <p className="text-sm text-gray-600">
                Aspects: {category.aspects.map((aspect) => aspect.title).join(", ")}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="how-ratings-work" className="space-y-3">
        <h2 id="how-ratings-work" className="text-2xl font-bold text-cg-blue">
          How ratings work
        </h2>
        <ul className="list-disc pl-6 space-y-2 text-gray-700">
          <li>
            Every criterion gets a rating from 0.5 to 5.5. Checks with a scale of their own use it. Other checks
            rate a pass as 5.5, a warning as 3 and a fail as 0.5, the ends and the middle of the scale.
          </li>
          <li>
            <strong>A measured property</strong> of maintainability or Open Source Health is rated on a straight
            line between its star limits: a share exactly at the 4-star limit rates 3.5, and a perfect result 5.5.
          </li>
          <li>
            <strong>A normal aspect</strong> is rated as the weighted mean of its criteria.
          </li>
          <li>
            <strong>A document aspect</strong> (community documents and containerisation) is rated by the share of
            the documents found. All found is 5.5, at least 80% is 4, at least 60% is 3, at least 40% is 2, and
            less is 1.
          </li>
          <li>
            <strong>A category</strong> is rated as the mean of its aspects.
          </li>
          <li>
            <strong>The overall rating</strong> is the weighted mean of the categories.
          </li>
          <li>
            <strong>A component passes</strong> when every mandatory item is present and the overall rating is at
            least 2.5. That is 3 stars, as the SIG models count 3 stars from 2.5.
          </li>
        </ul>
        <p className="text-gray-700">
          {RATING_SCALE.text} Ratings are rounded to whole stars for display, so a rating of 3.5 or more shows as 4
          stars. Source:{" "}
          <a href={RATING_SCALE.source.url} className="text-cg-lightblue hover:underline">
            {RATING_SCALE.source.title}
          </a>
          .
        </p>
      </section>
    </div>
  );
}
