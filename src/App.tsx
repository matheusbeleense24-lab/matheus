/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import CardapioPublico from './components/CardapioPublico';
import PainelMaster from './components/PainelMaster';
import PainelAdmin from './components/PainelAdmin';

interface RouteState {
  view: 'public' | 'master' | 'admin';
  slug: string;
}

export default function App() {
  const [route, setRoute] = useState<RouteState>({ view: 'public', slug: '' });

  useEffect(() => {
    function decodeRouteValue(value: string) {
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    }

    function parseRoute() {
      const rawHash = decodeRouteValue(window.location.hash.replace(/^#\/?/, '').trim()).toLowerCase();
      const rawPath = decodeRouteValue(window.location.pathname.replace(/^\//, '').trim()).toLowerCase();

      // Check master route
      if (rawHash === 'admin-master' || rawPath === 'admin-master') {
        setRoute({ view: 'master', slug: '' });
        return;
      }

      // Check admin store route
      if (rawHash === 'admin' || rawPath === 'admin' || rawHash.startsWith('admin/')) {
        setRoute({ view: 'admin', slug: '' });
        return;
      }

      // Parse Hash Route first (highly compatible with iframe previews)
      if (rawHash && rawHash !== '') {
        setRoute({ view: 'public', slug: rawHash });
        return;
      }

      // Fallback to pathname route
      if (rawPath && rawPath !== '') {
        setRoute({ view: 'public', slug: rawPath });
        return;
      }

      // Default Home: keep empty slug instead of forcing Burger do Gordo
      setRoute({ view: 'public', slug: '' });
    }

    parseRoute();

    window.addEventListener('hashchange', parseRoute);
    window.addEventListener('popstate', parseRoute);

    return () => {
      window.removeEventListener('hashchange', parseRoute);
      window.removeEventListener('popstate', parseRoute);
    };
  }, []);

  if (route.view === 'master') {
    return <PainelMaster />;
  }

  if (route.view === 'admin') {
    return <PainelAdmin />;
  }

  return <CardapioPublico storeSlug={route.slug} />;
}



