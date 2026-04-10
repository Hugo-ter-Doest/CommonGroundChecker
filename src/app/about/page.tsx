import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-6">
      <nav className="flex items-center justify-end gap-4 text-sm">
        <Link href="/" className="text-gray-500 hover:text-cg-lightblue transition-colors">
          Checker
        </Link>
        <Link href="/history" className="text-gray-500 hover:text-cg-lightblue transition-colors">
          History
        </Link>
        <Link href="/admin" className="text-gray-500 hover:text-cg-lightblue transition-colors">
          Admin
        </Link>
        <Link href="/about" className="text-cg-lightblue hover:underline font-medium">
          About
        </Link>
      </nav>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-cg-blue">About Common Ground</h2>
        <p className="text-gray-700">
          Common Ground is a Dutch government initiative that promotes modern,
          interoperable, and reusable digital public services. Instead of isolated
          monolithic systems, municipalities are encouraged to use open standards,
          modular components, and well-defined APIs so solutions can be shared and
          improved across organizations.
        </p>
      </section>

      <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-3">
        <h3 className="text-lg font-semibold text-gray-800">Purpose of this checker</h3>
        <p className="text-gray-700">
          The Common Ground Component Checker helps teams quickly assess whether a
          public GitHub repository aligns with key Common Ground practices. It runs
          automated checks (such as open standards, governance files, deployability,
          documentation, and versioning) and produces a transparent score with
          evidence per criterion.
        </p>
        <p className="text-gray-700">
          The goal is to support better decision-making, highlight improvement areas,
          and make reusable public-sector software easier to evaluate over time.
        </p>
      </section>
    </div>
  );
}
