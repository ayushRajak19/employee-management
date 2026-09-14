import { StrictMode } from "react"; import { createRoot } from "react-dom/client"; import { QueryClient, QueryClientProvider } from "@tanstack/react-query"; import { BrowserRouter } from "react-router-dom"; import { App } from "./App"; import { AuthProvider } from "./features/auth/AuthProvider"; import { AppErrorBoundary, recoverStaleChunk } from "./components/AppErrorBoundary"; import "leaflet/dist/leaflet.css"; import "./index.css";
const queryClient = new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 }, mutations: { retry: false } } });
if (typeof window !== "undefined" && (window.location.search.includes("_reload=") || window.location.search.includes("_v="))) {
  const cleanUrl = new URL(window.location.href);
  cleanUrl.searchParams.delete("_reload");
  cleanUrl.searchParams.delete("_v");
  window.history.replaceState({}, "", cleanUrl.pathname + (cleanUrl.search ? cleanUrl.search : "") + cleanUrl.hash);
}

window.addEventListener("vite:preloadError", (event) => { event.preventDefault(); recoverStaleChunk(event.payload); });
createRoot(document.getElementById("root")!).render(<StrictMode><AppErrorBoundary><QueryClientProvider client={queryClient}><BrowserRouter><AuthProvider><App/></AuthProvider></BrowserRouter></QueryClientProvider></AppErrorBoundary></StrictMode>);
