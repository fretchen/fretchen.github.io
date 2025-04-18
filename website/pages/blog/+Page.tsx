import * as React from "react";
import { usePageContext } from "vike-react/usePageContext";

import BlogList from "../../components/BlogList";
import SupportArea from "../../components/SupportArea";

const App: React.FC = function () {
  const pageContext = usePageContext();
  const currentUrl = pageContext.urlPathname;

  // Initialer State ist nur der Pfad (wird auf Server und Client identisch sein)
  const [fullUrl, setFullUrl] = React.useState(currentUrl);

  // Nach der Hydration den vollständigen URL setzen
  React.useEffect(() => {
    setFullUrl(window.location.origin + currentUrl);
  }, [currentUrl]);

  return (
    <div className="Blog">
      <h1>Welcome to my blog!</h1>
      <SupportArea url={fullUrl} />
      <p>It contains notes about all kind of topic, ideas etc.</p>
      <BlogList />
    </div>
  );
};

export default App;
