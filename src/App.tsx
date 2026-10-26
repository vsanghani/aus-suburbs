import { Navigate, Route, Routes } from "react-router-dom";
import { RouteErrorBoundary } from "./components/RouteErrorBoundary";
import { SiteFooter } from "./components/SiteFooter";
import { SiteHeader } from "./components/SiteHeader";
import { CouncilPage } from "./pages/CouncilPage";
import { ComparePage } from "./pages/ComparePage";
import { ExplorePage } from "./pages/ExplorePage";
import { HomePage } from "./pages/HomePage";
import { MatchPage } from "./pages/MatchPage";
import { MethodologyPage } from "./pages/MethodologyPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { PrivacyPage } from "./pages/PrivacyPage";
import { RankingPage } from "./pages/RankingPage";
import { RankingsIndexPage } from "./pages/RankingsIndexPage";
import { SearchPage } from "./pages/SearchPage";
import { ShortlistPage } from "./pages/ShortlistPage";
import { StatePage } from "./pages/StatePage";
import { SuburbPage } from "./pages/SuburbPage";

export function App() {
  return (
    <>
      <a className="skip-link" href="#content">
        Skip to content
      </a>
      <SiteHeader />
      <RouteErrorBoundary>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/states/:code" element={<StatePage />} />
          <Route path="/councils/:state/:slug" element={<CouncilPage />} />
          <Route path="/suburbs/:state/:slug" element={<SuburbPage />} />
          <Route path="/rankings" element={<RankingsIndexPage />} />
          <Route path="/rankings/:slug" element={<RankingPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/match" element={<MatchPage />} />
          <Route path="/methodology" element={<MethodologyPage />} />
          <Route path="/sources" element={<Navigate to="/methodology#sources" replace />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/shortlist" element={<ShortlistPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </RouteErrorBoundary>
      <SiteFooter />
    </>
  );
}
