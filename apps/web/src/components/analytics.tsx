"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { hasConsent } from "./cookie-consent";

const CONSENT_EVENT = "markala:open-cookie-settings";

/**
 * KVKK m.5 uyumlu analytics loader.
 * Analitik ve pazarlama script'leri yalnızca kullanıcı açık rıza verdikten
 * sonra yüklenir. Consent değişikliklerinde (banner kapatıldığında) sayfa
 * yenilenmesi gerekmez — event listener ile güncellenir.
 *
 * Env değişkenleri:
 *   NEXT_PUBLIC_GA4_ID         — örn: G-XXXXXXXXXX
 *   NEXT_PUBLIC_CLARITY_ID     — Microsoft Clarity proje ID
 *   NEXT_PUBLIC_HOTJAR_ID      — (opsiyonel) Hotjar site ID
 *   NEXT_PUBLIC_GTM_ID         — (opsiyonel) Google Tag Manager
 */
export function Analytics() {
  const [analyticsAllowed, setAnalyticsAllowed] = useState(false);
  const [marketingAllowed, setMarketingAllowed] = useState(false);

  useEffect(() => {
    function checkConsent() {
      setAnalyticsAllowed(hasConsent("analytics"));
      setMarketingAllowed(hasConsent("marketing"));
    }
    checkConsent();
    window.addEventListener(CONSENT_EVENT, checkConsent);
    return () => window.removeEventListener(CONSENT_EVENT, checkConsent);
  }, []);

  const ga4 = process.env.NEXT_PUBLIC_GA4_ID;
  const clarity = process.env.NEXT_PUBLIC_CLARITY_ID;
  const hotjar = process.env.NEXT_PUBLIC_HOTJAR_ID;
  const gtm = process.env.NEXT_PUBLIC_GTM_ID;

  return (
    <>
      {analyticsAllowed && ga4 && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ga4}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${ga4}', { anonymize_ip: true });
            `}
          </Script>
        </>
      )}

      {analyticsAllowed && gtm && (
        <Script id="gtm-init" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${gtm}');
          `}
        </Script>
      )}

      {analyticsAllowed && clarity && (
        <Script id="clarity-init" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${clarity}");
          `}
        </Script>
      )}

      {marketingAllowed && hotjar && (
        <Script id="hotjar-init" strategy="afterInteractive">
          {`
            (function(h,o,t,j,a,r){
              h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
              h._hjSettings={hjid:${hotjar},hjsv:6};
              a=o.getElementsByTagName('head')[0];
              r=o.createElement('script');r.async=1;
              r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
              a.appendChild(r);
            })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
          `}
        </Script>
      )}
    </>
  );
}
