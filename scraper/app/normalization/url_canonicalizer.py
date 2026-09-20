import re
from urllib.parse import urlparse, parse_qsl, urlencode, urlunparse
from typing import Set


TRACKING_PARAMS: Set[str] = {
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
    'utm_id', 'utm_reader', 'utm_social', 'utm_social_type',
    'fbclid', 'gclid', 'msclkid', 'dclid', 'ttclid', 'li_fat_id',
    'igshid', 'yclid', 'epik', 'mc_cid', 'mc_eid', '_ga',
    'ref', 'referrer', 'source', 'medium', 'campaign',
    'share', 'shared', 'via', 'platform', 'device',
    'outputType', 'amp', '__twitter_impression', '__fb_native_link',
    's', 't', 'ref_src', 'ref_url', 'trk', 'trk_contact',
    'trk_info', 'trkModule', 'trk_contact', 'mod', 'origin',
    'cmpid', 'utm_source', 'utm_medium', 'utm_campaign',
    'newsletter', 'email_id', 'email_source', 'email_campaign',
    'cta', 'ctk', 'ck_subscriber_id', 'sr_share', 'emci', 'emdi',
}

PARAMS_TO_KEEP_PREFIXES = ('id', 'article', 'post', 'slug', 'page')


def should_keep_param(key: str, value: str) -> bool:
    key_lower = key.lower()
    if key_lower in TRACKING_PARAMS:
        return False
    if any(key_lower.startswith(prefix) for prefix in PARAMS_TO_KEEP_PREFIXES):
        return True
    if re.match(r'^[a-z]+_\w+$', key_lower) and len(key) > 10:
        return False
    return True


def canonicalize_url(url: str) -> str:
    try:
        parsed = urlparse(url)
        scheme = parsed.scheme.lower()
        netloc = parsed.netloc.lower()

        if netloc.startswith('www.'):
            netloc = netloc[4:]

        query_params = parse_qsl(parsed.query, keep_blank_values=True)
        filtered_params = [
            (k, v) for k, v in query_params
            if should_keep_param(k, v)
        ]
        new_query = urlencode(filtered_params, doseq=True)

        path = parsed.path.rstrip('/')
        if not path:
            path = '/'

        new_parsed = parsed._replace(
            scheme=scheme,
            netloc=netloc,
            path=path,
            query=new_query,
            fragment=''
        )

        return urlunparse(new_parsed)
    except Exception:
        return url


def normalize_source_name(name: str) -> str:
    return name.strip().lower().replace(' ', '_')