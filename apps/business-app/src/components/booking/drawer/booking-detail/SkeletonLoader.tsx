// File: src/components/SkeletonLoader.tsx
import React from "react";
import ContentLoader from "react-content-loader";

const SkeletonLoader = () => (
  <ContentLoader
    speed={2}
    width="100%"
    height={200}
    viewBox="0 0 400 200"
    backgroundColor="#2a2e37"
    foregroundColor="#3a3f4a"
  >
    <rect x="20" y="20" rx="4" ry="4" width="360" height="30" />
    <rect x="20" y="60" rx="4" ry="4" width="360" height="100" />
  </ContentLoader>
);

export default SkeletonLoader;
