import { Helmet } from 'react-helmet-async';
import { useSiteSettings } from '@/hooks/useSiteSettings';

interface SEOProps {
    title?: string;
    description?: string;
    image?: string;
    article?: boolean;
    pathname?: string;
}

export const SEO = ({ title, description, image, article, pathname }: SEOProps) => {
    const { getSetting } = useSiteSettings();

    const siteName = getSetting('site_name', 'Oflex Creative Studio');
    const siteTagline = getSetting('site_tagline', 'Premium Digital Products & Design Services');
    const defaultDescription = getSetting('site_description', siteTagline);
    const siteUrl = window.location.origin;
    const sitePreviewImage = getSetting('site_preview_image_url', '/logo.png');

    const seo = {
        title: title ? `${title} | ${siteName}` : `${siteName} | ${siteTagline}`,
        description: description || defaultDescription,
        image: image || sitePreviewImage,
        url: `${siteUrl}${pathname || ''}`,
    };

    // Ensure image URL is absolute
    if (seo.image && !seo.image.startsWith('http')) {
        seo.image = `${siteUrl}${seo.image}`;
    }

    return (
        <Helmet>
            <title>{seo.title}</title>
            <meta name="description" content={seo.description} />
            <meta name="image" content={seo.image} />

            {seo.url && <meta property="og:url" content={seo.url} />}
            {(article ? true : null) && <meta property="og:type" content="article" />}
            {seo.title && <meta property="og:title" content={seo.title} />}
            {seo.description && (
                <meta property="og:description" content={seo.description} />
            )}
            {seo.image && <meta property="og:image" content={seo.image} />}

            <meta name="twitter:card" content="summary_large_image" />
            {seo.title && <meta name="twitter:title" content={seo.title} />}
            {seo.description && (
                <meta name="twitter:description" content={seo.description} />
            )}
            {seo.image && <meta name="twitter:image" content={seo.image} />}
        </Helmet>
    );
};
