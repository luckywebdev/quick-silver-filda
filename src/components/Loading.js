import React from 'react'
import ContentLoader from 'react-content-loader'

const loadingColors = {
  background: '#111722',
  foreground: '#1A212D'
}

const Loading =
  <ContentLoader
    height={200}
    width={"100%"}
    speed={1}
    backgroundColor={loadingColors.background}
    foregroundColor={loadingColors.foreground}
  >
    {/* Only SVG shapes */}
    <rect x="0" y="20" rx="4" ry="4" width="100%" height="40" />
    <rect x="0" y="80" rx="4" ry="4" width="100%" height="40" />
    <rect x="0" y="140" rx="4" ry="4" width="100%" height="40" />
  </ContentLoader>

export default Loading
