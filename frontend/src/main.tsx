
  import { createRoot } from "react-dom/client";
  import "./styles/index.css";
  import AppPro from "./app/AppPro.tsx";
  import { I18nProvider } from './app/i18n'
  import ErrorBoundary from './app/components/ErrorBoundary'

  createRoot(document.getElementById("root")!).render(
    <ErrorBoundary>
      <I18nProvider locale="en">
        <AppPro />
      </I18nProvider>
    </ErrorBoundary>
  )
  