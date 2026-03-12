// import { withAuth } from 'next-auth/middleware';
// import { NextResponse } from 'next/server';

// export default withAuth(
//   function middleware(req) {
//     const { pathname } = req.nextUrl;
//     const isLoggedIn = !!req.nextauth.token;

//     // 已登录用户访问登录/注册页面，重定向到首页
//     if (isLoggedIn && (pathname === '/login' || pathname === '/register')) {
//       return NextResponse.redirect(new URL('/', req.url));
//     }

//     return NextResponse.next();
//   },
//   {
//     callbacks: {
//       authorized({ req, token }) {
//         // 公开路由不需要认证
//         if (req.nextUrl.pathname.startsWith('/api/auth')) {
//           return true;
//         }
//         // 其他路由需要登录
//         return !!token;
//       },
//     },
//     pages: {
//       signIn: '/login',
//     },
//   }
// );

// export const config = {
//   matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
// };




import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const isLoggedIn = !!req.nextauth.token;

    // 已登录用户访问登录/注册页面，重定向到首页
    if (isLoggedIn && (pathname === '/login' || pathname === '/register')) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ req, token }) {
        // 公开路由列表
        const publicPaths = [
          '/login',
          '/register',
          '/', // 如果首页也不需要登录，可以加这里
        ];
        
        // 静态资源和API始终公开
        if (
          req.nextUrl.pathname.startsWith('/api/auth') ||
          req.nextUrl.pathname.startsWith('/_next') ||
          req.nextUrl.pathname.includes('.')
        ) {
          return true;
        }
        
        // 如果是公开路径，不需要登录
        if (publicPaths.includes(req.nextUrl.pathname)) {
          return true;
        }
        
        // 其他路径需要登录
        return !!token;
      },
    },
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};