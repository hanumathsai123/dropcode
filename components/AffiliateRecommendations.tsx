import type { AffiliateRecommendation } from "@/lib/monetization";

type AffiliateRecommendationsProps = {
  tools: AffiliateRecommendation[];
};

export default function AffiliateRecommendations({
  tools,
}: AffiliateRecommendationsProps) {
  if (tools.length === 0) return null;

  return (
    <section className="monetization-panel">
      <span className="monetization-label">Developer resources</span>
      <h2>Developer Tools We Recommend</h2>
      <ul className="recommendation-list">
        {tools.map((tool) => (
          <li key={`${tool.name}:${tool.url}`}>
            <a
              className="text-link"
              href={tool.url}
              target="_blank"
              rel={tool.affiliate ? "sponsored nofollow noopener noreferrer" : "noopener noreferrer"}
            >
              {tool.name} <span aria-hidden="true">↗</span>
            </a>
            {tool.affiliate && <span className="affiliate-label">Affiliate link</span>}
            {tool.description && <p>{tool.description}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}