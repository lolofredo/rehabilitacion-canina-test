export default async function healthHandler(request) {
  if (request.method !== 'GET') {
    return Response.json({
      ok: false,
      error: 'method_not_allowed'
    }, {
      status: 405,
      headers: {
        'Cache-Control': 'no-store'
      }
    });
  }

  return Response.json({
    ok: true,
    service: 'rehabilitacion-canina-api',
    status: 'running'
  }, {
    headers: {
      'Cache-Control': 'no-store'
    }
  });
}

export const config = {
  path: '/api/health'
};
