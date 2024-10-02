// Import required modules from Clerk and Next.js
import { authMiddleware } from '@clerk/nextjs';
import { NextResponse } from 'next/server';

// Export the middleware configuration
export default authMiddleware({
  // Define routes that do not require authentication
  publicRoutes: ['/site', '/api/uploadthing'],

  // Hook executed before authentication checks (currently empty)
  async beforeAuth(auth, req) {},

  // Hook executed after authentication checks
  async afterAuth(auth, req) {
    // Get the URL of the request
    const url = req.nextUrl;

    // Convert URL search parameters to a string
    const searchParams = url.searchParams.toString();

    // Get the request headers (including hostname)
    let hostname = req.headers;

    // Combine the path and search parameters to form the full path
    const pathWithSearchParams = `${url.pathname}${
      searchParams.length > 0 ? `${searchParams}` : ''
    }`;

    // Extract the custom subdomain if present
    const customSubdomain = hostname
      // Access the 'host' header from the request headers. The 'host' header typically contains the full domain, including the subdomain if present.
      .get('host')
      // Split the 'host' value using the main domain from environment variables (NEXT_PUBLIC_DOMAIN).
      // This split operation will break the 'host' string into an array where:
      // - The first element contains the subdomain (if present).
      // - The second element will contain the main domain.
      // For example, if the 'host' is 'sub.example.com' and 'NEXT_PUBLIC_DOMAIN' is 'example.com',
      // splitting will yield ['sub', 'example.com'].
      ?.split(`${process.env.NEXT_PUBLIC_DOMAIN}`)
      // Filter out any empty strings from the resulting array.
      // This step ensures that only meaningful values (like subdomains) are kept,
      // excluding any empty strings that might result from the split operation.
      .filter(Boolean)[0];
    // Access the first element of the filtered array.
    // This should be the custom subdomain if it exists.
    // If the split operation did not find a subdomain, this will be `undefined`.

    // If a custom subdomain is found, rewrite the URL to include the subdomain
    if (customSubdomain) {
      return NextResponse.rewrite(
        new URL(`${customSubdomain}${pathWithSearchParams}`, req.url)
      );
    }

    // If the path is '/sign-in' or '/sign-up', redirect to '/agency/sign-in'
    if (url.pathname === '/sign-in' || url.pathname === '/sign-up') {
      return NextResponse.rewrite(new URL(`/agency/sign-in`, req.url));
    }

    // If the path is '/' or '/site' and the host matches the domain, redirect to '/site'
    if (
      url.pathname === '/' ||
      (url.pathname === '/site' && url.host === process.env.NEXT_PUBLIC_DOMAIN)
    ) {
      return NextResponse.rewrite(new URL('/site', req.url));
    }

    // If the path starts with '/agency' or '/subaccount', keep the URL as is
    if (
      url.pathname.startsWith('/agency') ||
      url.pathname.startsWith('/subaccount')
    ) {
      return NextResponse.rewrite(new URL(`${pathWithSearchParams}`, req.url));
    }
  },
});

// Define the routes this middleware should apply to
export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
