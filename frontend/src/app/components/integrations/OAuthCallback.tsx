import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useIntl } from 'react-intl';
import client from '../../../api/client'
// No direct finalize endpoint on frontend; backend callbacks set the connector status.

export default function OAuthCallback() {
  const location = useLocation();
  const navigate = useNavigate();
  const intl = useIntl();
  const [message, setMessage] = useState(intl.formatMessage({ id: 'integrations.oauth.processing', defaultMessage: 'Processing...' }));

  useEffect(() => {
    // expecting query like ?connector=google&code=...
    const params = new URLSearchParams(location.search);
    const connector = params.get('connector');
    if (!connector) {
      setMessage(intl.formatMessage({ id: 'integrations.oauth.invalidParams', defaultMessage: 'Invalid parameters' }));
      setTimeout(() => navigate('/integrations'), 1500);
      return;
    }

    // Poll backend status until connected (backend handles the provider callback)
    let elapsed = 0;
    const interval = 1500;
    const timeout = 60_000; // 60s
    const poll = setInterval(async () => {
      try {
        const { data: status } = await client.get(`/connectors/${connector}/status`)
        if (status.is_connected || status.status === 'connected') {
          clearInterval(poll);
          setMessage(intl.formatMessage({ id: 'integrations.oauth.completed', defaultMessage: 'Connection completed' }));
          setTimeout(() => navigate('/integrations'), 900);
          return;
        }
      } catch (e) {
        // ignore
      }
      elapsed += interval;
      if (elapsed >= timeout) {
        clearInterval(poll);
        setMessage(intl.formatMessage({ id: 'integrations.oauth.timeout', defaultMessage: 'Timeout reached. Check the connection in Integrations.' }));
        setTimeout(() => navigate('/integrations'), 2000);
      }
    }, interval);
  }, [intl, location, navigate]);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="bg-[#1A1D28] rounded-xl p-12 border border-[#2A2E3D] text-center">
        <h1 className="text-2xl font-semibold text-white">{intl.formatMessage({ id: 'integrations.oauth.title', defaultMessage: 'OAuth' })}</h1>
        <p className="text-white/60 mt-4">{message}</p>
      </div>
    </div>
  );
}
