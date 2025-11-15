// routeMatcher.js - Path-based routing logic

class RouteMatcher {
  constructor(routes, allServers) {
    this.routes = routes || [];
    this.allServers = allServers || [];
  }

  // Match request path to route configuration
  matchRoute(requestPath) {
    for (let route of this.routes) {
      if (this.pathMatches(requestPath, route.path)) {
        // Return servers for this route
        const servers = route.servers.map(index => this.allServers[index]);
        return servers.filter(s => s !== undefined);
      }
    }

    // Default: return all servers
    return this.allServers;
  }

  // Check if path matches pattern (supports wildcards)
  pathMatches(requestPath, pattern) {
    // Convert wildcard pattern to regex
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\//g, '\\/');
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(requestPath);
  }

  // Rewrite path if needed (remove route prefix)
  rewritePath(requestPath, matchedPattern) {
    if (matchedPattern.includes('*')) {
      // Extract the part after the pattern
      const prefix = matchedPattern.replace('/*', '');
      if (requestPath.startsWith(prefix)) {
        return requestPath.substring(prefix.length) || '/';
      }
    }
    return requestPath;
  }
}

export default RouteMatcher;
