import * as React from "react";
import { usePageContext } from "vike-react/usePageContext";

import BlogList from "../../components/BlogList";
import SupportArea from "../../components/SupportArea";
const App: React.FC = function () {
  const pageContext = usePageContext();
  console.log(pageContext.urlParsed.origin);
  const currentUrl = pageContext.urlPathname;
  const fullUrl = typeof window !== "undefined" ? window.location.origin + currentUrl : currentUrl;
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
