import Script from "next/script";

/**
 * Tüm analytics script'leri — sadece env'de tanımlıysa render edilir.
 * Client tarafa Script bileşeniyle yüklenir, performansa minimal etki.
 *
 * Google Consent Mode v2 ile uyumlu: gtag varsayılan olarak `denied`
 * başlar, CookieConsent component'i onay sonrası `update` ile aktifleştirir.
 *
 * Env değişkenleri:
 *   NEXT_PUBLIC_GA4_ID         — örn: G-XXXXXXXXXX
 *   NEXT_PUBLIC_META_PIXEL_ID  — Meta (Facebook) Pixel ID
 *   NEXT_PUBLIC_CLARITY_ID     — Microsoft Clarity proje ID
 *   NEXT_PUBLIC_HOTJAR_ID      — (opsiyonel) Hotjar site ID
 *   NEXT_PUBLIC_GTM_ID         — (opsiyonel) Google Tag Manager
 *
 * NOT: Script'ler consent-aware değil — fbq/gtag objeleri her zaman yüklenir.
 * Consent kontrolü lib/analytics.ts'deki track()/fbtrack() wrapper'larındadır.
 * Bu sayede kullanıcı sonradan onay verirse script tekrar yüklenmez.
 */
export function Analytics() {
  const ga4 = process.env.NEXT_PUBLIC_GA4_ID;
  const metaPixel = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const clarity = process.env.NEXT_PUBLIC_CLARITY_ID;
  const hotjar = process.env.NEXT_PUBLIC_HOTJAR_ID;
  const gtm = process.env.NEXT_PUBLIC_GTM_ID;

  return (
    <>
      {ga4 && (
        <>
          {/* Consent Mode v2 — KVKK/GDPR: tüm sinyaller varsayılan denied */}
          <Script id="gtag-consent-default" strategy="beforeInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('consent', 'default', {
                ad_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied',
                analytics_storage: 'denied',
                functionality_storage: 'denied',
                personalization_storage: 'denied',
                security_storage: 'granted',
                wait_for_update: 500,
              });
              gtag('set', 'ads_data_redaction', true);
              gtag('set', 'url_passthrough', true);
            `}
          </Script>
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

      {gtm && (
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

      {clarity && (
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

      {hotjar && (
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

      {metaPixel && (
        <Script id="meta-pixel-init" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${metaPixel}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}
    </>
  );
}
