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

    // Use the actual domain instead of just localhost if available
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://oflexcreative.vercel.app';
    const sitePreviewImage = getSetting('site_preview_image_url', '');

    // Determine the final image URL - must be absolute for social scrapers
    let finalImage = image || sitePreviewImage;
    if (!finalImage) {
        finalImage = `${siteUrl}/logo.png`;
    } else if (!finalImage.startsWith('http')) {
        finalImage = `${siteUrl}${finalImage.startsWith('/') ? '' : '/'}${finalImage}`;
    }

    const seo = {
        title: title ? `${title} | ${siteName}` : `${siteName} | ${siteTagline}`,
        description: description || defaultDescription,
        image: finalImage,
        url: `${siteUrl}${pathname || ''}`,
    };

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
